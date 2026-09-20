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
  documents,
  getById,
  identifiers,
  movements,
  observations,
  positions,
  ranches,
  vaccinations,
  weights,
  zones,
} from "./mock/seed";
import { distanceToRingMeters, ringAcres } from "./geo";
import { animalLabel } from "./format";
import type {
  Alert,
  AlertSeverity,
  AnimalOut,
  AuditEventOut,
  BreachRow,
  BreedingEvent,
  ComplianceSummary,
  DocStatus,
  DocumentView,
  DashboardData,
  GpsPosition,
  HealthObservation,
  IdentifierOut,
  LineageNode,
  MovementView,
  RanchDetail,
  RanchSummary,
  Vaccination,
  VaccinationRow,
  WeightRecord,
  ZoneOut,
  ZoneType,
} from "./types";

const DAY = 86_400_000;
const NOW = MOCK_NOW.getTime();

/** Only animals currently in the herd generate boundary alerts and show up on live maps. */
const isActiveAnimal = (id: string | null) => !!id && getById(id)?.status === "active";

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
      nickname: a.nickname ?? null,
      sire: d > 0 ? build(a.sire_id, d - 1) : null,
      dam: d > 0 ? build(a.dam_id, d - 1) : null,
    };
  };
  return build(id, depth);
}

export type StatusChange = { ok: true } | { ok: false; error: "not_found" | "not_active" | "not_sold" };

/**
 * PATCH /animals/{id} { status } (MOCK). Changes the in-memory example data so the whole app reflects
 * it; this resets when the server restarts. Replace with a real request when the backend exists.
 * Only active -> sold and sold -> active (undo) are supported here.
 */
export async function setAnimalStatus(id: string, status: "sold" | "active"): Promise<StatusChange> {
  const a = getById(id);
  if (!a) return { ok: false, error: "not_found" };
  if (status === "sold" && a.status !== "active") return { ok: false, error: "not_active" };
  if (status === "active" && a.status !== "sold") return { ok: false, error: "not_sold" };
  a.status = status;
  audit.unshift({
    id: `aud_s${audit.length}`,
    animal_id: a.id,
    ranch_id: a.ranch_id,
    event_type: "animal_updated",
    event_data: { status },
    actor_id: "usr_maria.gomez",
    occurred_at: MOCK_NOW.toISOString(),
  });
  return { ok: true };
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
  return isActiveAnimal(animalId) ? (positions.find((p) => p.animal_id === animalId) ?? null) : null;
}

// ---- ranches & zones -----------------------------------------------------

function summarize(r: RanchDetail): RanchSummary {
  return {
    ...r,
    head_count: animals.filter((a) => a.ranch_id === r.id && a.status === "active").length,
    zone_count: zones.filter((z) => z.ranch_id === r.id && z.active).length,
    breach_count: positions.filter((p) => p.ranch_id === r.id && !p.inside_boundary && isActiveAnimal(p.animal_id)).length,
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
  return positions.filter((p) => p.ranch_id === ranchId && isActiveAnimal(p.animal_id));
}

/** animal_id -> display label (tag, plus nickname when set), for linking audit events and map markers to animals. */
export async function getAnimalTags(): Promise<Record<string, string>> {
  return Object.fromEntries(animals.map((a) => [a.id, animalLabel(a.tag_id, a.nickname)]));
}

/** All events across ranches (cross-service audit feed). */
export async function listAllAuditEvents(): Promise<AuditEventOut[]> {
  return audit;
}

// ---- compliance (PROVISIONAL) -------------------------------------------

function docView(d: (typeof documents)[number]): DocumentView {
  if (!d.expires_at) return { ...d, status: "valid", days_left: null };
  const days = Math.ceil((new Date(d.expires_at).getTime() - NOW) / DAY);
  const done = d.movement_id ? movements.find((m) => m.id === d.movement_id)?.status === "completed" : false;
  const status: DocStatus = done ? "archived" : days < 0 ? "expired" : days <= 30 ? "expiring" : "valid";
  return { ...d, status, days_left: days };
}

function movementView(m: (typeof movements)[number]): MovementView {
  const docs = m.document_ids.map((id) => documents.find((d) => d.id === id)).filter(Boolean) as typeof documents;
  const cvis = docs.filter((d) => d.doc_type === "cvi");
  const issues: string[] = [];
  if (m.kind === "interstate" && cvis.length === 0) issues.push("No CVI attached to an interstate movement");
  for (const c of cvis) {
    if (c.expires_at && new Date(c.expires_at).getTime() < new Date(m.moved_at).getTime()) issues.push(`${c.title} expires before the movement date`);
  }
  return { ...m, issues };
}

/** GET /movements */
export async function listMovements(params: { ranch_id?: string; status?: string } = {}): Promise<MovementView[]> {
  return movements
    .filter((m) => (!params.ranch_id || m.ranch_id === params.ranch_id) && (!params.status || m.status === params.status))
    .map(movementView);
}
export async function getMovement(id: string): Promise<MovementView | null> {
  const m = movements.find((x) => x.id === id);
  return m ? movementView(m) : null;
}
export async function listAnimalMovements(animalId: string): Promise<MovementView[]> {
  return movements.filter((m) => m.animal_ids.includes(animalId)).map(movementView);
}

/** GET /documents */
export async function listDocuments(params: { ranch_id?: string; doc_type?: string } = {}): Promise<DocumentView[]> {
  return documents.filter((d) => (!params.ranch_id || d.ranch_id === params.ranch_id) && (!params.doc_type || d.doc_type === params.doc_type)).map(docView);
}
export async function getDocument(id: string): Promise<DocumentView | null> {
  const d = documents.find((x) => x.id === id);
  return d ? docView(d) : null;
}
export async function listAnimalDocuments(animalId: string): Promise<DocumentView[]> {
  return documents.filter((d) => d.animal_ids.includes(animalId)).map(docView);
}

export async function getComplianceSummary(): Promise<ComplianceSummary> {
  const views = movements.map(movementView);
  const docs = documents.map(docView);
  return {
    movements_30d: movements.filter((m) => m.status !== "pending" && NOW - new Date(m.moved_at).getTime() <= 30 * DAY && new Date(m.moved_at).getTime() <= NOW).length,
    pending_movements: movements.filter((m) => m.status === "pending").length,
    flagged_movements: views.filter((m) => m.issues.length > 0).length,
    docs_total: docs.length,
    docs_expiring: docs.filter((d) => d.status === "expiring").length,
    docs_expired: docs.filter((d) => d.status === "expired").length,
  };
}

// ---- alerts --------------------------------------------------------------

/** Latest vaccination per (active animal, vaccine): which are past due / due within 30 days. */
function vaccinationStatus() {
  const activeIds = new Set(animals.filter((a) => a.status === "active").map((a) => a.id));
  const latest = new Map<string, Vaccination>();
  for (const v of vaccinations) {
    if (!activeIds.has(v.animal_id)) continue;
    const k = v.animal_id + v.vaccine;
    const cur = latest.get(k);
    if (!cur || v.administered_at > cur.administered_at) latest.set(k, v);
  }
  const all = [...latest.values()];
  return {
    activeIds,
    overdue: all.filter((v) => new Date(v.next_due_at).getTime() < NOW),
    dueSoon: all.filter((v) => {
      const t = new Date(v.next_due_at).getTime();
      return t >= NOW && t <= NOW + 30 * DAY;
    }),
  };
}

const SEVERITY_RANK: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };

/** PROVISIONAL: alerts are derived here; a real backend would own and persist them. */
function buildAlerts(): Alert[] {
  const { activeIds, overdue, dueSoon } = vaccinationStatus();
  const tag = (id: string) => {
    const a = getById(id);
    return a ? animalLabel(a.tag_id, a.nickname) : id;
  };
  const ranchOf = (id: string) => getById(id)?.ranch_id ?? "";
  const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

  const breaches: Alert[] = audit
    .filter((e) => e.event_type === "geofence_breach" && isActiveAnimal(e.animal_id) && NOW - new Date(e.occurred_at).getTime() <= 7 * DAY)
    .map((e) => ({
      id: e.id,
      kind: "geofence_breach",
      severity: "critical",
      subject: tag(e.animal_id!),
      href: `/breaches`,
      ranch_id: e.ranch_id ?? ranchOf(e.animal_id!),
      title: "Outside ranch boundary",
      detail: "GPS ping detected beyond the perimeter",
      at: e.occurred_at,
    }));

  const health: Alert[] = observations
    .filter((o) => o.severity === "high" && NOW - new Date(o.observed_at).getTime() < 21 * DAY && activeIds.has(o.animal_id))
    .map((o) => ({
      id: o.id,
      kind: "health",
      severity: "critical",
      subject: tag(o.animal_id),
      href: `/animals/${o.animal_id}`,
      ranch_id: ranchOf(o.animal_id),
      title: "High-severity health note",
      detail: o.notes,
      at: o.observed_at,
    }));

  const vacc = (list: Vaccination[], kind: "vaccination_overdue" | "vaccination_due"): Alert[] =>
    list.map((v) => ({
      id: v.id,
      kind,
      severity: kind === "vaccination_overdue" ? "warning" : "info",
      subject: tag(v.animal_id),
      href: `/animals/${v.animal_id}`,
      ranch_id: ranchOf(v.animal_id),
      title: kind === "vaccination_overdue" ? `${v.vaccine} overdue` : `${v.vaccine} due soon`,
      detail: `${kind === "vaccination_overdue" ? "Was due" : "Due"} ${fmt(v.next_due_at)}`,
      at: v.next_due_at,
    }));

  const docs: Alert[] = documents
    .map(docView)
    .filter((d) => d.status === "expired" || d.status === "expiring")
    .map((d) => ({
      id: d.id,
      kind: d.status === "expired" ? "document_expired" : "document_expiring",
      severity: d.status === "expired" ? "warning" : "info",
      subject: d.title,
      href: `/compliance/documents/${d.id}`,
      ranch_id: d.ranch_id,
      title: d.status === "expired" ? "Document expired" : "Document expiring",
      detail: d.status === "expired" ? `Expired ${fmt(d.expires_at!)}` : `Expires ${fmt(d.expires_at!)}`,
      at: d.expires_at!,
    }));

  const moves: Alert[] = movements
    .map(movementView)
    .filter((m) => m.issues.length > 0)
    .map((m) => ({
      id: m.id,
      kind: "movement_issue",
      severity: "critical",
      subject: `${m.origin.split(",")[0]} → ${m.destination.split(",")[0]}`,
      href: `/compliance/movements/${m.id}`,
      ranch_id: m.ranch_id,
      title: "Movement compliance issue",
      detail: m.issues[0],
      at: m.moved_at,
    }));

  // Most severe first; within a severity, newest first (soonest-due first for upcoming items).
  return [...breaches, ...health, ...moves, ...vacc(overdue, "vaccination_overdue"), ...docs, ...vacc(dueSoon, "vaccination_due")].sort(
    (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || (a.severity === "info" ? a.at.localeCompare(b.at) : b.at.localeCompare(a.at)),
  );
}

/** PROVISIONAL: no alerts endpoint exists yet. */
export async function listAlerts(): Promise<Alert[]> {
  return buildAlerts();
}

// ---- drill-downs ---------------------------------------------------------

/** Latest dose of each vaccine per active animal, most overdue first. */
export async function listVaccinationStatus(): Promise<VaccinationRow[]> {
  const activeIds = new Set(animals.filter((a) => a.status === "active").map((a) => a.id));
  const latest = new Map<string, Vaccination>();
  for (const v of vaccinations) {
    if (!activeIds.has(v.animal_id)) continue;
    const k = v.animal_id + v.vaccine;
    const cur = latest.get(k);
    if (!cur || v.administered_at > cur.administered_at) latest.set(k, v);
  }
  const ranchName = new Map(ranches.map((r) => [r.id, r.name]));
  return [...latest.values()]
    .map((v): VaccinationRow => {
      const a = getById(v.animal_id)!;
      const days = Math.ceil((new Date(v.next_due_at).getTime() - NOW) / DAY);
      return {
        id: v.id,
        animal_id: a.id,
        tag_id: a.tag_id,
        nickname: a.nickname ?? null,
        ranch_id: a.ranch_id,
        ranch_name: ranchName.get(a.ranch_id) ?? "",
        vaccine: v.vaccine,
        administered_at: v.administered_at,
        administered_by: v.administered_by,
        next_due_at: v.next_due_at,
        state: days < 0 ? "overdue" : days <= 30 ? "due_soon" : "ok",
        days,
      };
    })
    .sort((a, b) => a.days - b.days);
}

/** Boundary breaches in the last 7 days, newest first, with distance beyond the perimeter. */
export async function listBreaches(): Promise<BreachRow[]> {
  const ranchById = new Map(ranches.map((r) => [r.id, r]));
  return audit
    .filter((e) => e.event_type === "geofence_breach" && isActiveAnimal(e.animal_id) && NOW - new Date(e.occurred_at).getTime() <= 7 * DAY)
    .map((e): BreachRow => {
      const ranch = ranchById.get(e.ranch_id ?? "")!;
      const d = e.event_data as { lon: number; lat: number };
      return {
        id: e.id,
        animal_id: e.animal_id!,
        tag_id: getById(e.animal_id!)?.tag_id ?? "",
        nickname: getById(e.animal_id!)?.nickname ?? null,
        ranch_id: ranch.id,
        ranch_name: ranch.name,
        occurred_at: e.occurred_at,
        lon: d.lon,
        lat: d.lat,
        distance_m: distanceToRingMeters(d.lon, d.lat, ranch.boundary),
      };
    })
    .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));
}

// ---- dashboard -----------------------------------------------------------

export async function getDashboard(): Promise<DashboardData> {
  const active = animals.filter((a) => a.status === "active");
  const { overdue, dueSoon } = vaccinationStatus();
  const breaches7d = audit.filter((e) => e.event_type === "geofence_breach" && isActiveAnimal(e.animal_id) && NOW - new Date(e.occurred_at).getTime() <= 7 * DAY);

  // Average weight per month, over the last six months.
  const byMonth = new Map<string, number[]>();
  for (const w of weights) {
    const key = w.weighed_at.slice(0, 7);
    byMonth.set(key, [...(byMonth.get(key) ?? []), w.weight_lb]);
  }
  const weight_trend = [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, xs]) => ({
      month: k + "-15",
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
      week: new Date(end).toISOString(),
      events: audit.filter((e) => {
        const t = new Date(e.occurred_at).getTime();
        return t > start && t <= end && e.event_type !== "animal_created" && e.event_type !== "identifier_added";
      }).length,
    };
  });

  return {
    kpis: {
      active_head: active.length,
      vaccinations_overdue: overdue.length,
      vaccinations_due_soon: dueSoon.length,
      breaches_7d: breaches7d.length,
      avg_weight_lb: last,
      avg_weight_delta_pct: prev ? +(((last - prev) / prev) * 100).toFixed(1) : 0,
    },
    weight_trend,
    composition: composition.filter((c) => c.value > 0),
    activity_by_week,
    alerts: buildAlerts().slice(0, 8),
    recent_events: audit.slice(0, 8),
    ranches: ranches.map(summarize),
  };
}
