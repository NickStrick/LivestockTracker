import type { ZoneType } from "@/lib/types";

// Kept out of RanchMap.tsx so importing it doesn't pull leaflet into the server bundle.
export const ZONE_COLORS: Record<ZoneType, string> = {
  pasture: "#4c9f5f",
  water: "#3b82f6",
  dangerous_terrain: "#dc2626",
  forest: "#166534",
  paddock: "#d99a2b",
  quarantine: "#9333ea",
};

export interface MapAnimal {
  animal_id: string;
  tag_id: string;
  lat: number;
  lon: number;
  inside_boundary: boolean;
}

export const TILES = {
  street: { url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attr: "&copy; OpenStreetMap contributors" },
  satellite: { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attr: "Tiles &copy; Esri" },
};
