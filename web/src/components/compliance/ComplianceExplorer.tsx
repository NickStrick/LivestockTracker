"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight, faFileLines, faPaperclip, faTriangleExclamation, faTruck } from "@fortawesome/free-solid-svg-icons";
import type { ComplianceSummary, DocumentView, MovementView } from "@/lib/types";
import { DOC_TYPE_LABEL, fmtDate, fmtSize, titleCase } from "@/lib/format";
import { Badge, Card } from "@/components/ui";
import { DirectionBadge, DocStatusBadge, MovementStatusBadge } from "./badges";

export type ComplianceTab = "movements" | "documents";
const SELECT = "h-10 rounded-xl border border-line bg-surface px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

const place = (s: string) => s.split(",")[0];

function Kpi({ label, value, tone, active, onClick, sub }: { label: string; value: number; tone: string; active: boolean; onClick: () => void; sub?: string }) {
  return (
    <button onClick={onClick} className={clsx("rounded-2xl border bg-surface p-3.5 text-left transition hover:border-primary/60 active:scale-[0.99] sm:p-4", active ? "border-primary ring-2 ring-primary/20" : "border-line")}>
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className={clsx("mt-1 text-2xl font-semibold tabular-nums", tone)}>{value}</p>
      {sub && <p className="text-[11px] text-muted">{sub}</p>}
    </button>
  );
}

export function ComplianceExplorer({
  movements,
  documents,
  ranches,
  tags,
  summary,
  initialTab = "movements",
  initialFilter = "all",
}: {
  movements: MovementView[];
  documents: DocumentView[];
  ranches: { id: string; name: string }[];
  tags: Record<string, string>;
  summary: ComplianceSummary;
  initialTab?: ComplianceTab;
  initialFilter?: string;
}) {
  const [tab, setTab] = useState<ComplianceTab>(initialTab);
  const [filter, setFilter] = useState(initialFilter);
  const [ranch, setRanch] = useState("");
  const [docType, setDocType] = useState("");
  const ranchName = useMemo(() => Object.fromEntries(ranches.map((r) => [r.id, r.name])), [ranches]);

  const go = (t: ComplianceTab, f = "all") => {
    setTab(t);
    setFilter(f);
  };

  const moves = movements.filter((m) => {
    if (ranch && m.ranch_id !== ranch) return false;
    // Same rule as MovementStatusBadge: any computed issue makes the movement "flagged".
    return filter === "all" || (m.issues.length > 0 ? "flagged" : m.status) === filter;
  });
  const docs = documents.filter((d) => (!ranch || d.ranch_id === ranch) && (!docType || d.doc_type === docType) && (filter === "all" || d.status === filter));

  const moveFilters = ["all", "completed", "pending", "flagged"];
  const docFilters = ["all", "valid", "expiring", "expired", "archived"];
  const filters = tab === "movements" ? moveFilters : docFilters;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Movements, last 30 days" value={summary.movements_30d} tone="" active={tab === "movements" && filter === "all"} onClick={() => go("movements")} sub={`${summary.pending_movements} upcoming`} />
        <Kpi label="Movement issues" value={summary.flagged_movements} tone={summary.flagged_movements ? "text-danger" : ""} active={tab === "movements" && filter === "flagged"} onClick={() => go("movements", "flagged")} sub="Missing or expiring CVI" />
        <Kpi label="Expiring documents" value={summary.docs_expiring} tone={summary.docs_expiring ? "text-warn" : ""} active={tab === "documents" && filter === "expiring"} onClick={() => go("documents", "expiring")} sub="Within 30 days" />
        <Kpi label="Expired documents" value={summary.docs_expired} tone={summary.docs_expired ? "text-danger" : ""} active={tab === "documents" && filter === "expired"} onClick={() => go("documents", "expired")} sub={`of ${summary.docs_total} on file`} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex gap-1 rounded-xl border border-line bg-surface p-1">
          {(["movements", "documents"] as const).map((t) => (
            <button key={t} onClick={() => go(t)} className={clsx("relative rounded-lg px-4 py-1.5 text-sm font-medium transition-colors", tab === t ? "text-primary-fg" : "text-muted hover:text-fg")}>
              {tab === t && <motion.span layoutId="compliance-tab" className="absolute inset-0 rounded-lg bg-primary" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
              <span className="relative inline-flex items-center gap-2">
                <FontAwesomeIcon icon={t === "movements" ? faTruck : faFileLines} /> {titleCase(t)}
              </span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className={SELECT} aria-label="Status">
            {filters.map((f) => (
              <option key={f} value={f}>
                {f === "all" ? "Any status" : titleCase(f)}
              </option>
            ))}
          </select>
          {tab === "documents" && (
            <select value={docType} onChange={(e) => setDocType(e.target.value)} className={SELECT} aria-label="Document type">
              <option value="">Any type</option>
              {Object.entries(DOC_TYPE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          )}
          <select value={ranch} onChange={(e) => setRanch(e.target.value)} className={SELECT} aria-label="Ranch">
            <option value="">All ranches</option>
            {ranches.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {tab === "movements" ? (
        moves.length === 0 ? (
          <Card>
            <p className="px-5 py-12 text-center text-sm text-muted">No movements match these filters.</p>
          </Card>
        ) : (
          <ul className="grid gap-3">
            {moves.map((m) => (
              <li key={m.id}>
                <Link href={`/compliance/movements/${m.id}`} className="group block">
                  <Card className="p-4 transition group-hover:border-primary/60 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-x-2 text-sm font-semibold">
                          <span className="truncate">{place(m.origin)}</span>
                          <FontAwesomeIcon icon={faChevronRight} className="text-[10px] text-muted" />
                          <span className="truncate">{place(m.destination)}</span>
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          {fmtDate(m.moved_at)} · {titleCase(m.purpose)} · {ranchName[m.ranch_id]}
                          {m.carrier && ` · ${m.carrier}`}
                        </p>
                      </div>
                      <MovementStatusBadge movement={m} />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <DirectionBadge direction={m.direction} />
                      <Badge tone={m.kind === "interstate" ? "info" : "neutral"}>{titleCase(m.kind)}</Badge>
                      {m.document_ids.length > 0 ? (
                        <Badge tone="ok">
                          <FontAwesomeIcon icon={faPaperclip} /> {m.document_ids.length} {m.document_ids.length === 1 ? "document" : "documents"}
                        </Badge>
                      ) : (
                        <Badge>No documents</Badge>
                      )}
                      <span className="mx-1 hidden h-4 w-px bg-line sm:block" />
                      {m.animal_ids.slice(0, 4).map((id) => (
                        <span key={id} className="rounded-md bg-surface2 px-1.5 py-0.5 font-mono text-[11px]">
                          {tags[id]}
                        </span>
                      ))}
                      {m.animal_ids.length > 4 && <span className="text-[11px] text-muted">+{m.animal_ids.length - 4} more</span>}
                    </div>
                    {m.issues.length > 0 && (
                      <p className="mt-3 flex items-start gap-2 rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
                        <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5" /> {m.issues.join(". ")}
                      </p>
                    )}
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : docs.length === 0 ? (
        <Card>
          <p className="px-5 py-12 text-center text-sm text-muted">No documents match these filters.</p>
        </Card>
      ) : (
        <Card className="divide-y divide-line overflow-hidden">
          {docs.map((d) => (
            <Link key={d.id} href={`/compliance/documents/${d.id}`} className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface2 sm:px-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-info/15 text-info">
                <FontAwesomeIcon icon={faFileLines} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{d.title}</p>
                <p className="truncate text-xs text-muted">
                  {DOC_TYPE_LABEL[d.doc_type]} · {ranchName[d.ranch_id]} · {d.animal_ids.length} {d.animal_ids.length === 1 ? "animal" : "animals"} · {fmtSize(d.size_kb)}
                </p>
              </div>
              <div className="hidden text-right sm:block">
                <DocStatusBadge status={d.status} daysLeft={d.days_left} />
                <p className="mt-1 text-[11px] text-muted">{d.expires_at ? `Expires ${fmtDate(d.expires_at)}` : `Issued ${fmtDate(d.issued_at)}`}</p>
              </div>
              <div className="sm:hidden">
                <DocStatusBadge status={d.status} daysLeft={d.days_left} />
              </div>
              <FontAwesomeIcon icon={faChevronRight} className="text-xs text-muted transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
