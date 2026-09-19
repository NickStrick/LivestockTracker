/**
 * Data-access layer. Every function is async and returns plain JSON-safe data so
 * swapping mock -> real fetch() calls (or porting to React Native) only touches
 * this file. Function names follow the swagger operations where one exists.
 */
import {
  MOCK_NOW,
  animals,
  audit,
  breeding,
  getById,
  identifiers,
  observations,
  positions,
  ranches,
  ringAcres,
  vaccinations,
  weights,
  zones,
} from "./mock/seed";
import type {
  Alert,
  AnimalOut,
  AuditEventOut,
  BreedingEvent,
  DashboardData,
  GpsPosition,
  HealthObservation,
  IdentifierOut,
  LineageNode,
  RanchDetail,
  RanchSummary,
  Vaccination,
  WeightRecord,
  ZoneOut,
  ZoneType,
} from "./types";

const DAY = 86_400_000;
const NOW = MOCK_NOW.getTime();

// ---- animals -------------------------------------------------------------

/** GET /animals */
export async function listAnimals(params: { ranch_id?: string; status_filter?: string } = {}): Promise<AnimalOut[]> {
  return animals.filter(
    (a) => (!params.ranch_id || a.ranch_id === params.ranch_id) && (!params.status_filter || a.status === params.status_filter),
  );
}

/** GET /animals/{id} */
export async function getAnimal(id: string): Promise<AnimalOut | null> {
  return getById(id) ?? null;
}

/** GET /animals/{id}/lineage (shape is PROVISIONAL) */
export async function getLineage(id: string, depth = 3): Promise<LineageNode | null> {
  const build = (aid: string | null, d: number): LineageNode | null => {
    const a = aid ? getById(aid) : null;
    if (!a) return null;
    return {
      id: a.id,
      tag_id: a.tag_id,
      gender: a.gender,
      dob: a.dob,
      sire: d > 0 ? build(a.sire_id, d - 1) : null,
      dam: d > 0 ? build(a.dam_id, d - 1) : null,
    };
  };
  return build(id, depth);
}

export async function listOffspring(id: string): Promise<AnimalOut[]> {
  return animals.filter((a) => a.sire_id === id || a.dam_id === id);
}

/** GET /animals/{id}/audit-trail */
export async function getAnimalAuditTrail(id: string): Promise<AuditEventOut[]> {
  return audit.filter((e) => e.animal_id === id);
}

/** PROVISIONAL: no list-identifiers endpoint in the swagger yet. */
export async function listIdentifiers(animalId: string): Promise<IdentifierOut[]> {
  return identifiers.filter((i) => i.animal_id === animalId);
}

// PROVISIONAL: health-service / gps-service reads
export async function listVaccinations(animalId: string): Promise<Vaccination[]> {
  return vaccinations.filter((v) => v.animal_id === animalId).sort((a, b) => b.administered_at.localeCompare(a.administered_at));
}
export async function listObservations(animalId: string): Promise<HealthObservation[]> {
  return observations.filter((o) => o.animal_id === animalId).sort((a, b) => b.observed_at.localeCompare(a.observed_at));
}
export async function listBreeding(animalId: string): Promise<BreedingEvent[]> {
  return breeding.filter((b) => b.animal_id === animalId).sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));
}
export async function listWeights(animalId: string): Promise<WeightRecord[]> {
  return weights.filter((w) => w.animal_id === animalId).sort((a, b) => a.weighed_at.localeCompare(b.weighed_at));
}
export async function getPosition(animalId: string): Promise<GpsPosition | null> {
  return positions.find((p) => p.animal_id === animalId) ?? null;
}

// ---- ranches & zones -----------------------------------------------------

function summarize(r: RanchDetail): RanchSummary {
  return {
    ...r,
    head_count: animals.filter((a) => a.ranch_id === r.id && a.status === "active").length,
    zone_count: zones.filter((z) => z.ranch_id === r.id && z.active).length,
    breach_count: positions.filter((p) => p.ranch_id === r.id && !p.inside_boundary).length,
    area_acres: ringAcres(r.boundary),
  };
}

/** GET /ranches (boundary + counts are PROVISIONAL extras) */
export async function listRanches(): Promise<RanchSummary[]> {
  return ranches.map(summarize);
}

/** GET /ranches/{id} */
export async function getRanch(id: string): Promise<RanchSummary | null> {
  const r = ranches.find((x) => x.id === id);
  return r ? summarize(r) : null;
}

/** GET /ranches/{id}/zones */
export async function listZones(ranchId: string, zone_type?: ZoneType): Promise<ZoneOut[]> {
  return zones.filter((z) => z.ranch_id === ranchId && (!zone_type || z.zone_type === zone_type));
}

/** GET /ranches/{id}/audit-trail */
export async function getRanchAuditTrail(ranchId: string): Promise<AuditEventOut[]> {
  return audit.filter((e) => e.ranch_id === ranchId);
}

export async function listRanchPositions(ranchId: string): Promise<GpsPosition[]> {
  return positions.filter((p) => p.ranch_id === ranchId);
}

/** animal_id -> tag_id, for linking audit events to animals. */
export async function getAnimalTags(): Promise<Record<string, string>> {
  return Object.fromEntries(animals.map((a) => [a.id, a.tag_id]));
}

/** All events across ranches (cross-service audit feed). */
export async function listAllAuditEvents(): Promise<AuditEventOut[]> {
  return audit;
}

// ---- dashboard -----------------------------------------------------------

export async function getDashboard(): Promise<DashboardData> {
  const active = animals.filter((a) => a.status === "active");
  const activeIds = new Set(active.map((a) => a.id));

  // Latest vaccination per (animal, vaccine) decides what is overdue / due soon.
  const latest = new Map<string, Vaccination>();
  for (const v of vaccinations) {
    if (!activeIds.has(v.animal_id)) continue;
    const k = v.animal_id + v.vaccine;
    const cur = latest.get(k);
    if (!cur || v.administered_at > cur.administered_at) latest.set(k, v);
  }
  const overdue = [...latest.values()].filter((v) => new Date(v.next_due_at).getTime() < NOW);
  const dueSoon = [...latest.values()].filter((v) => {
    const t = new Date(v.next_due_at).getTime();
    return t >= NOW && t <= NOW + 30 * DAY;
  });
  const breaches = audit.filter((e) => e.event_type === "geofence_breach" && NOW - new Date(e.occurred_at).getTime() <= 7 * DAY);

  // Average weight per month, over the last six months.
  const byMonth = new Map<string, number[]>();
  for (const w of weights) {
    const key = w.weighed_at.slice(0, 7);
    byMonth.set(key, [...(byMonth.get(key) ?? []), w.weight_lb]);
  }
  const weight_trend = [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, xs]) => ({
      month: new Date(k + "-15").toLocaleString("en-US", { month: "short" }),
      avg_lb: Math.round(xs.reduce((s, x) => s + x, 0) / xs.length),
    }));
  const last = weight_trend.at(-1)?.avg_lb ?? 0;
  const prev = weight_trend.at(-2)?.avg_lb ?? last;

  const composition = ["cow", "heifer", "steer", "bull"].map((g) => ({
    label: g[0].toUpperCase() + g.slice(1) + "s",
    value: active.filter((a) => a.gender === g).length,
  }));

  // Events per week, last 8 weeks.
  const activity_by_week = Array.from({ length: 8 }, (_, i) => {
    const end = NOW - (7 - i) * 7 * DAY;
    const start = end - 7 * DAY;
    return {
      week: new Date(end).toLocaleString("en-US", { month: "short", day: "numeric" }),
      events: audit.filter((e) => {
        const t = new Date(e.occurred_at).getTime();
        return t > start && t <= end && e.event_type !== "animal_created" && e.event_type !== "identifier_added";
      }).length,
    };
  });

  const tag = (id: string) => getById(id)?.tag_id ?? id;
  const alerts: Alert[] = [
    ...breaches.map((e) => ({
      id: e.id,
      kind: "geofence_breach" as const,
      animal_id: e.animal_id!,
      tag_id: tag(e.animal_id!),
      title: "Outside ranch boundary",
      detail: "GPS ping detected beyond the perimeter",
      at: e.occurred_at,
    })),
    ...overdue.map((v) => ({
      id: v.id,
      kind: "vaccination_overdue" as const,
      animal_id: v.animal_id,
      tag_id: tag(v.animal_id),
      title: `${v.vaccine} overdue`,
      detail: `Was due ${new Date(v.next_due_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      at: v.next_due_at,
    })),
    ...observations
      .filter((o) => o.severity === "high" && NOW - new Date(o.observed_at).getTime() < 21 * DAY && activeIds.has(o.animal_id))
      .map((o) => ({
        id: o.id,
        kind: "health" as const,
        animal_id: o.animal_id,
        tag_id: tag(o.animal_id),
        title: "High-severity health note",
        detail: o.notes,
        at: o.observed_at,
      })),
  ]
    .sort((a, b) => (a.kind === "geofence_breach" ? -1 : 0) - (b.kind === "geofence_breach" ? -1 : 0) || b.at.localeCompare(a.at))
    .slice(0, 8);

  return {
    kpis: {
      active_head: active.length,
      vaccinations_overdue: overdue.length,
      vaccinations_due_soon: dueSoon.length,
      breaches_7d: breaches.length,
      avg_weight_lb: last,
      avg_weight_delta_pct: prev ? +(((last - prev) / prev) * 100).toFixed(1) : 0,
    },
    weight_trend,
    composition: composition.filter((c) => c.value > 0),
    activity_by_week,
    alerts,
    recent_events: audit.slice(0, 8),
    ranches: ranches.map(summarize),
  };
}
