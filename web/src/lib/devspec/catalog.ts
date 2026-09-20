import type { ServiceId } from "./types";

/**
 * Audit event types the frontend renders (src/lib/i18n/create.ts → eventSummary). In the swagger
 * event_type is a free string and event_data an untyped object, so this is the contract to honour:
 * the UI reads exactly these keys from event_data.
 */
export const EVENT_CATALOG: { type: string; service: ServiceId; when: string; data: Record<string, string>; example: Record<string, unknown>; isNew?: boolean }[] = [
  { type: "animal_created", service: "animal", when: "An animal is registered.", data: { tag_id: "string", gender: "string | null" }, example: { tag_id: "RS-108", gender: "cow" } },
  { type: "animal_updated", service: "animal", when: "Status changes (sold, undo, deceased).", data: { status: "active | sold | deceased", cause_of_death: "string (optional)" }, example: { status: "sold" } },
  { type: "identifier_added", service: "animal", when: "An identifier is attached.", data: { id_type: "RFID | EID | ear_tattoo | muzzle_print", value: "string" }, example: { id_type: "RFID", value: "982000123456789" } },
  { type: "ranch_created", service: "animal", when: "A ranch is onboarded.", data: { name: "string" }, example: { name: "Rio Seco Ranch" } },
  { type: "zone_created", service: "animal", when: "A zone is created.", data: { name: "string", zone_type: "string" }, example: { name: "North pasture", zone_type: "pasture" } },
  { type: "zone_updated", service: "animal", when: "A zone is renamed or lifted.", data: { name: "string", active: "boolean" }, example: { name: "North pasture", active: false } },
  { type: "vaccination_recorded", service: "health", when: "A dose is recorded.", data: { vaccine: "string", dose_ml: "number", next_due_at: "date" }, example: { vaccine: "Blackleg", dose_ml: 2, next_due_at: "2027-03-18" } },
  { type: "geofence_breach", service: "gps", when: "A ping lands outside the ranch boundary.", data: { lon: "number", lat: "number", tag_id: "string (optional)" }, example: { lon: -101.83, lat: 35.21, tag_id: "RS-104" } },
  {
    type: "movement_recorded",
    service: "compliance",
    when: "A movement is recorded. One event per animal on it.",
    data: { direction: "in | out", purpose: "string", kind: "interstate | intrastate", place: "string (destination for out, origin for in)", movement_id: "string", cvi: "boolean (a document is attached)" },
    example: { direction: "out", purpose: "sale", kind: "interstate", place: "Amarillo Livestock Auction, TX", movement_id: "mov_0004", cvi: true },
  },
  { type: "document_uploaded", service: "compliance", when: "A document is registered.", data: { title: "string", doc_type: "string", document_id: "string" }, example: { title: "CVI TX-1004", doc_type: "cvi", document_id: "doc_0012" } },
  { type: "health_recorded", service: "health", when: "A health observation is recorded.", data: { kind: "routine_check | symptom", severity: "low | medium | high", notes: "string" }, example: { kind: "symptom", severity: "medium", notes: "Limping on the left rear leg" }, isNew: true },
  { type: "weight_recorded", service: "health", when: "A weigh-in is recorded.", data: { weight_lb: "number" }, example: { weight_lb: 1234 }, isNew: true },
  { type: "estimate_recorded", service: "animal", when: "A cost estimate is added.", data: { amount: "number", currency: "USD | MXN", basis: "market | appraisal | purchase | other" }, example: { amount: 2450, currency: "USD", basis: "market" }, isNew: true },
  { type: "lineage_updated", service: "animal", when: "Sire or dam changes.", data: { sire: "string | null (tag id)", dam: "string | null (tag id)" }, example: { sire: "RS-101", dam: "RS-102" }, isNew: true },
];

/** Cross-cutting expectations that aren't tied to one endpoint. */
export const CONVENTIONS: { title: string; items: string[] }[] = [
  {
    title: "Data formats",
    items: [
      "Ids are opaque strings. The mock uses readable ones (ani_0008, rnc_01, mov_0004); UUIDs are fine.",
      "Calendar dates the user types (born, given, weighed, issued, moved) are YYYY-MM-DD. Moments (created_at, occurred_at, recorded_at) are ISO-8601 in UTC with a Z. The UI reads either wherever a date is shown.",
      "Weights are pounds (weight_lb) and doses are millilitres (dose_ml). Areas are acres, distances metres.",
      "Coordinates are [lon, lat] (GeoJSON order). Boundaries are one closed ring: the first and last point are equal.",
      "Money is a number plus a currency code, USD or MXN. Never a formatted string.",
      "Enumerations are lower_snake_case strings, exactly as listed in each schema.",
    ],
  },
  {
    title: "Language",
    items: [
      "The app runs in English and Spanish (Mexico). Return raw data and codes; the frontend translates.",
      "Free text people typed (names, notes, places) is shown as entered, never translated.",
      "AlertOut.title and detail are English strings the frontend recognises by pattern. Keep them exactly as documented, or return structured params and let the frontend build the text (small change on our side).",
    ],
  },
  {
    title: "Auth and roles",
    items: [
      "The frontend has no sign-in yet. Plan: a JWT on every request (Authorization: Bearer). 401 for missing or invalid.",
      "Role-restricted writes (for example vets only for vaccinations) answer 403. The UI will hide those actions once GET /me returns roles.",
      "Everything is scoped to the caller's customer. A ranch or animal from another customer is a 404, not a 403.",
      "actor_id on audit events is the user's id, or system:<service> for automated writes (for example system:gps-service).",
      "The document download endpoint is opened by the browser directly (link or window), so it needs an auth mechanism that works without custom headers (cookie, or a signed URL).",
    ],
  },
  {
    title: "Errors",
    items: [
      "Structural problems (missing field, wrong type) keep FastAPI's 422 HTTPValidationError. The forms already validate first, so users rarely see these.",
      "Business-rule failures return 409 or 422 with a DomainError body { code, message, field } using the codes below. The UI shows a translated message chosen by code.",
      "Unknown ids: 404. Duplicates: 409.",
      "The Record forms validate on the frontend's server before calling you; treat that as convenience, not protection. Enforce every rule again.",
    ],
  },
  {
    title: "Routing and ownership",
    items: [
      "Several resources hang off /animals/{animal_id}/… but belong to other services (vaccinations, observations, weights, breeding, position, movements, documents). With path-based ALB routing that needs wildcard rules such as /animals/*/vaccinations, or the frontend can be pointed at service-prefixed paths. Tell us which and we will change one file (src/lib/api.ts).",
      "Cross-service reads (alerts, dashboard, activity feed, ranch counts) are marked platform / gateway. If you would rather not build a gateway, say so and the frontend will compose them from the service endpoints instead, at the cost of more calls.",
      "The frontend calls the backend from its own Next.js server (server actions and route handlers), not from the browser, so no CORS setup is planned. Tell us if that needs to change.",
    ],
  },
  {
    title: "Lists and paging",
    items: [
      "No list is paginated today; the UI loads whole lists. Fine for the demo. Before large customers, add limit/offset (or cursors) to GET /animals, /movements, /documents and /audit-events; the UI will follow.",
      "Sorting is fixed per endpoint (see each one's rules). The UI re-sorts and filters client-side for search boxes.",
    ],
  },
  {
    title: "Consistency",
    items: [
      "A write and its audit event happen in one transaction.",
      "After any write the UI re-reads the affected screens, so reads must reflect it immediately (no eventual consistency on the same service).",
      "Sold and deceased animals stay readable forever. They just drop out of live views: alerts, maps, head counts, breach lists and the vaccination status list.",
    ],
  },
];

export const ERROR_CODES: { code: string; status: number; when: string; message: string }[] = [
  { code: "animal.not_found", status: 404, when: "Unknown animal id.", message: "We couldn't find that animal." },
  { code: "animal.duplicate_tag", status: 409, when: "tag_id already exists.", message: "That tag is already in use." },
  { code: "identifier.duplicate", status: 409, when: "Identifier value already attached.", message: "That identifier is already attached to an animal." },
  { code: "lineage.sire_not_bull", status: 422, when: "sire_id isn't a bull.", message: "Choose a bull as the sire." },
  { code: "lineage.dam_not_female", status: 422, when: "dam_id isn't a cow or heifer.", message: "Choose a cow or heifer as the dam." },
  { code: "lineage.cycle", status: 422, when: "The chosen parent is the animal or one of its descendants.", message: "An animal can't be its own ancestor." },
  { code: "status.not_active", status: 409, when: "Selling an animal that isn't active.", message: "Only active animals can be marked as sold." },
  { code: "status.not_sold", status: 409, when: "Undoing a sale on an animal that isn't sold.", message: "This animal isn't marked as sold." },
  { code: "vaccination.due_before_given", status: 422, when: "next_due_at before administered_at.", message: "The next due date must be after the date given." },
  { code: "geometry.invalid_polygon", status: 422, when: "Boundary isn't a closed, valid polygon.", message: "The boundary isn't a valid closed polygon." },
  { code: "movement.unknown_animal", status: 422, when: "A listed animal doesn't exist or isn't on the ranch.", message: "One of the animals isn't on this ranch." },
  { code: "document.bad_expiry", status: 422, when: "Expiry missing where required, or not after issue date.", message: "This document needs a valid expiry date." },
];
