/**
 * Locale-independent constants. Everything that formats dates, numbers or words for a specific
 * language lives in lib/i18n/create.ts (use `useI18n()` / `await getI18n()`).
 * These labels are English keys: render them through t().
 */
export const DOC_TYPE_LABEL: Record<string, string> = {
  cvi: "CVI",
  brand_inspection: "Brand inspection",
  test_results: "Test results",
  registry_papers: "Registry papers",
  health_certificate: "Health certificate",
};
export const DOC_TYPE_FULL: Record<string, string> = {
  cvi: "Certificate of Veterinary Inspection",
  brand_inspection: "Brand inspection",
  test_results: "Test results",
  registry_papers: "Registry papers",
  health_certificate: "Health certificate",
};
