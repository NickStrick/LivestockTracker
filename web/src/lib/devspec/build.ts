import { baseline } from "./dsl";
import { CONVENTIONS, ERROR_CODES, EVENT_CATALOG } from "./catalog";
import { ENDPOINTS } from "./endpoints";
import { SCHEMAS } from "./schemas";
import { SERVICES, type DevView, type EndpointView, type EventView, type FieldView, type JS, type ParamView, type SchemaView, type ServiceId, type Status } from "./types";

/** Bump when the spec changes so people know which version they built against. */
export const SPEC_UPDATED = "2026-09-20";

const refName = (r: string) => r.split("/").pop()!;
const BASE_SCHEMAS = baseline.components.schemas as unknown as Record<string, JS>;
const BASE_PATHS = baseline.paths as unknown as Record<string, Record<string, { parameters?: { name: string; in: string }[]; responses: Record<string, { content?: { "application/json"?: { schema?: JS } } }> }>>;

// ---------- reading a schema ----------

/** Splits "X or null" (anyOf or a type list) into the X and a nullable flag. */
function flatten(s: JS): { core: JS; nullable: boolean } {
  if (s.anyOf) {
    const rest = s.anyOf.filter((x) => x.type !== "null");
    if (rest.length === 1) {
      const inner = flatten(rest[0]);
      const { anyOf: _drop, ...outer } = s;
      void _drop;
      return { core: { ...inner.core, ...outer }, nullable: rest.length !== s.anyOf.length || inner.nullable };
    }
  }
  if (Array.isArray(s.type)) {
    const rest = s.type.filter((t) => t !== "null");
    return { core: { ...s, type: rest.length === 1 ? rest[0] : rest }, nullable: rest.length !== s.type.length };
  }
  return { core: s, nullable: false };
}

function describe(s: JS): { type: string; ref?: string } {
  const { core } = flatten(s);
  if (core.$ref) return { type: refName(core.$ref), ref: refName(core.$ref) };
  if (core.type === "array") {
    const inner = core.items ? describe(core.items) : { type: "any", ref: undefined };
    return { type: `${inner.type}[]`, ref: inner.ref };
  }
  if (core.type === "object") return { type: "object" };
  return { type: Array.isArray(core.type) ? core.type.join(" | ") : (core.type ?? "any") };
}

/** Allowed values, whether written as an enum or as the swagger's "^(a|b|c)$" pattern. */
function enumValues(core: JS): string[] | null {
  if (core.enum) return core.enum.map(String);
  const m = core.pattern?.match(/^\^\(([^()]+)\)\$$/);
  return m ? m[1].split("|") : null;
}

function constraintsOf(s: JS): string {
  const { core } = flatten(s);
  const parts: string[] = [];
  if (core.format) parts.push(core.format);
  const values = enumValues(core);
  if (values) parts.push(`one of ${values.join(" | ")}`);
  else if (core.pattern) parts.push(`pattern ${core.pattern}`);
  if (core.minimum !== undefined) parts.push(`≥ ${core.minimum}`);
  if (core.exclusiveMinimum !== undefined) parts.push(`> ${core.exclusiveMinimum}`);
  if (core.maximum !== undefined) parts.push(`≤ ${core.maximum}`);
  if (core.minLength !== undefined || core.maxLength !== undefined) parts.push(core.minLength !== undefined && core.maxLength !== undefined ? `${core.minLength}–${core.maxLength} chars` : core.maxLength !== undefined ? `≤ ${core.maxLength} chars` : `≥ ${core.minLength} chars`);
  return parts.join(", ");
}

function fieldsOf(schema: JS): Omit<FieldView, "change" | "was">[] {
  const required = new Set(schema.required ?? []);
  return Object.entries(schema.properties ?? {}).map(([name, p]) => {
    const { nullable } = flatten(p);
    const d = describe(p);
    return { name, type: d.type, ref: d.ref, required: required.has(name), nullable, constraints: constraintsOf(p), description: flatten(p).core.description ?? "" };
  });
}

const sigOf = (f: Omit<FieldView, "change" | "was">) => `${f.type}|${f.nullable}|${f.constraints}|${f.required}`;
const textOf = (f: Omit<FieldView, "change" | "was">) => `${f.type}${f.nullable ? " | null" : ""}${f.constraints ? ` (${f.constraints})` : ""}${f.required ? "" : ", optional"}`;

function diffSchema(target: JS, base: JS | undefined): { fields: FieldView[]; changes: string[]; status: Status } {
  const now = fieldsOf(target);
  if (!base) return { fields: now.map((f) => ({ ...f, change: "same" as const })), changes: [], status: "new" };
  const was = new Map(fieldsOf(base).map((f) => [f.name, f]));
  const changes: string[] = [];
  const fields: FieldView[] = now.map((f) => {
    const old = was.get(f.name);
    if (!old) {
      changes.push(`Adds ${f.name}: ${textOf(f)}`);
      return { ...f, change: "added" as const };
    }
    if (sigOf(old) !== sigOf(f)) {
      changes.push(`Changes ${f.name}: ${textOf(old)} → ${textOf(f)}`);
      return { ...f, change: "changed" as const, was: textOf(old) };
    }
    return { ...f, change: "same" as const };
  });
  for (const [name, old] of was) {
    if (!now.some((f) => f.name === name)) {
      changes.push(`Removes ${name}`);
      fields.push({ ...old, change: "removed", description: old.description });
    }
  }
  return { fields, changes, status: changes.length ? "changed" : "exists" };
}

// ---------- examples ----------

const SAMPLE_ID: Record<string, string> = { animal_id: "ani_0008", sire_id: "ani_0001", dam_id: "ani_0002", ranch_id: "rnc_01", customer_id: "cus_01", movement_id: "mov_0004", document_id: "doc_0012", user_id: "usr_maria.gomez", actor_id: "usr_maria.gomez" };
const SAMPLE_STR: Record<string, string> = { tag_id: "RS-108", nickname: "Daisy", name: "Rio Seco Ranch", ranch_name: "Rio Seco Ranch", title: "CVI TX-1004", vaccine: "Blackleg", administered_by: "Dr. Ortiz", notes: "Free text", display_name: "Maria Gomez", customer_name: "Bartlett Cattle Co.", file_name: "cvi-tx-1004.pdf", origin: "Rio Seco Ranch, TX", destination: "Amarillo Livestock Auction, TX" };
const SAMPLE_NUM: Record<string, number> = { lon: -101.83, lat: 35.21, weight_lb: 1234, amount: 2450, dose_ml: 2, dose: 2, area_acres: 640, distance_m: 85 };
const RING = [[-101.84, 35.2], [-101.8, 35.2], [-101.8, 35.24], [-101.84, 35.24], [-101.84, 35.2]];

function example(s: JS, all: Map<string, JS>, name = "", stack: string[] = []): unknown {
  const { core } = flatten(s);
  if (core.example !== undefined) return core.example;
  if (core.$ref) {
    const n = refName(core.$ref);
    if (stack.includes(n)) return null;
    const target = all.get(n);
    return target ? example(target, all, "", [...stack, n]) : null;
  }
  const values = enumValues(core);
  if (values) return values[0];
  switch (core.type) {
    case "string":
      if (core.format === "date") return "2026-09-19";
      if (core.format === "date-time") return "2026-09-19T15:00:00Z";
      return SAMPLE_ID[name] ?? SAMPLE_STR[name] ?? (name === "id" ? "abc_0001" : name.endsWith("_id") ? "abc_0001" : "string");
    case "integer":
      return name === "size_kb" ? 184 : name === "interval_days" ? 365 : (core.minimum ?? 1);
    case "number":
      return SAMPLE_NUM[name] ?? Math.max(core.minimum ?? 0, core.exclusiveMinimum ? core.exclusiveMinimum + 1 : 0, 1);
    case "boolean":
      return true;
    case "array":
      if (name === "boundary") return RING;
      return core.items ? [example(core.items, all, name, stack)] : [];
    case "object": {
      if (!core.properties) return {};
      return Object.fromEntries(Object.entries(core.properties).map(([k, v]) => [k, example(v, all, k, stack)]));
    }
    default:
      return null;
  }
}

// ---------- assembling the view ----------

const slug = (s: string) => s.toLowerCase().replace(/[{}]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const endpointId = (method: string, path: string) => `ep-${method.toLowerCase()}-${slug(path)}`;
const schemaId = (name: string) => `sc-${name}`;

/** name -> final schema: the swagger's, with the spec's target versions on top. */
function allSchemas(): Map<string, JS> {
  const m = new Map<string, JS>(Object.entries(BASE_SCHEMAS));
  for (const s of SCHEMAS) m.set(s.name, s.schema);
  return m;
}

function baselineResponseName(path: string, method: string): { status: string; name: string | null } | null {
  const op = BASE_PATHS[path]?.[method.toLowerCase()];
  if (!op) return null;
  const code = Object.keys(op.responses).find((c) => c.startsWith("2"));
  if (!code) return null;
  const sc = op.responses[code].content?.["application/json"]?.schema;
  const item = sc?.type === "array" ? sc.items : sc;
  return { status: code, name: item?.$ref ? refName(item.$ref) : null };
}

const summarizeSchemaChange = (v: SchemaView) => {
  const added = v.fields.filter((f) => f.change === "added").map((f) => f.name);
  const changed = v.fields.filter((f) => f.change === "changed").map((f) => f.name);
  return [added.length && `adds ${added.join(", ")}`, changed.length && `changes ${changed.join(", ")}`].filter(Boolean).join("; ");
};

export function buildView(): DevView {
  const all = allSchemas();
  const problems: string[] = [];

  // schemas
  const targets = new Map(SCHEMAS.map((s) => [s.name, s]));
  const names = [...new Set([...SCHEMAS.map((s) => s.name), ...Object.keys(BASE_SCHEMAS)])];
  const schemas: SchemaView[] = names.map((name) => {
    const spec = targets.get(name);
    const schema = all.get(name)!;
    const d = diffSchema(schema, BASE_SCHEMAS[name]);
    const service: ServiceId = spec?.service ?? (name.includes("Validation") ? "platform" : "animal");
    return {
      id: schemaId(name),
      name,
      service,
      status: d.status,
      description: spec?.description ?? "",
      why: spec?.why ?? "",
      fields: d.fields,
      changes: d.changes,
      json: JSON.stringify(schema, null, 2),
      example: JSON.stringify(example(schema, all, "", [name]), null, 2),
      usedBy: [],
    };
  });
  const schemaByName = new Map(schemas.map((s) => [s.name, s]));

  // endpoints
  const seen = new Set<string>();
  const endpoints: EndpointView[] = ENDPOINTS.map((e) => {
    const key = `${e.method} ${e.path}`;
    if (seen.has(key)) problems.push(`Duplicate endpoint ${key}`);
    seen.add(key);
    const id = endpointId(e.method, e.path);
    const exists = !!BASE_PATHS[e.path]?.[e.method.toLowerCase()];
    const baseOp = BASE_PATHS[e.path]?.[e.method.toLowerCase()];
    const baseParams = new Set((baseOp?.parameters ?? []).map((p) => p.name));
    const changes: string[] = [];

    const pathParams: ParamView[] = [...e.path.matchAll(/\{(\w+)\}/g)].map((m) => ({ name: m[1], in: "path" as const, type: "string", required: true, description: e.pathDocs?.[m[1]] ?? "", isNew: false }));
    const queryParams: ParamView[] = (e.params ?? []).map((p) => ({ ...p, in: "query" as const, isNew: exists && !baseParams.has(p.name) }));
    for (const p of queryParams) if (p.isNew) changes.push(`New query parameter ${p.name}`);

    const schemaStatus = (n: string) => schemaByName.get(n)?.status;
    let body: EndpointView["body"] = null;
    if (e.body) {
      if (!schemaByName.has(e.body)) problems.push(`${key}: request schema ${e.body} doesn't exist`);
      const changed = exists && schemaStatus(e.body) === "changed";
      body = { schema: e.body, changed };
      if (changed) changes.push(`Request body ${e.body}: ${summarizeSchemaChange(schemaByName.get(e.body)!)}`);
      schemaByName.get(e.body)?.usedBy.push(id);
    }

    const baseResp = baselineResponseName(e.path, e.method);
    const responses = e.responses.map((r) => {
      if (r.schema && !schemaByName.has(r.schema)) problems.push(`${key}: response schema ${r.schema} doesn't exist`);
      let changed = false;
      if (exists && r.schema) {
        if (baseResp && baseResp.name === null) {
          changed = true;
          changes.push(`Response is now typed as ${r.schema} (the swagger returns an untyped object)`);
        } else if (schemaStatus(r.schema) === "changed") {
          changed = true;
          changes.push(`Response ${r.schema}: ${summarizeSchemaChange(schemaByName.get(r.schema)!)}`);
        }
      }
      if (r.schema) schemaByName.get(r.schema)?.usedBy.push(id);
      return { ...r, changed };
    });
    // the same schema can be reported twice (request and response): keep each line once
    const uniqueChanges = [...new Set(changes)];

    const okResp = e.responses.find((r) => r.status < 300 && r.schema);
    const status: Status = !exists ? "new" : uniqueChanges.length ? "changed" : "exists";
    return {
      id,
      method: e.method,
      path: e.path,
      service: e.service,
      summary: e.summary,
      priority: e.priority,
      status,
      ui: e.ui,
      fn: e.fn ?? null,
      params: [...pathParams, ...queryParams],
      body,
      responses,
      rules: e.rules ?? [],
      errors: e.errors ?? [],
      changes: uniqueChanges,
      requestExample: e.body ? JSON.stringify(example(all.get(e.body)!, all, "", [e.body]), null, 2) : null,
      responseExample: okResp?.schema ? JSON.stringify(okResp.array ? [example(all.get(okResp.schema)!, all, "", [okResp.schema])] : example(all.get(okResp.schema)!, all, "", [okResp.schema]), null, 2) : null,
    };
  });

  // self-check
  for (const path of Object.keys(BASE_PATHS)) {
    for (const method of Object.keys(BASE_PATHS[path])) {
      if (!seen.has(`${method.toUpperCase()} ${path}`)) problems.push(`The swagger has ${method.toUpperCase()} ${path} but the developer reference doesn't list it`);
    }
  }
  const refs = new Set<string>();
  const collect = (s: JS) => {
    if (s.$ref) refs.add(refName(s.$ref));
    s.anyOf?.forEach(collect);
    if (s.items) collect(s.items);
    Object.values(s.properties ?? {}).forEach(collect);
  };
  for (const [name, s] of all) {
    collect(s);
    for (const r of refs) if (!all.has(r)) problems.push(`Schema ${name} points at ${r}, which doesn't exist`);
  }
  for (const s of schemas) {
    const usedBySchema = [...all.entries()].some(([n, sc]) => n !== s.name && JSON.stringify(sc).includes(`"#/components/schemas/${s.name}"`));
    if (!s.usedBy.length && !usedBySchema && s.name !== "HTTPValidationError" && s.name !== "ValidationError" && s.name !== "DomainError") problems.push(`Schema ${s.name} isn't used by any endpoint`);
  }

  const count = <T extends { status: Status }>(xs: T[]) => ({ new: xs.filter((x) => x.status === "new").length, changed: xs.filter((x) => x.status === "changed").length, exists: xs.filter((x) => x.status === "exists").length });

  const events: EventView[] = EVENT_CATALOG.map((e) => ({
    type: e.type,
    service: e.service,
    when: e.when,
    data: Object.entries(e.data)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n"),
    example: JSON.stringify(e.example, null, 2),
    isNew: !!e.isNew,
  }));

  return {
    updated: SPEC_UPDATED,
    baseline: { title: baseline.info.title, version: baseline.info.version },
    endpoints,
    schemas,
    events,
    conventions: CONVENTIONS,
    errorCodes: ERROR_CODES,
    problems,
    counts: { endpoints: count(endpoints), schemas: count(schemas) },
  };
}

// ---------- downloads ----------

/** The full proposed OpenAPI 3.1 document: the swagger's operations plus everything new, with changed ones updated. */
export function buildOpenApi() {
  const view = buildView();
  const all = allSchemas();
  const respSchema = (name: string, array?: boolean) => ({ "application/json": { schema: array ? { type: "array", items: { $ref: `#/components/schemas/${name}` } } : { $ref: `#/components/schemas/${name}` } } });

  const paths: Record<string, Record<string, unknown>> = {};
  for (const e of view.endpoints) {
    const ops = (paths[e.path] ??= {});
    const responses: Record<string, unknown> = {};
    for (const r of e.responses) responses[r.status] = { description: r.description ?? (r.status === 201 ? "Created" : r.status === 302 ? "Redirect" : "OK"), ...(r.schema ? { content: respSchema(r.schema, r.array) } : {}) };
    for (const err of e.errors) {
      const prev = responses[err.status] as { description: string } | undefined;
      responses[err.status] = prev ? { ...prev, description: `${prev.description} ${err.when}` } : { description: err.when, ...(err.status === 409 || err.status === 422 ? { content: { "application/json": { schema: { $ref: "#/components/schemas/DomainError" } } } } : {}) };
    }
    if ((e.params.length || e.body) && !responses[422]) responses[422] = { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/HTTPValidationError" } } } };
    ops[e.method.toLowerCase()] = {
      summary: e.summary,
      description: e.rules.length ? e.rules.map((r) => `- ${r}`).join("\n") : undefined,
      tags: [SERVICES[e.service].name],
      operationId: `${e.method.toLowerCase()}_${slug(e.path).replace(/-/g, "_")}`,
      parameters: e.params.map((p) => ({ name: p.name, in: p.in, required: !!p.required, description: p.description || undefined, schema: { type: p.type === "date" ? "string" : p.type, ...(p.enum ? { enum: p.enum } : {}) } })),
      ...(e.body ? { requestBody: { required: true, content: { "application/json": { schema: { $ref: `#/components/schemas/${e.body.schema}` } } } } } : {}),
      responses,
      "x-status": e.status,
      "x-priority": e.priority,
      "x-frontend": { function: e.fn, screens: e.ui },
    };
  }

  return {
    openapi: "3.1.0",
    info: {
      title: "Estancia API (proposed)",
      version: `0.2.0-proposed+${SPEC_UPDATED}`,
      description: `What the Estancia frontend needs from the backend. Built on the animal-service swagger (${view.baseline.title} ${view.baseline.version}); operations and schemas marked x-status new/changed are additions or changes to it. Generated from /developers.`,
    },
    tags: Object.values(SERVICES).map((s) => ({ name: s.name, description: s.blurb })),
    paths,
    components: { schemas: Object.fromEntries([...all.entries()]) },
  };
}

/** A checklist for turning the gap into tickets. */
export function buildBacklog(): string {
  const v = buildView();
  const lines: string[] = [`# Estancia backend backlog`, "", `Generated from the developer reference on ${v.updated}. Baseline: ${v.baseline.title} swagger ${v.baseline.version}.`, ""];
  const byService = (svc: ServiceId) => v.endpoints.filter((e) => e.service === svc);

  lines.push("## New endpoints", "");
  for (const svc of Object.keys(SERVICES) as ServiceId[]) {
    const list = byService(svc).filter((e) => e.status === "new");
    if (!list.length) continue;
    lines.push(`### ${SERVICES[svc].name}`, "");
    for (const e of list) lines.push(`- [ ] \`${e.method} ${e.path}\` — ${e.summary} _(${e.priority})_${e.body ? ` · body \`${e.body.schema}\`` : ""}${e.responses[0]?.schema ? ` · returns \`${e.responses[0].schema}${e.responses[0].array ? "[]" : ""}\`` : ""}`);
    lines.push("");
  }

  lines.push("## Changed endpoints", "");
  for (const e of v.endpoints.filter((x) => x.status === "changed")) {
    lines.push(`- [ ] \`${e.method} ${e.path}\` — ${e.summary}`);
    for (const c of e.changes) lines.push(`  - ${c}`);
    for (const r of e.rules.slice(0, 0)) lines.push(`  - ${r}`);
  }
  lines.push("", "## New schemas", "");
  for (const s of v.schemas.filter((x) => x.status === "new")) lines.push(`- [ ] \`${s.name}\` (${SERVICES[s.service].name}) — ${s.description}`);
  lines.push("", "## Changed schemas", "");
  for (const s of v.schemas.filter((x) => x.status === "changed")) {
    lines.push(`- [ ] \`${s.name}\`${s.why ? ` — ${s.why}` : ""}`);
    for (const c of s.changes) lines.push(`  - ${c}`);
  }
  lines.push("", "## Audit event types to emit", "");
  for (const e of v.events) lines.push(`- [ ] \`${e.type}\` (${SERVICES[e.service].name})${e.isNew ? " — new" : ""}`);
  lines.push("", "Business rules, error codes and examples: see /developers.", "");
  return lines.join("\n");
}
