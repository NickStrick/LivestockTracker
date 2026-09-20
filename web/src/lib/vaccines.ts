/**
 * Vaccines the ranch commonly gives, with how long a dose usually lasts. Used to suggest the next-due
 * date in the vaccination form and to generate the example data. Names are product names (not translated).
 */
export const VACCINE_CATALOG = [
  { name: "7-way Clostridial", interval_days: 365 },
  { name: "BVD/IBR/PI3/BRSV", interval_days: 365 },
  { name: "Blackleg", interval_days: 180 },
  { name: "Brucellosis (RB51)", interval_days: 3650 },
  { name: "Leptospirosis", interval_days: 365 },
] as const;

/** Days until the next dose for a known vaccine (case-insensitive), or null for anything else. */
export const vaccineInterval = (name: string): number | null =>
  VACCINE_CATALOG.find((v) => v.name.toLowerCase() === name.trim().toLowerCase())?.interval_days ?? null;
