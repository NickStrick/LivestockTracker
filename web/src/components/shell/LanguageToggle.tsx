"use client";

import { useRouter } from "next/navigation";
import clsx from "clsx";
import { LOCALES, LOCALE_NAME, type Locale } from "@/lib/i18n/config";
import { saveLocale, useI18n } from "@/lib/i18n/client";

/**
 * EN | ES switch. Saves the choice in a cookie (so the server renders the right language on the
 * next request, with no URL changes) and refreshes the current page in place.
 */
export function LanguageToggle({ className }: { className?: string }) {
  const { locale, t } = useI18n();
  const router = useRouter();

  const choose = (next: Locale) => {
    if (next === locale) return;
    saveLocale(next);
    router.refresh();
  };

  return (
    <div role="group" aria-label={t("Language")} className={clsx("inline-flex h-10 items-center rounded-xl border border-line bg-surface p-0.5 text-xs font-semibold", className)}>
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => choose(l)}
          aria-pressed={locale === l}
          lang={l}
          title={LOCALE_NAME[l]}
          className={clsx("h-full min-w-9 rounded-[10px] px-2 uppercase transition-colors", locale === l ? "bg-primary text-primary-fg" : "text-muted hover:text-fg")}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
