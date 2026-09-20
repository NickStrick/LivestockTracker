import { INTL_LOCALE, type Locale } from "./config";
import { ES } from "./es";
import { MOCK_NOW } from "../clock";

/**
 * Translation and formatting for one locale.
 *
 * Keys are the English text itself, so components read naturally: t("Add animal").
 *  - Anything missing from the dictionary falls back to the English key (never blank, never a crash).
 *  - Placeholders use {name} and are filled from `vars`: t("Showing {a} of {b}", { a, b }).
 *  - System-generated strings that were interpolated in English before reaching the UI
 *    (alert titles like "BVD overdue") are still translated: dictionary entries containing
 *    placeholders double as patterns, and captured values keep their original text.
 *  - User-authored data (ranch names, notes) is never in the dictionary, so it is shown as entered.
 */
export type Vars = Record<string, string | number>;
export type T = (key: string, vars?: Vars) => string;

const DAY = 86_400_000;
const NOW = MOCK_NOW.getTime();

const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_ES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DATE_RE = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})(?:,\s*(\d{4}))?/g;

/** "Sep 8" -> "8 sep", "Sep 8, 2026" -> "8 sep 2026". For dates already formatted in English by the API layer. */
const localizeDates = (s: string) => s.replace(DATE_RE, (_, m: string, d: string, y?: string) => `${d} ${MONTHS_ES[MONTHS_EN.indexOf(m)]}${y ? ` ${y}` : ""}`);

const fill = (tpl: string, vars?: Vars) => (vars ? tpl.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : tpl);
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Dictionary entries with {placeholders}, compiled once, most specific (longest literal text) first.
// Templates with almost no literal text ("{n}m", "in {v}") are excluded: as patterns they would
// match unrelated strings. They still work when called directly, e.g. t("{n}m", { n }).
const PATTERNS = Object.entries(ES)
  .filter(([k]) => {
    const literal = k.replace(/\{\w+\}/g, "");
    return /\{\w+\}/.test(k) && literal.length >= 4 && /[A-Za-z]{3}/.test(literal);
  })
  .map(([k, out]) => {
    const names: string[] = [];
    const src = k
      .split(/(\{\w+\})/)
      .map((part) => {
        const m = part.match(/^\{(\w+)\}$/);
        if (m) {
          names.push(m[1]);
          return "(.+?)";
        }
        return escapeRe(part);
      })
      .join("");
    return { re: new RegExp(`^${src}$`), names, out, weight: k.replace(/\{\w+\}/g, "").length };
  })
  .sort((a, b) => b.weight - a.weight);

const DEBUG = process.env.NEXT_PUBLIC_I18N_DEBUG === "1";
const reported = new Set<string>();

function lookupEs(key: string): string | undefined {
  const exact = ES[key];
  if (exact !== undefined) return exact;
  for (const p of PATTERNS) {
    const m = key.match(p.re);
    if (m) return fill(p.out, Object.fromEntries(p.names.map((n, i) => [n, localizeDates(m[i + 1])])));
  }
  if (DEBUG && /[A-Za-z]{2}/.test(key) && !reported.has(key)) {
    reported.add(key);
    console.warn(`[i18n-missing] ${key}`);
  }
  return undefined;
}

/** English keys for the cost-estimate basis options (translate with t()). */
export const COST_BASIS_LABEL: Record<string, string> = { market: "Market price", appraisal: "Appraisal", purchase: "Purchase price", other: "Other" };

export function createI18n(locale: Locale) {
  const intl = INTL_LOCALE[locale];

  const t: T = (key, vars) => {
    if (!key) return "";
    const tpl = locale === "es" ? (lookupEs(key) ?? key) : key;
    return fill(tpl, vars);
  };

  const baseTitleCase = (s: string) => s.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  /** "dangerous_terrain" -> "Dangerous Terrain" -> translated. */
  const titleCase = (s: string) => t(baseTitleCase(s));

  const asDate = (s: string) => new Date(s.length === 10 ? s + "T12:00:00Z" : s);
  const fmtDate = (s: string | null | undefined) => (s ? asDate(s).toLocaleDateString(intl, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : "-");
  const fmtShortDate = (s: string) => asDate(s).toLocaleDateString(intl, { month: "short", day: "numeric", timeZone: "UTC" });
  const fmtMonth = (s: string) => asDate(s).toLocaleDateString(intl, { month: "short", timeZone: "UTC" });
  const fmtDateTime = (s: string) => new Date(s).toLocaleString(intl, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC" });
  const fmtNum = (n: number) => n.toLocaleString(intl);
  const fmtMoney = (amount: number, currency: string) => amount.toLocaleString(intl, { style: "currency", currency, maximumFractionDigits: amount % 1 ? 2 : 0 });
  const fmtSize = (kb: number) => (kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`);

  /** Relative to the mock "now" so server and client agree. Swap for Date.now() with real data. */
  const timeAgo = (s: string): string => {
    const diff = NOW - new Date(s).getTime();
    const abs = Math.abs(diff);
    const wrap = (v: string) => t(diff < 0 ? "in {v}" : "{v} ago", { v });
    if (abs < 3_600_000) return wrap(t("{n}m", { n: Math.max(1, Math.round(abs / 60_000)) }));
    if (abs < DAY) return wrap(t("{n}h", { n: Math.round(abs / 3_600_000) }));
    if (abs < 30 * DAY) return wrap(t("{n}d", { n: Math.round(abs / DAY) }));
    if (abs < 365 * DAY) {
      const n = Math.round(abs / (30.4 * DAY));
      return wrap(n === 1 ? t("1mo") : t("{n}mo", { n }));
    }
    return wrap(t("{n}y", { n: (abs / (365 * DAY)).toFixed(1) }));
  };

  const ageLabel = (dob: string | null): string => {
    if (!dob) return "-";
    const months = Math.floor((NOW - new Date(dob).getTime()) / (30.4 * DAY));
    if (months < 1) return t("<1 mo");
    if (months < 24) return months === 1 ? t("1 mo") : t("{n} mo", { n: months });
    return t("{n} yr", { n: (months / 12).toFixed(1) });
  };

  const PEOPLE: Record<string, string> = { "usr_maria.gomez": "Maria Gomez", "usr_dr.ortiz": "Dr. Ortiz", "usr_j.bartlett": "J. Bartlett" };
  /** Placeholder until user records exist. People are data (never translated); only system actors are. */
  const actorName = (id: string | null) => (!id ? t("System") : id === "system:gps-service" ? t("GPS service") : (PEOPLE[id] ?? id));

  const EVENT_LABELS: Record<string, string> = {
    animal_created: "Animal registered",
    animal_updated: "Animal updated",
    identifier_added: "Identifier attached",
    ranch_created: "Ranch onboarded",
    zone_created: "Zone created",
    zone_updated: "Zone updated",
    vaccination_recorded: "Vaccination recorded",
    geofence_breach: "Geofence breach",
    movement_recorded: "Movement recorded",
    document_uploaded: "Document uploaded",
    health_recorded: "Health observation recorded",
    weight_recorded: "Weight recorded",
    estimate_recorded: "Cost estimate recorded",
    lineage_updated: "Lineage updated",
  };
  const eventLabel = (type: string) => t(EVENT_LABELS[type] ?? baseTitleCase(type));

  /** One-line human summary of an audit event's payload. */
  const eventSummary = (type: string, d: Record<string, unknown> | null): string => {
    if (!d) return "";
    const lower = (s: string) => titleCase(s).toLowerCase();
    switch (type) {
      case "animal_created":
        return d.gender ? t("Tag {tag} ({gender})", { tag: String(d.tag_id), gender: lower(String(d.gender)) }) : t("Tag {tag}", { tag: String(d.tag_id) });
      case "animal_updated":
        return t("Status → {status}", { status: lower(String(d.status)) }) + (d.cause_of_death ? ` (${t(String(d.cause_of_death))})` : "");
      case "identifier_added":
        return `${titleCase(String(d.id_type))} ${d.value}`;
      case "vaccination_recorded":
        return t("{vaccine}, {dose} mL, next due {date}", { vaccine: String(d.vaccine), dose: String(d.dose_ml), date: fmtDate(String(d.next_due_at)) });
      case "geofence_breach":
        return t("Ping at {lat}, {lon}", { lat: Number(d.lat).toFixed(4), lon: Number(d.lon).toFixed(4) });
      case "movement_recorded": {
        const lead = t(d.direction === "in" ? "Arrived from {place}" : "Left for {place}", { place: String(d.place) });
        const bits = [lower(String(d.purpose)), lower(String(d.kind)), ...(d.cvi ? [t("CVI on file")] : [])];
        return `${lead} (${bits.join(", ")})`;
      }
      case "document_uploaded":
        return String(d.title);
      case "health_recorded":
        return `${t(d.kind === "symptom" ? "Symptom" : "Routine check")} (${titleCase(String(d.severity)).toLowerCase()}): ${d.notes}`;
      case "weight_recorded":
        return `${fmtNum(Number(d.weight_lb))} lb`;
      case "estimate_recorded":
        return `${fmtMoney(Number(d.amount), String(d.currency))} (${t(COST_BASIS_LABEL[String(d.basis)] ?? "Other")})`;
      case "lineage_updated":
        return t("Sire {sire}, dam {dam}", { sire: String(d.sire ?? "-"), dam: String(d.dam ?? "-") });
      case "zone_created":
        return `${d.name} (${titleCase(String(d.zone_type))})`;
      case "zone_updated":
        return t(d.active === false ? "{name} lifted" : "{name} updated", { name: String(d.name) });
      case "ranch_created":
        return String(d.name);
      default:
        return JSON.stringify(d);
    }
  };

  return { locale, intl, t, titleCase, fmtDate, fmtShortDate, fmtMonth, fmtDateTime, fmtNum, fmtMoney, fmtSize, timeAgo, ageLabel, actorName, eventLabel, eventSummary };
}

export type I18n = ReturnType<typeof createI18n>;
