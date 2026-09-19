"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import clsx from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationCrosshairs, faMap, faRotateLeft, faSatellite, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { closeRing, ringAcres } from "@/lib/geo";
import { fmtNum, titleCase } from "@/lib/format";
import type { RefShape } from "./BoundaryEditor";

const BoundaryEditor = dynamic(() => import("./BoundaryEditor"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center bg-surface2 text-sm text-muted">Loading map…</div>,
});

const CHIP = "inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-medium transition-colors";

/** Tap-to-draw polygon picker. `value` is an open list of [lon, lat] vertices (not closed). */
export function BoundaryPicker({
  value,
  onChange,
  reference = [],
  color = "#22c55e",
  error,
}: {
  value: number[][];
  onChange: (pts: number[][]) => void;
  reference?: RefShape[];
  color?: string;
  error?: string;
}) {
  const [layer, setLayer] = useState<"street" | "satellite">("satellite");
  const [locate, setLocate] = useState(0);
  const [locateFailed, setLocateFailed] = useState(false);
  const acres = value.length >= 3 ? ringAcres(closeRing(value)) : 0;

  return (
    <div>
      <div className={clsx("overflow-hidden rounded-2xl border bg-surface", error ? "border-danger" : "border-line")}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line p-2">
          <div className="inline-flex rounded-xl bg-surface2 p-0.5">
            {(["satellite", "street"] as const).map((l) => (
              <button type="button" key={l} onClick={() => setLayer(l)} className={clsx(CHIP, layer === l ? "bg-surface shadow-sm" : "text-muted")}>
                <FontAwesomeIcon icon={l === "satellite" ? faSatellite : faMap} /> {titleCase(l)}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => {
                setLocateFailed(false);
                setLocate((n) => n + 1);
              }}
              className={clsx(CHIP, "border border-line text-muted hover:text-fg")}
            >
              <FontAwesomeIcon icon={faLocationCrosshairs} /> My location
            </button>
            <button type="button" onClick={() => onChange(value.slice(0, -1))} disabled={!value.length} className={clsx(CHIP, "border border-line text-muted hover:text-fg disabled:opacity-40")} aria-label="Undo last point">
              <FontAwesomeIcon icon={faRotateLeft} /> Undo
            </button>
            <button type="button" onClick={() => onChange([])} disabled={!value.length} className={clsx(CHIP, "border border-line text-muted hover:text-danger disabled:opacity-40")} aria-label="Clear all points">
              <FontAwesomeIcon icon={faTrashCan} />
            </button>
          </div>
        </div>
        <div className="h-[50vh] min-h-72 sm:h-[26rem]">
          <BoundaryEditor
            points={value}
            onAdd={(p) => onChange([...value, p])}
            reference={reference}
            layer={layer}
            color={color}
            locateSignal={locate}
            onLocateError={() => setLocateFailed(true)}
          />
        </div>
      </div>
      <p className={clsx("mt-1.5 text-xs", error ? "text-danger" : "text-muted")}>
        {error ??
          (value.length === 0
            ? "Tap the map to place each corner in order. You need at least 3 points."
            : `${value.length} ${value.length === 1 ? "point" : "points"}${acres ? ` · about ${fmtNum(acres)} acres` : " · add at least 3"}`)}
        {locateFailed && <span className="text-warn"> Couldn&apos;t get your location. Check browser permission.</span>}
      </p>
    </div>
  );
}
