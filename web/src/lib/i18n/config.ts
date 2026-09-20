/** Locale settings shared by server, client and (later) React Native. No React or Next imports here. */
export const LOCALES = ["en", "es"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "locale";

/** BCP-47 tags handed to Intl for dates and numbers. */
export const INTL_LOCALE: Record<Locale, string> = { en: "en-US", es: "es-MX" };

export const LOCALE_NAME: Record<Locale, string> = { en: "English", es: "Español" };

export const isLocale = (v: unknown): v is Locale => v === "en" || v === "es";

/** Saved choice wins; otherwise follow the browser's Accept-Language (any Spanish variant -> es). */
export function pickLocale(cookie?: string | null, acceptLanguage?: string | null): Locale {
  if (isLocale(cookie)) return cookie;
  const first = acceptLanguage?.split(",")[0]?.trim().toLowerCase() ?? "";
  return first.startsWith("es") ? "es" : DEFAULT_LOCALE;
}
