"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CircleMarker, MapContainer, Polygon, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Ring, ZoneOut } from "@/lib/types";
import { ZONE_COLORS, type MapAnimal } from "./zones";

const flip = (ring: Ring): LatLngExpression[] => ring.map(([lon, lat]) => [lat, lon]);
const boundsOf = (ring: Ring): LatLngBoundsExpression => {
  const lons = ring.map((p) => p[0]);
  const lats = ring.map((p) => p[1]);
  return [
    [Math.min(...lats), Math.min(...lons)],
    [Math.max(...lats), Math.max(...lons)],
  ];
};

function FlyTo({ ring }: { ring: Ring }) {
  const map = useMap();
  useEffect(() => {
    map.flyToBounds(boundsOf(ring), { padding: [24, 24], duration: 0.8 });
  }, [map, ring]);
  return null;
}

const TILES = {
  street: { url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attr: "&copy; OpenStreetMap contributors" },
  satellite: { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attr: "Tiles &copy; Esri" },
};

export default function RanchMap({
  boundary,
  zones,
  animals,
  layer,
  selectedZone,
  showAnimals,
}: {
  boundary: Ring;
  zones: ZoneOut[];
  animals: MapAnimal[];
  layer: "street" | "satellite";
  selectedZone: string | null;
  showAnimals: boolean;
}) {
  const router = useRouter();
  const focus = zones.find((z) => z.id === selectedZone)?.boundary ?? null;

  return (
    <MapContainer bounds={boundsOf(boundary)} boundsOptions={{ padding: [24, 24] }} scrollWheelZoom={false} className={`map-${layer} h-full w-full`} attributionControl>
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
            radius={a.inside_boundary ? 5 : 8}
            pathOptions={{ color: "#ffffff", weight: 1.5, fillColor: a.inside_boundary ? "#22c55e" : "#ef4444", fillOpacity: 1 }}
            eventHandlers={{ click: () => router.push(`/animals/${a.animal_id}`) }}
          >
            <Tooltip>
              {a.tag_id}
              {a.inside_boundary ? "" : " (outside boundary)"}
            </Tooltip>
          </CircleMarker>
        ))}
      {focus && <FlyTo ring={focus} />}
    </MapContainer>
  );
}
