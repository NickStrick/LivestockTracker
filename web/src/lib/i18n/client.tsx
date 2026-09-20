"use client";

import { createContext, useContext, useMemo } from "react";
import { LOCALE_COOKIE, type Locale } from "./config";
import { createI18n, type I18n } from "./create";

const Ctx = createContext<I18n | null>(null);

/** Mounted once in the root layout with the server-resolved locale. */
export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const value = useMemo(() => createI18n(locale), [locale]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Remember the choice for a year; the server reads this cookie on the next request. */
export function saveLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

/** For client components: `const { t, fmtDate } = useI18n();` */
export function useI18n(): I18n {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n must be used inside <I18nProvider>");
  return v;
}
