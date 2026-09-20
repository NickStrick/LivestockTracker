/**
 * Types for the developer reference (/developers): what the frontend needs from the backend.
 * Pure data, no React, so it can be reused (e.g. to generate the OpenAPI file and the backlog).
 */

/** The subset of JSON Schema (OpenAPI 3.1 flavour) the spec uses. */
export interface JS {
  $ref?: string;
  type?: string | string[];
  format?: string;
  enum?: (string | number)[];
  pattern?: string;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  minLength?: number;
  maxLength?: number;
  items?: JS;
  properties?: Record<string, JS>;
  required?: string[];
  anyOf?: JS[];
  additionalProperties?: boolean | JS;
  description?: string;
  title?: string;
  example?: unknown;
}

export type ServiceId = "animal" | "health" | "gps" | "compliance" | "platform";

export const SERVICES: Record<ServiceId, { name: string; blurb: string }> = {
  animal: { name: "animal-service", blurb: "Animals, identifiers, ranches, zones, lineage and the audit trail." },
  health: { name: "health-service", blurb: "Vaccinations, health observations, breeding events and weights." },
  gps: { name: "gps-service", blurb: "Latest positions and geofence breaches." },
  compliance: { name: "compliance-service", blurb: "Movements and regulatory documents." },
  platform: { name: "platform / gateway", blurb: "Cross-service reads (alerts, dashboard, activity feed) and the signed-in user." },
};

/** required: the screen can't work without it. recommended: the frontend can fall back to composing other calls. */
export type Priority = "required" | "recommended";
export type Status = "new" | "changed" | "exists";

export interface ParamSpec {
  name: string;
  in: "path" | "query";
  type: string;
  required?: boolean;
  description?: string;
  enum?: string[];
}

export interface ResponseSpec {
  status: number;
  /** Name of a schema in components.schemas. Omit for an empty body. */
  schema?: string;
  array?: boolean;
  description?: string;
}

export interface EndpointSpec {
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  path: string;
  service: ServiceId;
  summary: string;
  priority: Priority;
  /** Screens that call it. */
  ui: string[];
  /** The function in the frontend's data layer (src/lib/api.ts) that this replaces. */
  fn?: string;
  /** Query parameters (path parameters are read from the path). */
  params?: ParamSpec[];
  /** Request body schema name. */
  body?: string;
  responses: ResponseSpec[];
  /** Behaviour the frontend relies on, in plain words. */
  rules?: string[];
  errors?: { status: number; when: string; code?: string }[];
  /** Path parameter descriptions, if a bare name isn't obvious. */
  pathDocs?: Record<string, string>;
}

export interface SchemaSpec {
  name: string;
  service: ServiceId;
  description: string;
  /** For a changed schema: why it changes. */
  why?: string;
  schema: JS;
}

// ---------- what the page renders (all JSON-safe) ----------

export type FieldChange = "added" | "changed" | "same" | "removed";

export interface FieldView {
  name: string;
  type: string;
  /** Schema this type points at, for linking. */
  ref?: string;
  required: boolean;
  nullable: boolean;
  constraints: string;
  description: string;
  change: FieldChange;
  /** For a changed field: how it is defined in the current swagger. */
  was?: string;
}

export interface SchemaView {
  id: string;
  name: string;
  service: ServiceId;
  status: Status;
  description: string;
  why: string;
  fields: FieldView[];
  /** What changed, one line each (empty for new and unchanged schemas). */
  changes: string[];
  json: string;
  example: string;
  /** Endpoint ids that use it. */
  usedBy: string[];
}

export interface ParamView extends ParamSpec {
  isNew: boolean;
}

export interface EndpointView {
  id: string;
  method: EndpointSpec["method"];
  path: string;
  service: ServiceId;
  summary: string;
  priority: Priority;
  status: Status;
  ui: string[];
  fn: string | null;
  params: ParamView[];
  body: { schema: string; changed: boolean } | null;
  responses: (ResponseSpec & { changed: boolean })[];
  rules: string[];
  errors: { status: number; when: string; code?: string }[];
  /** What differs from the current swagger (empty for new endpoints and unchanged ones). */
  changes: string[];
  requestExample: string | null;
  responseExample: string | null;
}

export interface EventView {
  type: string;
  service: ServiceId;
  when: string;
  data: string;
  example: string;
  /** Emitted by the frontend's mock today, so backend must produce it. */
  isNew: boolean;
}

export interface DevView {
  updated: string;
  baseline: { title: string; version: string };
  endpoints: EndpointView[];
  schemas: SchemaView[];
  events: EventView[];
  conventions: { title: string; items: string[] }[];
  errorCodes: { code: string; status: number; when: string; message: string }[];
  problems: string[];
  counts: { endpoints: Record<Status, number>; schemas: Record<Status, number> };
}
