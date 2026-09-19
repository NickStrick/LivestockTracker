import type { Ring } from "./types";

/** Ray-casting point-in-polygon. Ring is [[lon, lat], ...]. */
export function pointInRing(lon: number, lat: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/** Approximate polygon area in acres (planar; fine for display, not for surveying). */
export function ringAcres(ring: Ring): number {
  const lat0 = ring[0][1];
  const kx = 111_320 * Math.cos((lat0 * Math.PI) / 180);
  const ky = 110_540;
  let s = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    s += ring[i][0] * kx * ring[i + 1][1] * ky - ring[i + 1][0] * kx * ring[i][1] * ky;
  }
  return Math.round((Math.abs(s) / 2) * 0.000247105);
}

/** Close a list of drawn vertices into a ring (first == last), as the API expects. */
export const closeRing = (pts: number[][]): Ring => (pts.length ? [...pts, pts[0]] : []);

/** Shortest distance in meters from a point to a ring's edge (local planar approximation). */
export function distanceToRingMeters(lon: number, lat: number, ring: Ring): number {
  const kx = 111_320 * Math.cos((lat * Math.PI) / 180);
  const ky = 110_540;
  const px = lon * kx;
  const py = lat * ky;
  let best = Infinity;
  for (let i = 0; i < ring.length - 1; i++) {
    const ax = ring[i][0] * kx;
    const ay = ring[i][1] * ky;
    const bx = ring[i + 1][0] * kx;
    const by = ring[i + 1][1] * ky;
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2)) : 0;
    best = Math.min(best, Math.hypot(px - (ax + t * dx), py - (ay + t * dy)));
  }
  return Math.round(best);
}
