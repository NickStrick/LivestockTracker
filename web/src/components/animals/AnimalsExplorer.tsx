"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight, faMagnifyingGlass, faMars, faVenus, faXmark } from "@fortawesome/free-solid-svg-icons";
import type { AnimalOut } from "@/lib/types";

import { Badge, Card, StatusBadge } from "@/components/ui";
import { useI18n } from "@/lib/i18n/client";

const STATUSES = ["all", "active", "sold", "deceased"] as const;
const PAGE = 20;
const INPUT = "h-11 rounded-xl border border-line bg-surface px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

function GenderIcon({ g }: { g: string | null }) {
  if (g === "bull" || g === "steer") return <FontAwesomeIcon icon={faMars} className="text-info" />;
  if (g === "cow" || g === "heifer") return <FontAwesomeIcon icon={faVenus} className="text-accent" />;
  return null;
}

export function AnimalsExplorer({ animals, ranches }: { animals: AnimalOut[]; ranches: { id: string; name: string }[] }) {
  const { t, ageLabel, titleCase } = useI18n();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("active");
  const [ranch, setRanch] = useState("");
  const [gender, setGender] = useState("");
  const [limit, setLimit] = useState(PAGE);
  // Any filter change goes back to the first page.
  const reset = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setLimit(PAGE);
  };

  const ranchName = useMemo(() => Object.fromEntries(ranches.map((r) => [r.id, r.name])), [ranches]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: animals.length };
    for (const a of animals) c[a.status] = (c[a.status] ?? 0) + 1;
    return c;
  }, [animals]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return animals.filter(
      (a) =>
        (status === "all" || a.status === status) &&
        (!ranch || a.ranch_id === ranch) &&
        (!gender || a.gender === gender) &&
        (!needle || [a.tag_id, a.registry_number, a.color, a.breed_association].some((f) => f?.toLowerCase().includes(needle))),
    );
  }, [animals, q, status, ranch, gender]);

  const shown = rows.slice(0, limit);
  const filtered = q || ranch || gender || status !== "active";

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <label className="relative block">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => reset(setQ)(e.target.value)} placeholder={t("Search tag, registry #, color, breed")} className={clsx(INPUT, "w-full pl-10 pr-10")} inputMode="search" />
          {q && (
            <button onClick={() => reset(setQ)("")} aria-label={t("Clear search")} className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted hover:text-fg">
              <FontAwesomeIcon icon={faXmark} />
            </button>
          )}
        </label>
        <div className="grid grid-cols-2 gap-2 sm:contents">
          <select value={ranch} onChange={(e) => reset(setRanch)(e.target.value)} className={INPUT} aria-label={t("Ranch")}>
            <option value="">{t("All ranches")}</option>
            {ranches.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <select value={gender} onChange={(e) => reset(setGender)(e.target.value)} className={INPUT} aria-label={t("Gender")}>
            <option value="">{t("Any gender")}</option>
            {["cow", "heifer", "steer", "bull"].map((g) => (
              <option key={g} value={g}>
                {titleCase(g)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="scroll-x -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="inline-flex gap-1 rounded-xl border border-line bg-surface p-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => reset(setStatus)(s)}
              className={clsx("relative rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors", status === s ? "text-primary-fg" : "text-muted hover:text-fg")}
            >
              {status === s && <motion.span layoutId="status-pill" className="absolute inset-0 rounded-lg bg-primary" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
              <span className="relative">
                {titleCase(s)} <span className="opacity-70">{counts[s] ?? 0}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted" aria-live="polite">
        {rows.length > shown.length ? t("Showing {a} of {b}", { a: shown.length, b: rows.length }) : rows.length === 1 ? t("1 animal") : t("{n} animals", { n: rows.length })}
        {filtered && (
          <>
            {" · "}
            <button
              className="font-medium text-primary hover:underline"
              onClick={() => {
                setQ("");
                setRanch("");
                setGender("");
                setStatus("active");
                setLimit(PAGE);
              }}
            >{t("reset filters")}
            </button>
          </>
        )}
      </p>

      {rows.length === 0 ? (
        <Card>
          <p className="px-5 py-12 text-center text-sm text-muted">{t("No animals match these filters.")}</p>
        </Card>
      ) : (
        <>
          {/* Mobile: cards */}
          <ul className="grid gap-2 md:hidden">
            {shown.map((a) => (
              <li key={a.id}>
                <Link href={`/animals/${a.id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5 transition active:scale-[0.99]">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface2 text-lg">
                    <GenderIcon g={a.gender} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm font-semibold">{a.tag_id}</p>
                      <StatusBadge status={a.status} />
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {[a.gender && titleCase(a.gender), a.color && t(a.color), ageLabel(a.dob)].filter(Boolean).join(" · ")}
                    </p>
                    <p className="truncate text-xs text-muted">{ranchName[a.ranch_id]}</p>
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
                    {["Tag", "Status", "Gender", "Color", "Age", "Ranch", "Registry", ""].map((h) => (
                      <th key={h} className={clsx("px-4 py-3 font-medium", h === "Registry" && "hidden lg:table-cell")}>
                        {t(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {shown.map((a) => (
                    <tr key={a.id} className="group transition-colors hover:bg-surface2/60">
                      <td className="px-4 py-3 font-mono font-semibold">
                        <Link href={`/animals/${a.id}`} className="hover:text-primary">
                          {a.tag_id}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-2">
                          <GenderIcon g={a.gender} />
                          {a.gender ? titleCase(a.gender) : "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">{a.color ? t(a.color) : "-"}</td>
                      <td className="px-4 py-3 tabular-nums">{ageLabel(a.dob)}</td>
                      <td className="px-4 py-3 text-muted">{ranchName[a.ranch_id]}</td>
                      <td className="hidden px-4 py-3 lg:table-cell">
                        {a.registry_number ? <Badge>{a.registry_number}</Badge> : <span className="text-muted">-</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/animals/${a.id}`} aria-label={t("Open {tag}", { tag: a.tag_id })} className="text-muted group-hover:text-primary">
                          <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          {rows.length > shown.length && (
            <div className="text-center">
              <button onClick={() => setLimit((l) => l + PAGE)} className="rounded-xl border border-line bg-surface px-5 py-2.5 text-sm font-medium transition hover:bg-surface2 active:scale-[0.98]">
                {t("Show {n} more", { n: Math.min(PAGE, rows.length - shown.length) })}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
