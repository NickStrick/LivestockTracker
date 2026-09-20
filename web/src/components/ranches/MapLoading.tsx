"use client";

import { useI18n } from "@/lib/i18n/client";

/** Shown while the Leaflet bundle loads. A component (not inline JSX) so it can read the locale. */
export function MapLoading() {
  const { t } = useI18n();
  return <div className="grid h-full place-items-center bg-surface2 text-sm text-muted">{t("Loading map…")}</div>;
}
