import { MOCK_NOW } from "./mock/seed";

const NOW = MOCK_NOW.getTime();
const DAY = 86_400_000;

export const fmtDate = (s: string | null | undefined) =>
  s ? new Date(s.length === 10 ? s + "T12:00:00Z" : s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : "-";

export const fmtDateTime = (s: string) =>
  new Date(s).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC" });

/** Relative to the mock "now" so server and client agree. Swap for Date.now() with real data. */
export function timeAgo(s: string): string {
  const diff = NOW - new Date(s).getTime();
  const abs = Math.abs(diff);
  const fut = diff < 0;
  const wrap = (v: string) => (fut ? `in ${v}` : `${v} ago`);
  if (abs < 3_600_000) return wrap(`${Math.max(1, Math.round(abs / 60_000))}m`);
  if (abs < DAY) return wrap(`${Math.round(abs / 3_600_000)}h`);
  if (abs < 30 * DAY) return wrap(`${Math.round(abs / DAY)}d`);
  if (abs < 365 * DAY) return wrap(`${Math.round(abs / (30.4 * DAY))}mo`);
  return wrap(`${(abs / (365 * DAY)).toFixed(1)}y`);
}

export function ageLabel(dob: string | null): string {
  if (!dob) return "-";
  const months = Math.floor((NOW - new Date(dob).getTime()) / (30.4 * DAY));
  if (months < 1) return "<1 mo";
  if (months < 24) return `${months} mo`;
  return `${(months / 12).toFixed(1)} yr`;
}

const ACTOR_NAMES: Record<string, string> = {
  "usr_maria.gomez": "Maria Gomez",
  "usr_dr.ortiz": "Dr. Ortiz",
  "usr_j.bartlett": "J. Bartlett",
  "system:gps-service": "GPS service",
};
/** Placeholder until user records exist; falls back to the raw actor_id. */
export const actorName = (id: string | null) => (id ? (ACTOR_NAMES[id] ?? id) : "System");

export const titleCase = (s: string) => s.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
export const fmtNum = (n: number) => n.toLocaleString("en-US");

export function eventLabel(type: string): string {
  return (
    {
      animal_created: "Animal registered",
      animal_updated: "Animal updated",
      identifier_added: "Identifier attached",
      ranch_created: "Ranch onboarded",
      zone_created: "Zone created",
      zone_updated: "Zone updated",
      vaccination_recorded: "Vaccination recorded",
      geofence_breach: "Geofence breach",
      movement_recorded: "Movement recorded",
    } as Record<string, string>
  )[type] ?? titleCase(type);
}

/** One-line human summary of an audit event's payload. */
export function eventSummary(type: string, d: Record<string, unknown> | null): string {
  if (!d) return "";
  switch (type) {
    case "animal_created":
      return `Tag ${d.tag_id}${d.gender ? ` (${d.gender})` : ""}`;
    case "animal_updated":
      return `Status → ${d.status}${d.cause_of_death ? ` (${d.cause_of_death})` : ""}`;
    case "identifier_added":
      return `${d.id_type} ${d.value}`;
    case "vaccination_recorded":
      return `${d.vaccine}, ${d.dose_ml} mL, next due ${fmtDate(String(d.next_due_at))}`;
    case "geofence_breach":
      return `Ping at ${Number(d.lat).toFixed(4)}, ${Number(d.lon).toFixed(4)}`;
    case "movement_recorded":
      return `${d.from} → ${d.to}, ${d.cvi}`;
    case "zone_created":
      return `${d.name} (${titleCase(String(d.zone_type))})`;
    case "zone_updated":
      return `${d.name} ${d.active === false ? "lifted" : "updated"}`;
    case "ranch_created":
      return String(d.name);
    default:
      return JSON.stringify(d);
  }
}
