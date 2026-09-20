/**
 * English -> Spanish (Mexico) dictionary. The English text is the key. Missing keys fall back to
 * English, so this can grow gradually. Placeholders use {name}. Split by area for easier editing.
 * To find keys still missing at runtime, build with NEXT_PUBLIC_I18N_DEBUG=1 and read the
 * "[i18n-missing]" warnings.
 */
import { ES_PAGES } from "./es/pages";
import { ES_SYSTEM } from "./es/system";
import { ES_UI } from "./es/ui";

export const ES: Record<string, string> = { ...ES_UI, ...ES_PAGES, ...ES_SYSTEM };
