/** Sections of the printable animal record, in print order. Labels are English keys (translate with t()). */
export const RECORD_SECTIONS = [
  { id: "vaccinations", label: "Vaccinations" },
  { id: "health", label: "Health observations" },
  { id: "breeding", label: "Breeding" },
  { id: "weights", label: "Weight history" },
  { id: "movements", label: "Movements" },
  { id: "documents", label: "Documents" },
] as const;

export type SectionId = (typeof RECORD_SECTIONS)[number]["id"];

export const isSectionId = (v: string): v is SectionId => RECORD_SECTIONS.some((s) => s.id === v);
