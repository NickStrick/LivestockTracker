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
  /** PROVISIONAL: not in the animal-service swagger yet. A friendly name shown next to the tag. */
  nickname?: string | null;
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
  nickname?: string | null; // PROVISIONAL
}

export interface AnimalUpdate {
  nickname?: string | null; // PROVISIONAL
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
  nickname?: string | null;
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

export type AlertSeverity = "critical" | "warning" | "info";
export type AlertKind =
  | "geofence_breach"
  | "health"
  | "vaccination_overdue"
  | "vaccination_due"
  | "document_expired"
  | "document_expiring"
  | "movement_issue";

/** PROVISIONAL: derived client-side from audit/health data until an alerts endpoint exists. */
export interface Alert {
  id: string;
  kind: AlertKind;
  severity: AlertSeverity;
  /** Animal tag or document title: whatever the alert is about. */
  subject: string;
  href: string;
  ranch_id: string;
  title: string;
  detail: string;
  at: string;
}

export interface ZoneCreate {
  name: string;
  zone_type: ZoneType;
  description: string | null;
  boundary: Ring;
}

export interface ZoneUpdate {
  name?: string | null;
  description?: string | null;
  active?: boolean | null;
}

// ---------- PROVISIONAL: compliance-service (schemas to be provided) ----------

export const MOVEMENT_PURPOSES = ["sale", "grazing", "show", "veterinary", "transfer", "purchase"] as const;
export type MovementPurpose = (typeof MOVEMENT_PURPOSES)[number];
export type MovementStatus = "completed" | "pending" | "flagged";

/** PROVISIONAL: one load of one or more animals leaving or arriving at a ranch. */
export interface MovementRecord {
  id: string;
  ranch_id: string;
  animal_ids: string[];
  kind: "interstate" | "intrastate";
  direction: "in" | "out";
  purpose: MovementPurpose;
  origin: string;
  destination: string;
  moved_at: string;
  status: MovementStatus;
  carrier: string | null;
  notes: string | null;
  document_ids: string[];
}

export const DOC_TYPES = ["cvi", "brand_inspection", "test_results", "registry_papers", "health_certificate"] as const;
export type DocType = (typeof DOC_TYPES)[number];

/** PROVISIONAL: regulatory document; the file itself would live in S3. */
export interface ComplianceDocument {
  id: string;
  doc_type: DocType;
  title: string;
  ranch_id: string;
  animal_ids: string[];
  movement_id: string | null;
  issued_at: string;
  expires_at: string | null;
  issued_by: string;
  file_name: string;
  size_kb: number;
}

/** "archived": belongs to a movement that already happened, so its expiry no longer matters. */
export type DocStatus = "valid" | "expiring" | "expired" | "archived";
export interface DocumentView extends ComplianceDocument {
  status: DocStatus;
  days_left: number | null; // negative when expired, null when it never expires
}

export interface ComplianceSummary {
  movements_30d: number;
  pending_movements: number;
  flagged_movements: number;
  docs_total: number;
  docs_expiring: number;
  docs_expired: number;
}

export interface MovementCreate {
  ranch_id: string;
  animal_ids: string[];
  kind: "interstate" | "intrastate";
  direction: "in" | "out";
  purpose: MovementPurpose;
  origin: string;
  destination: string;
  moved_at: string;
  carrier?: string | null;
  notes?: string | null;
}

export interface DocumentCreate {
  doc_type: DocType;
  title: string;
  ranch_id: string;
  animal_ids: string[];
  movement_id: string | null;
  issued_at: string;
  expires_at: string | null;
  issued_by: string;
  file_name: string;
  size_kb: number;
}

export interface MovementView extends MovementRecord {
  /** Compliance problems found on this movement (missing/expiring CVI). Empty when clean. */
  issues: string[];
}

// ---------- drill-down view models (composed in lib/api.ts) ----------

export type VaccinationState = "overdue" | "due_soon" | "ok";

/** Latest dose of one vaccine for one active animal, with how far it is from due. */
export interface VaccinationRow {
  id: string;
  animal_id: string;
  tag_id: string;
  nickname: string | null;
  ranch_id: string;
  ranch_name: string;
  vaccine: string;
  administered_at: string;
  administered_by: string;
  next_due_at: string;
  state: VaccinationState;
  /** Days until due; negative when overdue. */
  days: number;
}

export interface BreachRow {
  /** Same id as the alert, so acknowledging a breach marks its alert read. */
  id: string;
  animal_id: string;
  tag_id: string;
  nickname: string | null;
  ranch_id: string;
  ranch_name: string;
  occurred_at: string;
  lon: number;
  lat: number;
  distance_m: number;
}
