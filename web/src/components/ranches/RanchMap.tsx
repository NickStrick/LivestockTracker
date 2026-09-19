"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CircleMarker, MapContainer, Polygon, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Ring, ZoneOut } from "@/lib/types";
import { TILES, ZONE_COLORS, type MapAnimal } from "./zones";

const flip = (ring: Ring): LatLngExpression[] => ring.map(([lon, lat]) => [lat, lon]);
const boundsOf = (ring: Ring): LatLngBoundsExpression => {
  const lons = ring.map((p) => p[0]);
  const lats = ring.map((p) => p[1]);
  return [
    [Math.min(...lats), Math.min(...lons)],
    [Math.max(...lats), Math.max(...lons)],
  ];
};

/** Pan/zoom to one point (used to reveal a selected animal). */
function FlyToPoint({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lon], Math.max(map.getZoom(), 15), { duration: 0.8 });
  }, [map, lat, lon]);
  return null;
}

function FlyTo({ ring }: { ring: Ring }) {
  const map = useMap();
  useEffect(() => {
    map.flyToBounds(boundsOf(ring), { padding: [24, 24], duration: 0.8 });
  }, [map, ring]);
  return null;
}

export default function RanchMap({
  boundary,
  zones,
  animals,
  layer,
  selectedZone,
  showAnimals,
  highlight = null,
}: {
  boundary: Ring;
  zones: ZoneOut[];
  animals: MapAnimal[];
  layer: "street" | "satellite";
  selectedZone: string | null;
  showAnimals: boolean;
  /** animal_id to emphasise and fly to. */
  highlight?: string | null;
}) {
  const router = useRouter();
  const focus = zones.find((z) => z.id === selectedZone)?.boundary ?? null;
  const marked = animals.find((a) => a.animal_id === highlight) ?? null;
  // Fit the initial view to the perimeter AND any animals that are outside it.
  const fitRing: Ring = [...boundary, ...animals.map((a) => [a.lon, a.lat])];

  return (
    <MapContainer bounds={boundsOf(fitRing)} boundsOptions={{ padding: [24, 24] }} scrollWheelZoom={false} className={`map-${layer} h-full w-full`} attributionControl>
      <TileLayer key={layer} url={TILES[layer].url} attribution={TILES[layer].attr} />
      <Polygon positions={flip(boundary)} pathOptions={{ color: "#ffffff", weight: 3, fillOpacity: 0, dashArray: "8 6" }} />
      {zones.map((z) => {
        const sel = z.id === selectedZone;
        return (
          <Polygon
            key={z.id}
            positions={flip(z.boundary)}
            pathOptions={{
              color: ZONE_COLORS[z.zone_type],
              weight: sel ? 4 : 2,
              fillOpacity: z.active ? (sel ? 0.5 : 0.3) : 0.08,
              dashArray: z.active ? undefined : "4 6",
            }}
          >
            <Tooltip sticky>{z.name}</Tooltip>
          </Polygon>
        );
      })}
      {showAnimals &&
        animals.map((a) => (
          <CircleMarker
            key={a.animal_id}
            center={[a.lat, a.lon]}
            radius={a.animal_id === highlight ? 12 : a.inside_boundary ? 5 : 8}
            pathOptions={{ color: a.animal_id === highlight ? "#fde047" : "#ffffff", weight: a.animal_id === highlight ? 3 : 1.5, fillColor: a.inside_boundary ? "#22c55e" : "#ef4444", fillOpacity: 1 }}
            eventHandlers={{ click: () => router.push(`/animals/${a.animal_id}`) }}
          >
            <Tooltip>
              {a.tag_id}
              {a.inside_boundary ? "" : " (outside boundary)"}
            </Tooltip>
          </CircleMarker>
        ))}
      {focus && <FlyTo ring={focus} />}
      {marked && <FlyToPoint lat={marked.lat} lon={marked.lon} />}
    </MapContainer>
  );
}
