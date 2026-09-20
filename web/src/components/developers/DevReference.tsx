"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faMagnifyingGlass, faXmark } from "@fortawesome/free-solid-svg-icons";
import { SERVICES, type DevView, type EndpointView, type SchemaView, type ServiceId, type Status } from "@/lib/devspec/types";
import { Chip, Code, MethodBadge, Section, SchemaLink, StatusChip, TypeText } from "./parts";

type StatusFilter = Status | "all";
const SERVICE_IDS = Object.keys(SERVICES) as ServiceId[];
const JUMP = [
  ["endpoints", "Endpoints"],
  ["schemas", "Schemas"],
  ["events", "Audit events"],
  ["errors", "Error codes"],
  ["conventions", "Conventions"],
] as const;

/** Open a card (they are <details>) and scroll to it. */
function reveal(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  if (el instanceof HTMLDetailsElement) el.open = true;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  history.replaceState(null, "", `#${id}`);
}

const CHIP = "inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium transition-colors";

export function DevReference({ view }: { view: DevView }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [service, setService] = useState<ServiceId | "all">("all");
  const [requiredOnly, setRequiredOnly] = useState(false);

  // Deep links: /developers#sc-AnimalOut or #ep-get-animals opens that card.
  useEffect(() => {
    const go = () => {
      const id = window.location.hash.slice(1);
      if (id) setTimeout(() => reveal(id), 100);
    };
    go();
    window.addEventListener("hashchange", go);
    return () => window.removeEventListener("hashchange", go);
  }, []);

  const endpointById = useMemo(() => new Map(view.endpoints.map((e) => [e.id, e])), [view.endpoints]);
  const needle = q.trim().toLowerCase();
  const inService = (s: ServiceId) => service === "all" || s === service;
  const inStatus = (s: Status) => status === "all" || s === status;

  const endpoints = view.endpoints.filter(
    (e) =>
      inStatus(e.status) &&
      inService(e.service) &&
      (!requiredOnly || e.priority === "required") &&
      (!needle || [e.method, e.path, e.summary, e.fn ?? "", e.ui.join(" "), e.rules.join(" "), e.body?.schema ?? "", e.responses.map((r) => r.schema ?? "").join(" ")].join(" ").toLowerCase().includes(needle)),
  );
  const schemas = view.schemas.filter(
    (s) => inStatus(s.status) && inService(s.service) && (!needle || [s.name, s.description, s.fields.map((f) => f.name).join(" ")].join(" ").toLowerCase().includes(needle)),
  );

  const clearFilters = () => {
    setQ("");
    setStatus("all");
    setService("all");
    setRequiredOnly(false);
  };
  const goSchema = (name: string) => {
    clearFilters();
    setTimeout(() => reveal(`sc-${name}`), 80);
  };
  const goEndpoint = (id: string) => {
    clearFilters();
    setTimeout(() => reveal(id), 80);
  };
  const jump = (id: string, next?: StatusFilter) => {
    if (next) setStatus(next);
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  };
  const filtered = q || status !== "all" || service !== "all" || requiredOnly;

  const tiles: { label: string; n: number; status: Status; target: string; hint: string }[] = [
    { label: "New endpoints", n: view.counts.endpoints.new, status: "new", target: "endpoints", hint: "to build" },
    { label: "Changed endpoints", n: view.counts.endpoints.changed, status: "changed", target: "endpoints", hint: "already in the swagger" },
    { label: "New schemas", n: view.counts.schemas.new, status: "new", target: "schemas", hint: "to define" },
    { label: "Changed schemas", n: view.counts.schemas.changed, status: "changed", target: "schemas", hint: "fields added or changed" },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <button key={t.label} type="button" onClick={() => jump(t.target, t.status)} className="rounded-2xl border border-line bg-surface p-4 text-left transition hover:border-primary/60">
            <p className="text-3xl font-semibold tabular-nums">{t.n}</p>
            <p className="mt-1 text-sm font-medium">{t.label}</p>
            <p className="text-xs text-muted">{t.hint}</p>
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted">
        {view.counts.endpoints.exists} endpoints and {view.counts.schemas.exists} schemas in the swagger already match what the frontend needs.
      </p>

      {/* Filters: stick under the page header while scrolling on wide screens (on phones they would cover too much). */}
      <div className="z-30 -mx-4 mt-6 lg:sticky lg:top-14 border-b border-line bg-canvas/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative block lg:w-72">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search paths, fields, screens"
              aria-label="Search"
              className="h-10 w-full rounded-xl border border-line bg-surface pl-9 pr-9 text-sm outline-none focus:border-primary"
            />
            {q && (
              <button type="button" onClick={() => setQ("")} aria-label="Clear search" className="absolute right-1 top-1/2 grid size-8 -translate-y-1/2 place-items-center text-muted hover:text-fg">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            )}
          </label>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Status">
            {(["all", "new", "changed", "exists"] as const).map((s) => (
              <button key={s} type="button" aria-pressed={status === s} onClick={() => setStatus(s)} className={clsx(CHIP, status === s ? "border-primary bg-primary/15 text-primary" : "border-line text-muted hover:text-fg")}>
                {s === "all" ? "All" : s === "new" ? "New" : s === "changed" ? "Changed" : "Exists"}
              </button>
            ))}
            <button type="button" aria-pressed={requiredOnly} onClick={() => setRequiredOnly((v) => !v)} className={clsx(CHIP, requiredOnly ? "border-primary bg-primary/15 text-primary" : "border-line text-muted hover:text-fg")}>
              Required only
            </button>
          </div>
          <select value={service} onChange={(e) => setService(e.target.value as ServiceId | "all")} aria-label="Service" className="h-10 rounded-xl border border-line bg-surface px-3 text-sm outline-none focus:border-primary lg:w-52">
            <option value="all">All services</option>
            {SERVICE_IDS.map((s) => (
              <option key={s} value={s}>
                {SERVICES[s].name}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          <span>
            Showing {endpoints.length} of {view.endpoints.length} endpoints · {schemas.length} of {view.schemas.length} schemas
          </span>
          {filtered && (
            <button type="button" onClick={clearFilters} className="font-medium text-primary hover:underline">
              Clear filters
            </button>
          )}
          <span className="ml-auto flex gap-3">
            {JUMP.map(([id, label]) => (
              <button key={id} type="button" onClick={() => jump(id)} className="hover:text-fg">
                {label}
              </button>
            ))}
          </span>
        </div>
      </div>

      {/* ---------------- endpoints ---------------- */}
      <section id="endpoints" className="scroll-mt-40 pt-8">
        <h2 className="text-xl font-semibold tracking-tight">Endpoints</h2>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          Everything the frontend calls. <b className="font-semibold text-primary">New</b> = not in the swagger. <b className="font-semibold text-warn">Changed</b> = in the swagger, but a parameter or schema differs. <b className="font-semibold">Exists</b> = works as it is. Open a card for parameters, schemas, examples and the business rules the screens rely on.
        </p>
        {endpoints.length === 0 && <p className="mt-6 rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">No endpoints match these filters.</p>}
        {SERVICE_IDS.map((svc) => {
          const list = endpoints.filter((e) => e.service === svc);
          if (!list.length) return null;
          return (
            <div key={svc} className="mt-6">
              <div className="mb-2 flex flex-wrap items-baseline gap-x-3">
                <h3 className="font-mono text-sm font-semibold">{SERVICES[svc].name}</h3>
                <p className="text-xs text-muted">
                  {SERVICES[svc].blurb} · {list.length}
                </p>
              </div>
              <div className="space-y-2">
                {list.map((e) => (
                  <EndpointCard key={e.id} e={e} onSchema={goSchema} />
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* ---------------- schemas ---------------- */}
      <section id="schemas" className="scroll-mt-40 pt-12">
        <h2 className="text-xl font-semibold tracking-tight">Schemas</h2>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          Highlighted rows are what differs from the swagger: <span className="rounded bg-ok/15 px-1 text-ok">added</span> <span className="rounded bg-warn/15 px-1 text-warn">changed</span>. Fields marked “optional” may be omitted; a field that is required may still be <code className="font-mono">null</code> when its type says so.
        </p>
        {schemas.length === 0 && <p className="mt-6 rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">No schemas match these filters.</p>}
        {SERVICE_IDS.map((svc) => {
          const list = schemas.filter((s) => s.service === svc);
          if (!list.length) return null;
          return (
            <div key={svc} className="mt-6">
              <h3 className="mb-2 font-mono text-sm font-semibold">
                {SERVICES[svc].name} <span className="font-sans text-xs font-normal text-muted">· {list.length}</span>
              </h3>
              <div className="space-y-2">
                {list.map((s) => (
                  <SchemaCard key={s.id} s={s} onSchema={goSchema} endpoints={s.usedBy.map((id) => endpointById.get(id)!).filter(Boolean)} onEndpoint={goEndpoint} />
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* ---------------- audit events ---------------- */}
      <section id="events" className="scroll-mt-40 pt-12">
        <h2 className="text-xl font-semibold tracking-tight">Audit event catalog</h2>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          In the swagger, <code className="font-mono">event_type</code> is a free string and <code className="font-mono">event_data</code> an untyped object. These are the event types the timelines and the activity feed understand, and the keys they read from <code className="font-mono">event_data</code>. Write one in the same transaction as the change.
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {view.events.map((ev) => (
            <div key={ev.type} className="min-w-0 rounded-2xl border border-line bg-surface p-4">
              <div className="flex flex-wrap items-center gap-2">
                <code className="font-mono text-sm font-semibold">{ev.type}</code>
                {ev.isNew && <StatusChip status="new" />}
                <Chip>{SERVICES[ev.service].name}</Chip>
              </div>
              <p className="mt-1.5 text-sm text-muted">{ev.when}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Code title="event_data keys" text={ev.data} />
                <Code title="Example" text={ev.example} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- error codes ---------------- */}
      <section id="errors" className="scroll-mt-40 pt-12">
        <h2 className="text-xl font-semibold tracking-tight">Error codes</h2>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          Business-rule failures return a <code className="font-mono">DomainError</code> with one of these codes. The frontend shows its own translated message for each, so the English text below is only for logs.
        </p>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-line text-[11px] uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Code</th>
                <th className="px-4 py-2.5 font-semibold">HTTP</th>
                <th className="px-4 py-2.5 font-semibold">When</th>
                <th className="px-4 py-2.5 font-semibold">message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {view.errorCodes.map((c) => (
                <tr key={c.code}>
                  <td className="px-4 py-2.5 font-mono text-xs">{c.code}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{c.status}</td>
                  <td className="px-4 py-2.5">{c.when}</td>
                  <td className="px-4 py-2.5 text-muted">{c.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------------- conventions ---------------- */}
      <section id="conventions" className="scroll-mt-40 pt-12">
        <h2 className="text-xl font-semibold tracking-tight">Conventions and open questions</h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {view.conventions.map((c) => (
            <div key={c.title} className="min-w-0 rounded-2xl border border-line bg-surface p-4 sm:p-5">
              <h3 className="text-sm font-semibold">{c.title}</h3>
              <ul className="mt-2 space-y-2 text-sm text-muted">
                {c.items.map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/60" />
                    <span className="min-w-0">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <p className={clsx("mt-12 rounded-xl px-4 py-3 text-xs", view.problems.length ? "bg-danger/10 text-danger" : "bg-surface2 text-muted")} data-testid="selfcheck">
        {view.problems.length ? (
          <>
            Spec self-check found {view.problems.length} problem(s):
            <span className="mt-1 block">{view.problems.join(" · ")}</span>
          </>
        ) : (
          <>Spec self-check passed: every swagger operation is listed, and every schema reference resolves.</>
        )}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------

const CARD = "group scroll-mt-40 rounded-2xl border border-line bg-surface open:border-primary/40";
const SUMMARY = "flex cursor-pointer list-none flex-col gap-2 p-3.5 marker:hidden sm:flex-row sm:items-center sm:gap-3 sm:p-4 [&::-webkit-details-marker]:hidden";

function EndpointCard({ e, onSchema }: { e: EndpointView; onSchema: (name: string) => void }) {
  return (
    <details id={e.id} className={CARD}>
      <summary className={SUMMARY}>
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <MethodBadge method={e.method} />
          <div className="min-w-0">
            <p className="break-all font-mono text-sm font-medium">{e.path}</p>
            <p className="text-sm text-muted">{e.summary}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
          {e.priority === "required" ? <Chip>Required</Chip> : <Chip>Recommended</Chip>}
          <StatusChip status={e.status} />
          <FontAwesomeIcon icon={faChevronDown} className="ml-1 hidden text-xs text-muted transition group-open:rotate-180 sm:block" />
        </div>
      </summary>

      <div className="space-y-5 border-t border-line p-4 sm:p-5">
        {e.changes.length > 0 && (
          <Section title="What changes">
            <ul className="space-y-1 text-sm">
              {e.changes.map((c) => (
                <li key={c} className="flex gap-2">
                  <span className="text-warn">●</span>
                  <span className="min-w-0">{c}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {e.rules.length > 0 && (
          <Section title="Behaviour the screens rely on">
            <ul className="space-y-1.5 text-sm">
              {e.rules.map((r) => (
                <li key={r} className="flex gap-2.5">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/60" />
                  <span className="min-w-0">{r}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <div className="grid gap-5 lg:grid-cols-2">
          {e.params.length > 0 && (
            <Section title="Parameters">
              <div className="overflow-x-auto rounded-xl border border-line">
                <table className="w-full min-w-[22rem] text-left text-xs">
                  <tbody className="divide-y divide-line">
                    {e.params.map((p) => (
                      <tr key={p.name} className={p.isNew ? "bg-ok/10" : ""}>
                        <td className="whitespace-nowrap px-3 py-2 align-top font-mono">
                          {p.name}
                          {p.required && <span className="text-danger"> *</span>}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 align-top text-muted">
                          {p.in} · {p.type}
                        </td>
                        <td className="px-3 py-2 align-top text-muted">
                          {p.isNew && <span className="mr-1.5 rounded bg-ok/15 px-1 font-semibold text-ok">new</span>}
                          {p.enum ? `one of ${p.enum.join(" | ")}. ` : ""}
                          {p.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}
          <Section title="Request and response">
            <div className="space-y-2 text-sm">
              {e.body && (
                <p className="flex flex-wrap items-center gap-2">
                  <span className="w-20 shrink-0 text-xs text-muted">Body</span>
                  <SchemaLink name={e.body.schema} onRef={onSchema} />
                  {e.body.changed && <span className="rounded bg-warn/15 px-1 text-[11px] font-semibold text-warn">changed</span>}
                </p>
              )}
              {e.responses.map((r) => (
                <p key={r.status} className="flex flex-wrap items-center gap-2">
                  <span className="w-20 shrink-0 font-mono text-xs text-muted">{r.status}</span>
                  {r.schema ? (
                    <>
                      <SchemaLink name={r.schema} onRef={onSchema} />
                      {r.array && <span className="font-mono text-xs text-muted">[ ]</span>}
                      {r.changed && <span className="rounded bg-warn/15 px-1 text-[11px] font-semibold text-warn">changed</span>}
                    </>
                  ) : (
                    <span className="text-xs text-muted">{r.description ?? "empty body"}</span>
                  )}
                </p>
              ))}
            </div>
          </Section>
        </div>

        {(e.requestExample || e.responseExample) && (
          <div className="grid gap-4 lg:grid-cols-2">
            {e.requestExample && <Code title="Request body example" text={e.requestExample} />}
            {e.responseExample && <Code title="Response example" text={e.responseExample} />}
          </div>
        )}

        {e.errors.length > 0 && (
          <Section title="Errors">
            <ul className="space-y-1 text-sm">
              {e.errors.map((er) => (
                <li key={er.status + er.when} className="flex flex-wrap items-baseline gap-2">
                  <span className="w-9 shrink-0 font-mono text-xs">{er.status}</span>
                  <span className="min-w-0 text-muted">{er.when}</span>
                  {er.code && <code className="font-mono text-xs">{er.code}</code>}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {(e.ui.length > 0 || e.fn) && (
          <Section title="Used by">
            <div className="flex flex-wrap items-center gap-1.5">
              {e.ui.map((u) => (
                <Chip key={u}>{u}</Chip>
              ))}
              {e.fn && <span className="ml-1 font-mono text-xs text-muted">replaces {e.fn} in src/lib/api.ts</span>}
            </div>
          </Section>
        )}
      </div>
    </details>
  );
}

const ROW: Record<string, string> = { added: "bg-ok/10", changed: "bg-warn/10", removed: "bg-danger/10", same: "" };

function SchemaCard({ s, onSchema, endpoints, onEndpoint }: { s: SchemaView; onSchema: (name: string) => void; endpoints: EndpointView[]; onEndpoint: (id: string) => void }) {
  return (
    <details id={s.id} className={CARD}>
      <summary className={SUMMARY}>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-sm font-semibold">{s.name}</p>
          {s.description && <p className="text-sm text-muted">{s.description}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
          <Chip>{SERVICES[s.service].name}</Chip>
          <StatusChip status={s.status} />
          <FontAwesomeIcon icon={faChevronDown} className="ml-1 hidden text-xs text-muted transition group-open:rotate-180 sm:block" />
        </div>
      </summary>

      <div className="space-y-5 border-t border-line p-4 sm:p-5">
        {s.why && (
          <p className="rounded-xl bg-surface2 px-3 py-2 text-sm">
            <b className="font-semibold">Why: </b>
            {s.why}
          </p>
        )}

        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead className="border-b border-line text-[11px] uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-2 font-semibold">Field</th>
                <th className="px-3 py-2 font-semibold">Type</th>
                <th className="px-3 py-2 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {s.fields.map((f) => (
                <tr key={f.name} className={ROW[f.change]}>
                  <td className="whitespace-nowrap px-3 py-2 align-top font-mono text-xs">
                    {f.name}
                    {f.required ? <span className="text-danger"> *</span> : <span className="text-muted"> ?</span>}
                    {f.change === "added" && <span className="ml-1.5 rounded bg-ok/15 px-1 font-sans text-[10px] font-semibold text-ok">added</span>}
                    {f.change === "changed" && <span className="ml-1.5 rounded bg-warn/15 px-1 font-sans text-[10px] font-semibold text-warn">changed</span>}
                    {f.change === "removed" && <span className="ml-1.5 rounded bg-danger/15 px-1 font-sans text-[10px] font-semibold text-danger">removed</span>}
                  </td>
                  <td className="px-3 py-2 align-top">
                    <TypeText f={f} onRef={onSchema} />
                  </td>
                  <td className="px-3 py-2 align-top text-xs text-muted">
                    {f.constraints && <span className="font-mono">{f.constraints}</span>}
                    {f.constraints && f.description && " · "}
                    {f.description}
                    {f.was && <span className="mt-0.5 block text-warn">was: {f.was}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-muted">
          <span className="text-danger">*</span> required · <span>?</span> optional
        </p>

        {endpoints.length > 0 && (
          <Section title="Used by">
            <div className="flex flex-wrap gap-1.5">
              {endpoints.map((e) => (
                <button key={e.id} type="button" onClick={() => onEndpoint(e.id)} className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-line px-2 py-1 font-mono text-[11px] hover:border-primary hover:text-primary">
                  <span className="font-bold">{e.method}</span>
                  <span className="truncate">{e.path}</span>
                </button>
              ))}
            </div>
          </Section>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <Code title="Example" text={s.example} />
          <Code title="JSON Schema" text={s.json} />
        </div>
      </div>
    </details>
  );
}
