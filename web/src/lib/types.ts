/**
 * Types mirroring estancia-swagger.json (animal-service).
 * Anything marked PROVISIONAL is NOT in the swagger yet -- it is invented so the
 * UI can be built; replace with the real schema when that service exists.
 * Keep this file free of React/DOM imports so it can be reused in React Native.
 */

/** [lon, lat] pairs. First point == last point. */
export type Ring = number[][];

// ---------- animal-service (real schemas) ----------

export type AnimalStatus = "active" | "sold" | "deceased";

export interface AnimalOut {
  id: string;
  tag_id: string;
  dob: string | null; // date
  color: string | null;
  gender: string | null;
  sire_id: string | null;
  dam_id: string | null;
  ranch_id: string;
  status: string; // API returns free string; AnimalUpdate restricts to AnimalStatus
  cause_of_death: string | null;
  registry_number: string | null;
  breed_association: string | null;
  created_at: string; // date-time
}

export interface AnimalCreate {
  tag_id: string;
  ranch_id: string;
  dob?: string | null;
  color?: string | null;
  gender?: string | null;
  sire_id?: string | null;
  dam_id?: string | null;
  registry_number?: string | null;
  breed_association?: string | null;
}

export interface AnimalUpdate {
  color?: string | null;
  gender?: string | null;
  status?: AnimalStatus | null;
  cause_of_death?: string | null;
  registry_number?: string | null;
}

export const ID_TYPES = ["RFID", "EID", "ear_tattoo", "muzzle_print"] as const;
export type IdType = (typeof ID_TYPES)[number];

export interface IdentifierOut {
  id: string;
  animal_id: string;
  id_type: IdType;
  value: string;
  issued_by: string | null;
  issued_at: string;
}

export interface IdentifierCreate {
  id_type: IdType;
  value: string;
  issued_by?: string | null;
}

export interface RanchOut {
  id: string;
  customer_id: string;
  name: string;
  created_at: string;
}

export interface RanchCreate {
  name: string;
  customer_id: string;
  boundary: Ring;
}

export const ZONE_TYPES = [
  "pasture",
  "water",
  "dangerous_terrain",
  "forest",
  "paddock",
  "quarantine",
] as const;
export type ZoneType = (typeof ZONE_TYPES)[number];

export interface ZoneOut {
  id: string;
  ranch_id: string;
  name: string;
  zone_type: ZoneType;
  description: string | null;
  boundary: Ring;
  active: boolean;
  created_at: string;
  lifted_at: string | null;
}

export interface AuditEventOut {
  id: string;
  animal_id: string | null;
  ranch_id: string | null;
  event_type: string;
  event_data: Record<string, unknown> | null;
  actor_id: string | null;
  occurred_at: string;
}

// ---------- PROVISIONAL: gaps in the swagger ----------

/** PROVISIONAL: RanchOut in the swagger has no boundary, but the map needs it. */
export interface RanchDetail extends RanchOut {
  boundary: Ring;
}

/** PROVISIONAL: `GET /animals/{id}/lineage` is an untyped object in the swagger. */
export interface LineageNode {
  id: string;
  tag_id: string;
  gender: string | null;
  dob: string | null;
  sire: LineageNode | null;
  dam: LineageNode | null;
}

/** PROVISIONAL: health-service. */
export interface Vaccination {
  id: string;
  animal_id: string;
  vaccine: string;
  dose_ml: number;
  administered_at: string;
  administered_by: string;
  next_due_at: string;
}

/** PROVISIONAL: health-service. */
export interface HealthObservation {
  id: string;
  animal_id: string;
  observed_at: string;
  kind: "routine_check" | "symptom";
  severity: "low" | "medium" | "high";
  notes: string;
}

/** PROVISIONAL: health-service. */
export interface BreedingEvent {
  id: string;
  animal_id: string;
  event: "heat" | "insemination" | "calving";
  occurred_at: string;
  sire_id: string | null;
  notes: string | null;
}

/** PROVISIONAL: health-service or animal-service. */
export interface WeightRecord {
  id: string;
  animal_id: string;
  weighed_at: string;
  weight_lb: number;
}

/** PROVISIONAL: gps-service. Latest known position per animal. */
export interface GpsPosition {
  animal_id: string;
  ranch_id: string;
  lon: number;
  lat: number;
  recorded_at: string;
  inside_boundary: boolean;
}

// ---------- view models composed by lib/api.ts ----------

export interface RanchSummary extends RanchDetail {
  head_count: number;
  zone_count: number;
  breach_count: number;
  area_acres: number;
}

export interface DashboardData {
  kpis: {
    active_head: number;
    vaccinations_overdue: number;
    vaccinations_due_soon: number;
    breaches_7d: number;
    avg_weight_lb: number;
    avg_weight_delta_pct: number;
  };
  weight_trend: { month: string; avg_lb: number }[];
  composition: { label: string; value: number }[];
  activity_by_week: { week: string; events: number }[];
  alerts: Alert[];
  recent_events: AuditEventOut[];
  ranches: RanchSummary[];
}

export interface Alert {
  id: string;
  kind: "vaccination_overdue" | "vaccination_due" | "geofence_breach" | "health";
  animal_id: string;
  tag_id: string;
  title: string;
  detail: string;
  at: string;
}
