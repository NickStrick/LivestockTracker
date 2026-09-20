import { COST_BASES, CURRENCIES, DOC_TYPES, MOVEMENT_PURPOSES } from "../types";
import { estimateSchema, observationSchema, vaccinationSchema, weightSchema } from "../recordSchemas";
import { arr, bool, date, datetime, fromZod, int, nullable, num, obj, oneOf, patchSchema, ref, ring, str } from "./dsl";
import type { SchemaSpec } from "./types";

const ALERT_KINDS = ["geofence_breach", "health", "vaccination_overdue", "vaccination_due", "document_expired", "document_expiring", "movement_issue"];

/**
 * The target schemas: everything the frontend reads or sends that the current swagger does not already
 * describe exactly. Patched schemas start from the swagger, so only the real differences show up.
 * Request bodies for the "Record" forms are generated from the zod schemas the forms validate with.
 */
export const SCHEMAS: SchemaSpec[] = [
  // ---------------- animal-service: changes to existing schemas ----------------
  {
    name: "AnimalCreate",
    service: "animal",
    description: "Body for POST /animals.",
    why: "Animals can have a nickname (shown next to the tag everywhere in the app).",
    schema: patchSchema("AnimalCreate", { add: { nickname: nullable(str("Friendly name shown next to the tag, e.g. “Daisy”. Free text, searchable.", { maxLength: 60 })) } }),
  },
  {
    name: "AnimalOut",
    service: "animal",
    description: "An animal as returned by the animal endpoints.",
    why: "Adds the nickname, and constrains status to the three values the UI understands (AnimalUpdate already restricts writes to them).",
    schema: patchSchema("AnimalOut", {
      add: { nickname: nullable(str("Friendly name shown next to the tag. null when not set.")) },
      change: { status: oneOf(["active", "sold", "deceased"], "sold and deceased animals leave the active herd: no alerts, no map markers, not counted as head.") },
      addRequired: ["nickname"],
    }),
  },
  {
    name: "AnimalUpdate",
    service: "animal",
    description: "Body for PATCH /animals/{id}. Send only the fields that change.",
    why: "The UI edits the nickname and updates lineage (sire and dam) from the animal page.",
    schema: patchSchema("AnimalUpdate", {
      add: {
        nickname: nullable(str("Send null or an empty string to clear it.", { maxLength: 60 })),
        sire_id: nullable(str("Must be a bull. null clears it.")),
        dam_id: nullable(str("Must be a cow or heifer. null clears it.")),
      },
    }),
  },
  {
    name: "AuditEventOut",
    service: "animal",
    description: "One entry in an audit trail. event_type values the UI recognises are listed under “Audit event catalog”.",
    why: "The UI shows who did it; it has no user directory yet, so it needs the display name in the event.",
    schema: patchSchema("AuditEventOut", {
      add: { actor_name: nullable(str("Display name for actor_id (e.g. “Maria Gomez”). null for system actors; the UI shows “System” or “GPS service”.")) },
      addRequired: ["actor_name"],
    }),
  },
  {
    name: "RanchOut",
    service: "animal",
    description: "A ranch as returned by GET /ranches and GET /ranches/{id}.",
    why: "The map needs the boundary, and the ranch cards need counts. All of it is derived, none of it is user-entered.",
    schema: patchSchema("RanchOut", {
      add: {
        boundary: ring("The ranch perimeter, same shape as RanchCreate.boundary."),
        head_count: int("Animals with status = active on this ranch."),
        zone_count: int("Active zones (lifted zones excluded)."),
        breach_count: int("Active animals whose latest GPS position is outside the boundary right now. Comes from gps-service."),
        area_acres: num("Area enclosed by the boundary, in acres."),
      },
      addRequired: ["boundary", "head_count", "zone_count", "breach_count", "area_acres"],
    }),
  },
  {
    name: "ZoneOut",
    service: "animal",
    description: "A zone as returned by the zone endpoints.",
    why: "boundary is typed as a bare object in the swagger, but ZoneCreate takes a ring and the map draws a ring. Return the same ring shape you accept.",
    schema: patchSchema("ZoneOut", { change: { boundary: ring("Same shape as ZoneCreate.boundary.") } }),
  },

  // ---------------- animal-service: new ----------------
  {
    name: "LineageNode",
    service: "animal",
    description: "One animal in a family tree. sire and dam nest up to `depth` generations.",
    why: "The swagger returns an untyped object for GET /animals/{id}/lineage.",
    schema: obj({
      id: str(),
      tag_id: str(),
      nickname: nullable(str()),
      gender: nullable(str()),
      dob: nullable(date()),
      sire: nullable(ref("LineageNode")),
      dam: nullable(ref("LineageNode")),
    }),
  },
  {
    name: "ParentOption",
    service: "animal",
    description: "An animal that could be picked as a parent in the “Update lineage” form.",
    schema: obj({ id: str(), tag_id: str(), nickname: nullable(str()), ranch_name: str("For telling apart animals with the same tag on different ranches."), status: str() }),
  },
  {
    name: "ParentCandidates",
    service: "animal",
    description: "Who can be the sire and who can be the dam of an animal.",
    schema: obj({ sires: arr(ref("ParentOption"), "Bulls, excluding the animal itself and its descendants."), dams: arr(ref("ParentOption"), "Cows and heifers, excluding the animal itself and its descendants.") }),
  },
  {
    name: "CostEstimateOut",
    service: "animal",
    description: "An estimate of what an animal is worth at a point in time. History is kept; the newest one is “the current estimate”.",
    schema: obj({
      id: str(),
      animal_id: str(),
      estimated_at: date("Day the estimate applies to."),
      amount: num("Amount in `currency`."),
      currency: oneOf(CURRENCIES),
      basis: oneOf(COST_BASES, "What the number is based on."),
      notes: nullable(str()),
    }),
  },
  {
    name: "CostEstimateCreate",
    service: "animal",
    description: "Body for POST /animals/{id}/cost-estimates.",
    schema: fromZod(estimateSchema, {
      estimated_at: "Not in the future.",
      amount: "Greater than 0, at most 10,000,000.",
      basis: "market price, appraisal, purchase price or other.",
    }),
  },

  // ---------------- health-service ----------------
  {
    name: "VaccinationOut",
    service: "health",
    description: "One recorded dose.",
    schema: obj({ id: str(), animal_id: str(), vaccine: str(), dose_ml: num(), administered_at: date(), administered_by: str("Free text: a person or clinic."), next_due_at: date() }),
  },
  {
    name: "VaccinationCreate",
    service: "health",
    description: "Body for POST /animals/{id}/vaccinations.",
    schema: fromZod(vaccinationSchema, {
      vaccine: "Free text. The UI suggests names from GET /vaccines but accepts any.",
      administered_at: "Not in the future.",
      dose_ml: "0.1 to 50.",
      next_due_at: "Must be on or after administered_at (cross-field rule: enforce server side). The UI pre-fills it from the vaccine's interval_days; the server may fill it in when omitted.",
    }),
  },
  {
    name: "VaccinationRow",
    service: "health",
    description: "The latest dose of one vaccine for one active animal, with how far it is from due. Feeds the “Overdue vaccines” drill-down.",
    schema: obj({
      id: str("Id of the latest dose."),
      animal_id: str(),
      tag_id: str(),
      nickname: nullable(str()),
      ranch_id: str(),
      ranch_name: str(),
      vaccine: str(),
      administered_at: date(),
      administered_by: str(),
      next_due_at: date(),
      state: oneOf(["overdue", "due_soon", "ok"], "overdue: next_due_at is in the past. due_soon: within the next 30 days. ok: later."),
      days: int("Whole days until due (rounded up); negative when overdue."),
    }),
  },
  {
    name: "VaccineOut",
    service: "health",
    description: "A vaccine the ranch commonly gives, used to suggest the next due date.",
    schema: obj({ name: str("Product name. Not translated."), interval_days: int("How long a dose usually lasts.") }),
  },
  {
    name: "ObservationOut",
    service: "health",
    description: "A health observation.",
    schema: obj({ id: str(), animal_id: str(), observed_at: date(), kind: oneOf(["routine_check", "symptom"]), severity: oneOf(["low", "medium", "high"]), notes: str() }),
  },
  {
    name: "ObservationCreate",
    service: "health",
    description: "Body for POST /animals/{id}/observations.",
    schema: fromZod(observationSchema, { observed_at: "Not in the future.", severity: "high raises a critical alert for 21 days.", notes: "1 to 500 characters." }),
  },
  {
    name: "BreedingEventOut",
    service: "health",
    description: "A heat, insemination or calving event. The UI only reads these today.",
    schema: obj({ id: str(), animal_id: str(), event: oneOf(["heat", "insemination", "calving"]), occurred_at: datetime(), sire_id: nullable(str()), notes: nullable(str()) }),
  },
  {
    name: "WeightOut",
    service: "health",
    description: "One weigh-in.",
    schema: obj({ id: str(), animal_id: str(), weighed_at: date(), weight_lb: num("Pounds.") }),
  },
  {
    name: "WeightCreate",
    service: "health",
    description: "Body for POST /animals/{id}/weights.",
    schema: fromZod(weightSchema, { weighed_at: "Not in the future.", weight_lb: "Pounds, 20 to 4,000." }),
  },

  // ---------------- gps-service ----------------
  {
    name: "PositionOut",
    service: "gps",
    description: "The latest known position of one animal.",
    schema: obj({
      animal_id: str(),
      ranch_id: str(),
      lon: num(),
      lat: num(),
      recorded_at: datetime("When the ping was recorded."),
      inside_boundary: bool("Computed server side (PostGIS ST_Contains against the ranch boundary)."),
    }),
  },
  {
    name: "BreachOut",
    service: "gps",
    description: "One geofence breach. The id is the same as the alert for it, so acknowledging a breach marks its alert read.",
    schema: obj({
      id: str("Same value as AlertOut.id for this breach."),
      animal_id: str(),
      tag_id: str(),
      nickname: nullable(str()),
      ranch_id: str(),
      ranch_name: str(),
      occurred_at: datetime(),
      lon: num(),
      lat: num(),
      distance_m: num("Metres from the ping to the nearest point on the ranch boundary."),
    }),
  },

  // ---------------- compliance-service ----------------
  {
    name: "MovementOut",
    service: "compliance",
    description: "One load of one or more animals leaving or arriving at a ranch, with the problems found on it.",
    schema: obj({
      id: str(),
      ranch_id: str(),
      animal_ids: arr(str()),
      kind: oneOf(["interstate", "intrastate"]),
      direction: oneOf(["in", "out"]),
      purpose: oneOf(MOVEMENT_PURPOSES),
      origin: str("Free text place name, “Name, State”."),
      destination: str("Free text place name, “Name, State”."),
      moved_at: date(),
      status: oneOf(["completed", "pending", "flagged"]),
      carrier: nullable(str()),
      notes: nullable(str()),
      document_ids: arr(str(), "Documents attached to this movement (CVI, brand inspection...)."),
      issues: arr(str(), "Compliance problems found. Empty when clean. See the rules on GET /movements."),
    }),
  },
  {
    name: "MovementCreate",
    service: "compliance",
    description: "Body for POST /movements.",
    schema: obj(
      {
        ranch_id: str(),
        animal_ids: arr(str(), "At least one."),
        kind: oneOf(["interstate", "intrastate"]),
        direction: oneOf(["in", "out"]),
        purpose: oneOf(MOVEMENT_PURPOSES),
        origin: str(),
        destination: str(),
        moved_at: date(),
        carrier: nullable(str()),
        notes: nullable(str()),
      },
      ["ranch_id", "animal_ids", "kind", "direction", "purpose", "origin", "destination", "moved_at"],
    ),
  },
  {
    name: "DocumentOut",
    service: "compliance",
    description: "A regulatory document (metadata; the file lives in S3) with its computed status.",
    schema: obj({
      id: str(),
      doc_type: oneOf(DOC_TYPES),
      title: str(),
      ranch_id: str(),
      animal_ids: arr(str()),
      movement_id: nullable(str()),
      issued_at: date(),
      expires_at: nullable(date("null: never expires.")),
      issued_by: str(),
      file_name: str(),
      size_kb: int(),
      status: oneOf(["valid", "expiring", "expired", "archived"], "Computed. See the rules on GET /documents."),
      days_left: nullable(int("Whole days until expiry, rounded up; negative when expired; null when it never expires.")),
    }),
  },
  {
    name: "DocumentCreate",
    service: "compliance",
    description: "Body for POST /documents. Registers the document; the file itself is uploaded separately (see DocumentCreated).",
    schema: obj(
      {
        doc_type: oneOf(DOC_TYPES),
        title: str(),
        ranch_id: str(),
        animal_ids: arr(str()),
        movement_id: nullable(str()),
        issued_at: date(),
        expires_at: nullable(date("Required for cvi, test_results and health_certificate; must be after issued_at.")),
        issued_by: str(),
        file_name: str(),
        size_kb: int(),
      },
      "all",
    ),
  },
  {
    name: "DocumentCreated",
    service: "compliance",
    description: "Response to POST /documents: the document plus where to upload the file.",
    why: "The UI sends only file metadata today. Real storage needs a way to send the bytes.",
    schema: obj({ document: ref("DocumentOut"), upload_url: nullable(str("Presigned S3 PUT URL, short-lived. null if no file is expected.")) }),
  },
  {
    name: "ComplianceSummary",
    service: "compliance",
    description: "Counters for the top of the Compliance page.",
    schema: obj({
      movements_30d: int("Movements with status other than pending, dated within the last 30 days (not in the future)."),
      pending_movements: int(),
      flagged_movements: int("Movements with at least one issue."),
      docs_total: int(),
      docs_expiring: int("status = expiring."),
      docs_expired: int("status = expired."),
    }),
  },

  // ---------------- platform / gateway ----------------
  {
    name: "AlertOut",
    service: "platform",
    description: "Something that needs attention. Today the frontend derives these itself from health, GPS and compliance data; the backend should own them.",
    why: "Alerts are computed in the browser today. Rules are on GET /alerts.",
    schema: obj({
      id: str("Stable id of the thing that raised it (dose, observation, document, movement or audit event id), so read-state can be remembered."),
      kind: oneOf(ALERT_KINDS),
      severity: oneOf(["critical", "warning", "info"]),
      subject: str("Animal tag (with nickname) or document title: what it is about."),
      href: str("Frontend route to open, e.g. /animals/ani_0008. Prefer returning the entity id and letting the UI build the link."),
      ranch_id: str(),
      title: str("English, e.g. “BVD overdue”. The UI translates known patterns."),
      detail: str("English, e.g. “Was due Sep 8”."),
      at: datetime("When it happened or falls due."),
    }),
  },
  {
    name: "DashboardKpis",
    service: "platform",
    description: "Headline numbers on the dashboard.",
    schema: obj({
      active_head: int(),
      vaccinations_overdue: int("Count of VaccinationRow with state overdue."),
      vaccinations_due_soon: int("Count of VaccinationRow with state due_soon."),
      breaches_7d: int("Breaches in the last 7 days for active animals."),
      avg_weight_lb: num("Average of the latest month's weigh-ins."),
      avg_weight_delta_pct: num("Change versus the previous month, percent, one decimal."),
    }),
  },
  {
    name: "WeightTrendPoint",
    service: "platform",
    description: "Average weight in one month.",
    schema: obj({ month: date("Any day in the month; the UI shows the month only."), avg_lb: int() }),
  },
  {
    name: "CompositionSlice",
    service: "platform",
    description: "Herd composition by gender (active animals; zero slices omitted).",
    schema: obj({ label: str("English plural: Cows, Heifers, Steers, Bulls."), value: int() }),
  },
  {
    name: "WeekActivity",
    service: "platform",
    description: "Audit events in one week, last 8 weeks. animal_created and identifier_added are not counted.",
    schema: obj({ week: datetime("End of the week."), events: int() }),
  },
  {
    name: "DashboardOut",
    service: "platform",
    description: "Everything the dashboard shows, in one response (a gateway composes it from the services).",
    schema: obj({
      kpis: ref("DashboardKpis"),
      weight_trend: arr(ref("WeightTrendPoint"), "Oldest first. Six months."),
      composition: arr(ref("CompositionSlice")),
      activity_by_week: arr(ref("WeekActivity")),
      alerts: arr(ref("AlertOut"), "The 8 most important."),
      recent_events: arr(ref("AuditEventOut"), "The 8 newest events across ranches."),
      ranches: arr(ref("RanchOut")),
    }),
  },
  {
    name: "MeOut",
    service: "platform",
    description: "The signed-in user and their customer, for the app shell.",
    why: "The shell shows the customer name and (later) hides actions by role. Both are hard-coded today.",
    schema: obj({ user_id: str(), display_name: str(), role: str("e.g. owner, manager, vet, hand."), customer_id: str(), customer_name: str(), ranch_ids: arr(str(), "Ranches this user may see.") }),
  },
  {
    name: "DomainError",
    service: "platform",
    description: "Body of a business-rule failure (HTTP 409 or 422 with a code). Structural validation errors keep FastAPI's HTTPValidationError shape.",
    why: "The UI translates errors into the user's language, so it needs a stable code and not just English text.",
    schema: obj({ code: str("Stable machine-readable code, see “Error codes”."), message: str("English, for logs and developers."), field: nullable(str("Request field at fault, when there is one.")) }),
  },
];
