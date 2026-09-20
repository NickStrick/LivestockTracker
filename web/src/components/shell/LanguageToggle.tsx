"use client";

import { useRouter } from "next/navigation";
import clsx from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGlobe } from "@fortawesome/free-solid-svg-icons";
import { LOCALES, LOCALE_NAME } from "@/lib/i18n/config";
import { saveLocale, useI18n } from "@/lib/i18n/client";

/**
 * One button that offers the OTHER language by its own name ("Español" while the site is in English,
 * "English" while it is in Spanish), so a Spanish reader can spot it without reading any English.
 * The choice is saved in a cookie and the current page refreshes in place (no URL change).
 * Below ~360px the name shortens to the language code to leave room in the header.
 */
export function LanguageToggle({ className }: { className?: string }) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const other = LOCALES.find((l) => l !== locale) ?? locale;

  const choose = () => {
    saveLocale(other);
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={choose}
      aria-label={t("Switch language to {language}", { language: LOCALE_NAME[other] })}
      title={LOCALE_NAME[other]}
      className={clsx(
        "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-3 text-sm font-semibold text-primary transition hover:bg-primary/15 active:scale-95",
        className,
      )}
    >
      <FontAwesomeIcon icon={faGlobe} />
      <span lang={other} className="uppercase min-[360px]:hidden">
        {other}
      </span>
      <span lang={other} className="hidden min-[360px]:inline">
        {LOCALE_NAME[other]}
      </span>
    </button>
  );
}
