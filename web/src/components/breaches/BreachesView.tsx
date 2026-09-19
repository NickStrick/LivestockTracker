"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import clsx from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faLocationCrosshairs, faMap, faSatellite } from "@fortawesome/free-solid-svg-icons";
import type { BreachRow, Ring, ZoneOut } from "@/lib/types";
import { fmtDateTime, fmtNum, timeAgo, titleCase } from "@/lib/format";
import { useAlerts } from "@/components/alerts/AlertsProvider";
import { Badge, Card, CardHeader } from "@/components/ui";

const RanchMap = dynamic(() => import("@/components/ranches/RanchMap"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center bg-surface2 text-sm text-muted">Loading map…</div>,
});

const CHIP = "inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-medium transition-colors";

export interface BreachRanch {
  id: string;
  name: string;
  boundary: Ring;
  zones: ZoneOut[];
}

const meters = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${fmtNum(m)} m`);

export function BreachesView({ breaches, ranches }: { breaches: BreachRow[]; ranches: BreachRanch[] }) {
  const { isRead, markRead, ready } = useAlerts();
  const affected = useMemo(() => ranches.filter((r) => breaches.some((b) => b.ranch_id === r.id)), [ranches, breaches]);
  const [ranchId, setRanchId] = useState(affected[0]?.id ?? "");
  const [selected, setSelected] = useState<string | null>(null);
  const [layer, setLayer] = useState<"street" | "satellite">("satellite");

  const ranch = ranches.find((r) => r.id === ranchId);
  const list = breaches.filter((b) => b.ranch_id === ranchId);
  const open = breaches.filter((b) => !(ready && isRead(b.id))).length;
  const farthest = breaches.reduce((m, b) => Math.max(m, b.distance_m), 0);
  const mapAnimals = list.map((b) => ({ animal_id: b.animal_id, tag_id: b.tag_id, lat: b.lat, lon: b.lon, inside_boundary: false }));

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Outside now", value: String(breaches.length), tone: breaches.length ? "text-danger" : "" },
          { label: "Unacknowledged", value: ready ? String(open) : "-", tone: open && ready ? "text-warn" : "" },
          { label: "Farthest out", value: farthest ? meters(farthest) : "-", tone: "" },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-line bg-surface p-3.5 sm:p-4">
            <p className="text-xs font-medium text-muted">{k.label}</p>
            <p className={clsx("mt-1 text-2xl font-semibold tabular-nums", k.tone)}>{k.value}</p>
          </div>
        ))}
      </div>

      {affected.length > 1 && (
        <div className="inline-flex gap-1 rounded-xl border border-line bg-surface p-1">
          {affected.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                setRanchId(r.id);
                setSelected(null);
              }}
              className={clsx("rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors", ranchId === r.id ? "bg-primary text-primary-fg" : "text-muted hover:text-fg")}
            >
              {r.name} <span className="opacity-70">{breaches.filter((b) => b.ranch_id === r.id).length}</span>
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1fr_24rem]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-line p-2">
            <div className="inline-flex rounded-xl bg-surface2 p-0.5">
              {(["satellite", "street"] as const).map((l) => (
                <button key={l} onClick={() => setLayer(l)} className={clsx(CHIP, layer === l ? "bg-surface shadow-sm" : "text-muted")}>
                  <FontAwesomeIcon icon={l === "satellite" ? faSatellite : faMap} /> {titleCase(l)}
                </button>
              ))}
            </div>
            <span className="pr-2 text-xs text-muted">{ranch?.name}</span>
          </div>
          <div className="h-[46vh] min-h-64 sm:h-[26rem] lg:h-[32rem]">
            {ranch && <RanchMap key={ranch.id} boundary={ranch.boundary} zones={ranch.zones} animals={mapAnimals} layer={layer} selectedZone={null} showAnimals highlight={selected} />}
          </div>
        </Card>

        <Card className="h-fit overflow-hidden">
          <CardHeader title="Animals outside" sub={ranch?.name} icon={faLocationCrosshairs} />
          <ul className="divide-y divide-line">
            {list.map((b) => {
              const acked = ready && isRead(b.id);
              return (
                <li key={b.id} className={clsx("px-4 py-3.5 transition-colors sm:px-5", selected === b.animal_id && "bg-surface2", acked && "opacity-70")}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/animals/${b.animal_id}`} className="font-mono text-sm font-semibold text-primary hover:underline">
                        {b.tag_id}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted" title={fmtDateTime(b.occurred_at)}>
                        {timeAgo(b.occurred_at)} · {b.lat.toFixed(4)}, {b.lon.toFixed(4)}
                      </p>
                    </div>
                    <Badge tone={acked ? "neutral" : "danger"}>{meters(b.distance_m)} out</Badge>
                  </div>
                  <div className="mt-2.5 flex gap-2">
                    <button onClick={() => setSelected(selected === b.animal_id ? null : b.animal_id)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-2.5 text-xs font-medium transition hover:bg-surface2">
                      <FontAwesomeIcon icon={faLocationCrosshairs} /> Locate
                    </button>
                    <button
                      onClick={() => markRead(b.id)}
                      disabled={acked}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-2.5 text-xs font-medium transition hover:bg-surface2 disabled:pointer-events-none disabled:text-ok"
                    >
                      <FontAwesomeIcon icon={faCheck} /> {acked ? "Acknowledged" : "Acknowledge"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </div>
  );
}
