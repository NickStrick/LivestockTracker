"use client";

import { useEffect } from "react";
import { CircleMarker, MapContainer, Polygon, Polyline, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Ring } from "@/lib/types";
import { TILES } from "./zones";

export interface RefShape {
  ring: Ring;
  color: string;
  dashed?: boolean;
  fill?: boolean;
}

const flip = (ring: Ring): LatLngExpression[] => ring.map(([lon, lat]) => [lat, lon]);
const boundsOf = (ring: Ring): LatLngBoundsExpression => {
  const lons = ring.map((p) => p[0]);
  const lats = ring.map((p) => p[1]);
  return [
    [Math.min(...lats), Math.min(...lons)],
    [Math.max(...lats), Math.max(...lons)],
  ];
};

function Clicks({ onAdd }: { onAdd: (p: number[]) => void }) {
  useMapEvents({ click: (e) => onAdd([+e.latlng.lng.toFixed(6), +e.latlng.lat.toFixed(6)]) });
  return null;
}

/** Re-runs geolocation whenever `signal` changes (0 = never). */
function Locate({ signal, onError }: { signal: number; onError: () => void }) {
  const map = useMap();
  useMapEvents({ locationerror: onError });
  useEffect(() => {
    if (signal > 0) map.locate({ setView: true, maxZoom: 16 });
  }, [signal, map]);
  return null;
}

export default function BoundaryEditor({
  points,
  onAdd,
  reference,
  layer,
  color,
  locateSignal,
  onLocateError,
}: {
  points: number[][];
  onAdd: (p: number[]) => void;
  reference: RefShape[];
  layer: "street" | "satellite";
  color: string;
  locateSignal: number;
  onLocateError: () => void;
}) {
  const view = reference[0] ? { bounds: boundsOf(reference[0].ring), boundsOptions: { padding: [32, 32] as [number, number] } } : { center: [39.5, -98.35] as [number, number], zoom: 4 };

  return (
    <MapContainer {...view} scrollWheelZoom={false} className={`map-${layer} h-full w-full cursor-crosshair`}>
      <TileLayer key={layer} url={TILES[layer].url} attribution={TILES[layer].attr} />
      {reference.map((r, i) => (
        <Polygon
          key={i}
          positions={flip(r.ring)}
          pathOptions={{ color: r.color, weight: r.dashed ? 3 : 2, dashArray: r.dashed ? "8 6" : undefined, fillOpacity: r.fill ? 0.2 : 0, interactive: false }}
        />
      ))}
      {points.length >= 3 ? (
        <Polygon positions={flip(points)} pathOptions={{ color, weight: 3, fillOpacity: 0.3, interactive: false }} />
      ) : (
        points.length > 1 && <Polyline positions={flip(points)} pathOptions={{ color, weight: 3, interactive: false }} />
      )}
      {points.map(([lon, lat], i) => (
        <CircleMarker
          key={i}
          center={[lat, lon]}
          radius={i === 0 ? 8 : 6}
          pathOptions={{ color: "#ffffff", weight: 2, fillColor: i === 0 ? "#f59e0b" : color, fillOpacity: 1, interactive: false }}
        />
      ))}
      <Clicks onAdd={onAdd} />
      <Locate signal={locateSignal} onError={onLocateError} />
    </MapContainer>
  );
}
