"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCow, faLayerGroup, faMap, faSatellite } from "@fortawesome/free-solid-svg-icons";
import type { Ring, ZoneOut, ZoneUpdate } from "@/lib/types";

import { Badge, Card, CardHeader } from "@/components/ui";
import { btn } from "@/components/ui-styles";
import { ZONE_COLORS, type MapAnimal } from "./zones";
import { useI18n } from "@/lib/i18n/client";
import { MapLoading } from "@/components/ranches/MapLoading";

const RanchMap = dynamic(() => import("./RanchMap"), {
  ssr: false,
  loading: () => <MapLoading />,
});

const CHIP = "inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-medium transition-colors";
const INPUT = "h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

function ZoneEditor({ zone, onApply }: { zone: ZoneOut; onApply: (patch: ZoneUpdate) => void }) {
  const { t } = useI18n();
  const [name, setName] = useState(zone.name);
  const [description, setDescription] = useState(zone.description ?? "");
  const [active, setActive] = useState(zone.active);
  const [sent, setSent] = useState<ZoneUpdate | null>(null);
  const dirty = name.trim() !== zone.name || (description.trim() || null) !== zone.description || active !== zone.active;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    // Send only what changed (PATCH semantics).
    const patch: ZoneUpdate = {};
    if (name.trim() !== zone.name) patch.name = name.trim();
    if ((description.trim() || null) !== zone.description) patch.description = description.trim() || null;
    if (active !== zone.active) patch.active = active;
    // TODO(backend): fetch(PATCH /ranches/{id}/zones/{zone_id})
    onApply(patch);
    setSent(patch);
  }

  return (
    <motion.form initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} onSubmit={submit} className="overflow-hidden border-t border-line bg-surface2/50">
      <div className="grid gap-3 p-4 sm:p-5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{t("Edit zone")}</p>
        <input value={name} onChange={(e) => setName(e.target.value)} className={INPUT} aria-label={t("Zone name")} />
        <input value={description} onChange={(e) => setDescription(e.target.value)} className={INPUT} placeholder={t("Description")} aria-label={t("Description")} />
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-line bg-surface px-3 py-2.5 text-sm">
          <span>
            <span className="font-medium">{active ? t("Active") : t("Lifted")}</span>
            <span className="block text-xs text-muted">{active ? t("Animals are tracked against this zone") : t("Zone is ignored for alerts")}</span>
          </span>
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="size-5 accent-[var(--primary)]" />
        </label>
        <button type="submit" disabled={!dirty || !name.trim()} className={btn.primary}>{t("Save changes")}
        </button>
        {sent && !dirty && (
          <p className="text-xs text-muted">
            {t("Applied on this page only (no backend yet). Would send")} <b>PATCH</b> <code className="font-mono">{JSON.stringify(sent)}</code>
          </p>
        )}
      </div>
    </motion.form>
  );
}

export function RanchView({ boundary, zones: initialZones, animals }: { boundary: Ring; zones: ZoneOut[]; animals: MapAnimal[] }) {
  const { t, titleCase } = useI18n();
  const [zones, setZones] = useState(initialZones);
  const [layer, setLayer] = useState<"street" | "satellite">("satellite");
  const [selected, setSelected] = useState<string | null>(null);
  const [showAnimals, setShowAnimals] = useState(true);
  const out = animals.filter((a) => !a.inside_boundary).length;
  const current = zones.find((z) => z.id === selected);

  function apply(id: string, patch: ZoneUpdate) {
    setZones((zs) =>
      zs.map((z) =>
        z.id !== id
          ? z
          : {
              ...z,
              name: patch.name ?? z.name,
              description: patch.description !== undefined ? patch.description : z.description,
              active: patch.active ?? z.active,
              lifted_at: patch.active === undefined ? z.lifted_at : patch.active ? null : new Date().toISOString(),
            },
      ),
    );
  }

  return (
    <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1fr_22rem]">
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line p-2">
          <div className="inline-flex rounded-xl bg-surface2 p-0.5">
            {(["satellite", "street"] as const).map((l) => (
              <button key={l} onClick={() => setLayer(l)} className={clsx(CHIP, layer === l ? "bg-surface shadow-sm" : "text-muted")}>
                <FontAwesomeIcon icon={l === "satellite" ? faSatellite : faMap} /> {titleCase(l)}
              </button>
            ))}
          </div>
          <button onClick={() => setShowAnimals((s) => !s)} className={clsx(CHIP, "border border-line", showAnimals ? "text-primary" : "text-muted")} aria-pressed={showAnimals}>
            <FontAwesomeIcon icon={faCow} /> {t("Animals ({n})", { n: animals.length })}{out > 0 && <span className="text-danger">· {t("{n} out", { n: out })}</span>}
          </button>
        </div>
        <div className="h-[55vh] min-h-72 sm:h-[60vh] lg:h-[34rem]">
          <RanchMap boundary={boundary} zones={zones} animals={animals} layer={layer} selectedZone={selected} showAnimals={showAnimals} />
        </div>
      </Card>

      <Card className="h-fit overflow-hidden">
        <CardHeader title={t("Zones")} icon={faLayerGroup} sub={t("{a} active of {b}", { a: zones.filter((z) => z.active).length, b: zones.length })} />
        <ul className="divide-y divide-line">
          {zones.map((z) => (
            <li key={z.id}>
              <button onClick={() => setSelected((s) => (s === z.id ? null : z.id))} className={clsx("flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface2 sm:px-5", selected === z.id && "bg-surface2")}>
                <span className="mt-1.5 size-3 shrink-0 rounded-sm" style={{ background: ZONE_COLORS[z.zone_type], opacity: z.active ? 1 : 0.4 }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{z.name}</p>
                    {!z.active && <Badge>{t("Lifted")}</Badge>}
                  </div>
                  <p className="text-xs text-muted">{titleCase(z.zone_type)}</p>
                  {z.description && <p className="mt-0.5 text-xs text-muted/90">{z.description}</p>}
                </div>
              </button>
            </li>
          ))}
        </ul>
        <AnimatePresence initial={false}>{current && <ZoneEditor key={current.id} zone={current} onApply={(p) => apply(current.id, p)} />}</AnimatePresence>
      </Card>
    </div>
  );
}
