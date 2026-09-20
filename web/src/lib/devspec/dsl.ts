import { z } from "zod";
import baseline from "./animal-service.swagger.json";
import type { JS } from "./types";

/** Small builders so the spec reads like a schema, not like JSON. */
export const ref = (name: string): JS => ({ $ref: `#/components/schemas/${name}` });

const withDesc = (s: JS, description?: string, extra: Partial<JS> = {}): JS => ({ ...s, ...(description ? { description } : {}), ...extra });

export const str = (description?: string, extra: Partial<JS> = {}) => withDesc({ type: "string" }, description, extra);
export const date = (description?: string) => withDesc({ type: "string", format: "date" }, description);
export const datetime = (description?: string) => withDesc({ type: "string", format: "date-time" }, description);
export const num = (description?: string, extra: Partial<JS> = {}) => withDesc({ type: "number" }, description, extra);
export const int = (description?: string, extra: Partial<JS> = {}) => withDesc({ type: "integer" }, description, extra);
export const bool = (description?: string) => withDesc({ type: "boolean" }, description);
export const oneOf = (values: readonly string[], description?: string) => withDesc({ type: "string", enum: [...values] }, description);
export const arr = (items: JS, description?: string) => withDesc({ type: "array", items }, description);
export const free = (description?: string) => withDesc({ type: "object", additionalProperties: true }, description);
/** A closed polygon ring: [[lon, lat], ...], first point == last point. */
export const ring = (description = "Polygon ring as [[lon, lat], ...], first == last point") => arr(arr({ type: "number" }), description);

export const nullable = (s: JS): JS => (s.$ref ? { anyOf: [s, { type: "null" }] } : { ...s, type: [String(s.type), "null"] });

/** required: "all" (typical for responses) or the list of required property names. */
export const obj = (properties: Record<string, JS>, required: "all" | string[] = "all", description?: string): JS =>
  withDesc({ type: "object", properties, required: required === "all" ? Object.keys(properties) : required }, description);

/** Deep copy of a schema from the current swagger. */
export const baselineSchema = (name: string): JS => JSON.parse(JSON.stringify((baseline.components.schemas as Record<string, unknown>)[name]));

/**
 * The swagger schema with fields added or redefined. Everything not mentioned stays byte-for-byte what
 * the swagger says, so the diff shown on the page only contains what really changes.
 */
export function patchSchema(name: string, patch: { add?: Record<string, JS>; change?: Record<string, JS>; addRequired?: string[] }): JS {
  const s = baselineSchema(name);
  s.properties = { ...s.properties, ...patch.change, ...patch.add };
  if (patch.addRequired) s.required = [...(s.required ?? []), ...patch.addRequired];
  return s;
}

/**
 * JSON Schema from one of the frontend's own zod schemas (the ones its forms validate with), so the
 * documented request body can't drift from what the UI actually sends. Cross-field rules (e.g. next
 * due >= date given) can't be expressed and are described in the notes instead.
 */
export function fromZod(schema: z.ZodType, descriptions: Record<string, string> = {}, keep?: string[]): JS {
  const js = z.toJSONSchema(schema, { io: "input", unrepresentable: "any" }) as unknown as JS & { $schema?: string };
  delete js.$schema;
  const props: Record<string, JS> = {};
  for (const [k, v] of Object.entries(js.properties ?? {})) {
    if (keep && !keep.includes(k)) continue;
    const p: JS = { ...v };
    if (p.pattern === "^\\d{4}-\\d{2}-\\d{2}$") {
      delete p.pattern;
      p.format = "date";
    }
    if (descriptions[k]) p.description = descriptions[k];
    props[k] = p;
  }
  return { ...js, properties: props, required: (js.required ?? []).filter((r) => !keep || keep.includes(r)) };
}

export { baseline };
