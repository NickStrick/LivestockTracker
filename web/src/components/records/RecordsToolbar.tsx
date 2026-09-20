"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faPrint } from "@fortawesome/free-solid-svg-icons";
import { LOCALES, LOCALE_NAME, type Locale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";
import { Card } from "@/components/ui";
import { btn } from "@/components/ui-styles";
import { RECORD_SECTIONS } from "./sections";

/**
 * Screen-only controls above the printable sheet. Choices live in the URL (?lang=es&skip=weights)
 * so the server renders exactly what will print, and the link can be reopened later.
 */
export function RecordsToolbar({ lang, skip }: { lang: Locale; skip: string[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();

  const go = (next: { lang?: Locale; skip?: string[] }) => {
    const p = new URLSearchParams({ lang: next.lang ?? lang });
    const sk = next.skip ?? skip;
    if (sk.length) p.set("skip", sk.join(","));
    start(() => router.replace(`${pathname}?${p.toString()}`, { scroll: false }));
  };
  const toggle = (id: string) => go({ skip: skip.includes(id) ? skip.filter((s) => s !== id) : [...skip, id] });

  return (
    <Card className={clsx("mb-5 p-4 transition-opacity print:hidden sm:p-5", pending && "opacity-60")}>
      <div className="grid gap-5 lg:grid-cols-[auto_1fr_auto] lg:items-start">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">{t("Document language")}</p>
          <div className="inline-flex gap-1 rounded-xl border border-line bg-surface p-1" role="group" aria-label={t("Document language")}>
            {LOCALES.map((l) => (
              <button
                key={l}
                type="button"
                lang={l}
                aria-pressed={lang === l}
                onClick={() => go({ lang: l })}
                className={clsx("h-9 rounded-lg px-3.5 text-sm font-medium transition-colors", lang === l ? "bg-primary text-primary-fg" : "text-muted hover:text-fg")}
              >
                {LOCALE_NAME[l]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">{t("Include in the printout")}</p>
          <div className="flex flex-wrap gap-2">
            {RECORD_SECTIONS.map((s) => {
              const on = !skip.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(s.id)}
                  className={clsx(
                    "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors",
                    on ? "border-primary/50 bg-primary/10 text-primary" : "border-line bg-surface text-muted hover:text-fg",
                  )}
                >
                  <FontAwesomeIcon icon={faCheck} className={clsx("text-xs", !on && "opacity-0")} />
                  {t(s.label)}
                </button>
              );
            })}
          </div>
        </div>

        <button type="button" onClick={() => window.print()} className={clsx(btn.primary, "h-11 w-full px-5 lg:w-auto")}>
          <FontAwesomeIcon icon={faPrint} /> {t("Print / Save as PDF")}
        </button>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-muted">{t("To email it, choose “Save as PDF” in the print dialog and attach the file. Attach copies of the original certificates separately.")}</p>
    </Card>
  );
}
