import { cache } from "react";
import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, pickLocale, type Locale } from "./config";
import { createI18n } from "./create";

/** Current request's locale: saved cookie, else the browser's Accept-Language. Cached per request. */
export const getLocale = cache(async (): Promise<Locale> => {
  const [c, h] = await Promise.all([cookies(), headers()]);
  return pickLocale(c.get(LOCALE_COOKIE)?.value, h.get("accept-language"));
});

/** For server components: `const { t, fmtDate } = await getI18n();` */
export async function getI18n() {
  return createI18n(await getLocale());
}

/** `export const generateMetadata = pageTitle("Animals");` -> translated <title> for a static page. */
export const pageTitle = (title: string) => async (): Promise<Metadata> => ({ title: (await getI18n()).t(title) });
