"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import clsx from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCow, faLayerGroup, faMap, faSatellite } from "@fortawesome/free-solid-svg-icons";
import type { Ring, ZoneOut } from "@/lib/types";
import { titleCase } from "@/lib/format";
import { Badge, Card, CardHeader } from "@/components/ui";
import { ZONE_COLORS, type MapAnimal } from "./zones";

const RanchMap = dynamic(() => import("./RanchMap"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center bg-surface2 text-sm text-muted">Loading map…</div>,
});

const CHIP = "inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-medium transition-colors";

export function RanchView({ boundary, zones, animals }: { boundary: Ring; zones: ZoneOut[]; animals: MapAnimal[] }) {
  const [layer, setLayer] = useState<"street" | "satellite">("satellite");
  const [selected, setSelected] = useState<string | null>(null);
  const [showAnimals, setShowAnimals] = useState(true);
  const out = animals.filter((a) => !a.inside_boundary).length;

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
            <FontAwesomeIcon icon={faCow} /> Animals ({animals.length}){out > 0 && <span className="text-danger">· {out} out</span>}
          </button>
        </div>
        <div className="h-[55vh] min-h-72 sm:h-[60vh] lg:h-[34rem]">
          <RanchMap boundary={boundary} zones={zones} animals={animals} layer={layer} selectedZone={selected} showAnimals={showAnimals} />
        </div>
      </Card>

      <Card className="h-fit">
        <CardHeader title="Zones" icon={faLayerGroup} sub={`${zones.filter((z) => z.active).length} active of ${zones.length}`} />
        <ul className="divide-y divide-line">
          {zones.map((z) => (
            <li key={z.id}>
              <button onClick={() => setSelected((s) => (s === z.id ? null : z.id))} className={clsx("flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface2 sm:px-5", selected === z.id && "bg-surface2")}>
                <span className="mt-1.5 size-3 shrink-0 rounded-sm" style={{ background: ZONE_COLORS[z.zone_type], opacity: z.active ? 1 : 0.4 }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{z.name}</p>
                    {!z.active && <Badge>Lifted</Badge>}
                  </div>
                  <p className="text-xs text-muted">{titleCase(z.zone_type)}</p>
                  {z.description && <p className="mt-0.5 text-xs text-muted/90">{z.description}</p>}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
