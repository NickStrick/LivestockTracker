"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight, faSyringe } from "@fortawesome/free-solid-svg-icons";
import type { VaccinationRow, VaccinationState } from "@/lib/types";

import { Badge, Card, CardHeader, type Tone } from "@/components/ui";
import { VaccineBreakdownChart } from "@/components/charts/Charts";
import { useI18n } from "@/lib/i18n/client";

type Filter = "all" | VaccinationState;
const SELECT = "h-10 rounded-xl border border-line bg-surface px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";
const PAGE = 25;

const STATE: Record<VaccinationState, { label: string; tone: Tone; text: string }> = {
  overdue: { label: "Overdue", tone: "danger", text: "text-danger" },
  due_soon: { label: "Due in 30 days", tone: "warn", text: "text-warn" },
  ok: { label: "Up to date", tone: "ok", text: "text-ok" },
};

function StateBadge({ row }: { row: VaccinationRow }) {
  const { t } = useI18n();
  const d = Math.abs(row.days);
  const text = row.state === "overdue" ? t("{n}d overdue", { n: d }) : t("Due in {n}d", { n: d });
  return <Badge tone={STATE[row.state].tone}>{text}</Badge>;
}

export function VaccinationsExplorer({ rows, ranches, initial = "overdue" }: { rows: VaccinationRow[]; ranches: { id: string; name: string }[]; initial?: Filter }) {
  const { t, fmtDate } = useI18n();
  const [filter, setFilter] = useState<Filter>(initial);
  const [ranch, setRanch] = useState("");
  const [vaccine, setVaccine] = useState("");
  const [limit, setLimit] = useState(PAGE);

  const scoped = useMemo(() => rows.filter((r) => (!ranch || r.ranch_id === ranch) && (!vaccine || r.vaccine === vaccine)), [rows, ranch, vaccine]);
  const counts = useMemo(() => {
    const c = { all: scoped.length, overdue: 0, due_soon: 0, ok: 0 };
    for (const r of scoped) c[r.state]++;
    return c;
  }, [scoped]);
  const visible = scoped.filter((r) => filter === "all" || r.state === filter);
  const shown = visible.slice(0, limit);
  const vaccines = useMemo(() => [...new Set(rows.map((r) => r.vaccine))].sort(), [rows]);

  const breakdown = useMemo(
    () =>
      vaccines
        .map((v) => ({
          vaccine: v,
          overdue: scoped.filter((r) => r.vaccine === v && r.state === "overdue").length,
          due_soon: scoped.filter((r) => r.vaccine === v && r.state === "due_soon").length,
        }))
        .filter((d) => d.overdue + d.due_soon > 0)
        .sort((a, b) => b.overdue + b.due_soon - (a.overdue + a.due_soon)),
    [vaccines, scoped],
  );

  const pick = (f: Filter) => {
    setFilter(f);
    setLimit(PAGE);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-3 gap-3">
        {(["overdue", "due_soon", "ok"] as const).map((s) => (
          <button
            key={s}
            onClick={() => pick(filter === s ? "all" : s)}
            aria-pressed={filter === s}
            className={clsx("rounded-2xl border bg-surface p-3.5 text-left transition hover:border-primary/60 active:scale-[0.99] sm:p-4", filter === s ? "border-primary ring-2 ring-primary/20" : "border-line")}
          >
            <p className="text-xs font-medium text-muted">{t(STATE[s].label)}</p>
            <p className={clsx("mt-1 text-2xl font-semibold tabular-nums", counts[s] && STATE[s].text)}>{counts[s]}</p>
          </button>
        ))}
      </div>

      {breakdown.length > 0 && (
        <Card>
          <CardHeader title={t("By vaccine")} sub={t("Doses that need attention")} icon={faSyringe} />
          <div className="p-3 sm:p-5">
            <VaccineBreakdownChart data={breakdown} />
          </div>
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted" aria-live="polite">
          {visible.length > shown.length ? t("Showing {a} of {b}", { a: shown.length, b: visible.length }) : visible.length === 1 ? t("1 dose") : t("{n} doses", { n: visible.length })}
          {filter !== "all" && (
            <>
              {" · "}
              <button className="font-medium text-primary hover:underline" onClick={() => pick("all")}>{t("show all")}
              </button>
            </>
          )}
        </p>
        <div className="flex w-full gap-2 sm:w-auto">
          <select value={vaccine} onChange={(e) => { setVaccine(e.target.value); setLimit(PAGE); }} className={clsx(SELECT, "min-w-0 flex-1 sm:flex-none")} aria-label={t("Vaccine")}>
            <option value="">{t("All vaccines")}</option>
            {vaccines.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <select value={ranch} onChange={(e) => { setRanch(e.target.value); setLimit(PAGE); }} className={clsx(SELECT, "min-w-0 flex-1 sm:flex-none")} aria-label={t("Ranch")}>
            <option value="">{t("All ranches")}</option>
            {ranches.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {visible.length === 0 ? (
        <Card>
          <p className="px-5 py-12 text-center text-sm text-muted">{filter === "overdue" ? t("Nothing is overdue. Nice work.") : t("No doses match these filters.")}</p>
        </Card>
      ) : (
        <>
          {/* Mobile: cards */}
          <ul className="grid gap-2 md:hidden">
            {shown.map((r) => (
              <li key={r.id}>
                <Link href={`/animals/${r.animal_id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5 transition active:scale-[0.99]">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono text-sm font-semibold">{r.tag_id}</p>
                      <StateBadge row={r} />
                    </div>
                    <p className="mt-0.5 truncate text-sm">{r.vaccine}</p>
                    <p className="truncate text-xs text-muted">
                      {t("Given {given} · due {due}", { given: fmtDate(r.administered_at), due: fmtDate(r.next_due_at) })} · {r.ranch_name}
                    </p>
                  </div>
                  <FontAwesomeIcon icon={faChevronRight} className="text-xs text-muted" />
                </Link>
              </li>
            ))}
          </ul>

          {/* Tablet/desktop: table */}
          <Card className="hidden overflow-hidden md:block">
            <div className="scroll-x">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line bg-surface2/60 text-[11px] uppercase tracking-wide text-muted">
                  <tr>
                    {["Animal", "Vaccine", "Last given", "Due", "Status", "Ranch", "Given by", ""].map((h) => (
                      <th key={h} className={clsx("px-4 py-3 font-medium", h === "Given by" && "hidden xl:table-cell")}>
                        {t(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {shown.map((r) => (
                    <tr key={r.id} className="group transition-colors hover:bg-surface2/60">
                      <td className="px-4 py-3 font-mono font-semibold">
                        <Link href={`/animals/${r.animal_id}`} className="hover:text-primary">
                          {r.tag_id}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{r.vaccine}</td>
                      <td className="px-4 py-3 text-muted">{fmtDate(r.administered_at)}</td>
                      <td className="px-4 py-3">{fmtDate(r.next_due_at)}</td>
                      <td className="px-4 py-3">
                        <StateBadge row={r} />
                      </td>
                      <td className="px-4 py-3 text-muted">{r.ranch_name}</td>
                      <td className="hidden px-4 py-3 text-muted xl:table-cell">{r.administered_by}</td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/animals/${r.animal_id}`} aria-label={t("Open {tag}", { tag: r.tag_id })} className="text-muted group-hover:text-primary">
                          <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {visible.length > shown.length && (
            <div className="text-center">
              <button onClick={() => setLimit((l) => l + PAGE)} className="rounded-xl border border-line bg-surface px-5 py-2.5 text-sm font-medium transition hover:bg-surface2 active:scale-[0.98]">
                {t("Show {n} more", { n: Math.min(PAGE, visible.length - shown.length) })}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
