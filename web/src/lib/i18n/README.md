# Internationalization (English / Spanish-Mexico)

No routes or URLs change. The language lives in a `locale` cookie; on the first visit it follows the
browser's `Accept-Language` (any Spanish -> `es`). The EN | ES switch in the top bar sets the cookie and
refreshes the page in place. The button shows the *other* language by its own name ("Español" / "English") so speakers can find it without reading the current language.

## Using it

```tsx
// client component
const { t, fmtDate, timeAgo, titleCase } = useI18n();
// server component / page
const { t, fmtDate } = await getI18n();

t("Add animal");                                  // English text is the key
t("Showing {a} of {b}", { a: 20, b: 47 });        // {placeholders}
titleCase("dangerous_terrain");                   // "Dangerous Terrain" -> translated
export const generateMetadata = pageTitle("Animals");   // translated <title>
```

- The English source text **is** the key, so code reads normally and missing entries fall back to English.
- Translate at the place text is rendered. Constants (nav labels, table headers, release notes) stay English
  in code and go through `t()` where they are displayed.
- Dates, numbers and relative times come from the same object (`fmtDate`, `fmtNum`, `timeAgo`, ...), so they follow the language.
- **User data is never translated** (ranch names, notes, document titles). Only text the app generates is.
- Dictionary entries containing `{placeholders}` also act as patterns for strings interpolated in English
  before reaching the UI (alert titles built in `lib/api.ts`). Keep those entries specific.

## Adding or fixing a translation

Edit `es/ui.ts` (shared UI), `es/pages.ts` (page copy) or `es/system.ts` (alerts, events, enums, release notes).

To find strings that are still missing, build with the debug flag and browse the app in Spanish; each
missing key is logged once as `[i18n-missing] ...` (browser console and server log):

```
NEXT_PUBLIC_I18N_DEBUG=1 npm run build && npm start
```

## Adding a language

1. Add it to `LOCALES`, `INTL_LOCALE` and `LOCALE_NAME` in `config.ts`.
2. Create its dictionary and load it in `create.ts` (mirror how `ES` is used).
3. `components/shell/LanguageToggle.tsx` is a single button that flips between two languages, showing the other one by its own name. With three or more languages, turn it into a small menu.

## Not covered yet

Units are still imperial (lb, acres). Mexico normally uses kg and hectares, which needs a separate units setting.

## Developer link

The sidebar shows a small "Developers" link to `/developers` (English-only page for backend developers). Set `NEXT_PUBLIC_SHOW_DEV_LINK=0` at build time to hide it.
