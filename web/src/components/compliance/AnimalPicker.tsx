"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import type { AnimalOut } from "@/lib/types";

import { useI18n } from "@/lib/i18n/client";
import { AnimalTag } from "@/components/ui";

/** Searchable multi-select of animals. `selected` holds animal ids. */
export function AnimalPicker({ animals, selected, onChange, error }: { animals: AnimalOut[]; selected: string[]; onChange: (ids: string[]) => void; error?: string }) {
  const { t, titleCase } = useI18n();
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return animals.filter((a) => !n || a.tag_id.toLowerCase().includes(n) || a.nickname?.toLowerCase().includes(n) || a.color?.toLowerCase().includes(n) || a.gender?.includes(n));
  }, [animals, q]);
  const set = new Set(selected);
  const toggle = (id: string) => onChange(set.has(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  return (
    <div>
      <div className={clsx("overflow-hidden rounded-xl border bg-surface", error ? "border-danger" : "border-line")}>
        <label className="relative block border-b border-line">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Search animals")} className="h-10 w-full bg-transparent pl-9 pr-3 text-sm outline-none" aria-label={t("Search animals")} />
        </label>
        <ul className="max-h-52 divide-y divide-line overflow-y-auto">
          {rows.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">{t("No animals available.")}</li>}
          {rows.map((a) => (
            <li key={a.id}>
              <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-surface2">
                <input type="checkbox" checked={set.has(a.id)} onChange={() => toggle(a.id)} className="size-5 accent-[var(--primary)]" />
                <AnimalTag tag={a.tag_id} nickname={a.nickname} className="shrink-0 text-sm" />
                <span className="truncate text-xs text-muted">{[a.gender && titleCase(a.gender), a.color && t(a.color)].filter(Boolean).join(" · ")}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>
      <p className={clsx("mt-1.5 text-xs", error ? "text-danger" : "text-muted")}>{error ? t(error) : selected.length === 1 ? t("1 selected") : t("{n} selected", { n: selected.length })}</p>
    </div>
  );
}
