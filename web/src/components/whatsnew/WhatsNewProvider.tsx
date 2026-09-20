"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWandMagicSparkles, faXmark } from "@fortawesome/free-solid-svg-icons";
import { LATEST_RELEASE, RELEASES, type ReleaseItemType } from "@/lib/releases";

import { useLocalSet } from "@/lib/useLocalSet";
import { useI18n } from "@/lib/i18n/client";

interface WhatsNewValue {
  open: () => void;
  /** True once we know (client-side) that the newest release hasn't been opened yet. */
  hasUnseen: boolean;
}

const Ctx = createContext<WhatsNewValue | null>(null);

const TYPE_STYLE: Record<ReleaseItemType, { label: string; cls: string }> = {
  new: { label: "New", cls: "bg-primary/15 text-primary" },
  improved: { label: "Improved", cls: "bg-info/15 text-info" },
  fixed: { label: "Fixed", cls: "bg-warn/15 text-warn" },
};

export function WhatsNewProvider({ children }: { children: React.ReactNode }) {
  const { t, fmtDate } = useI18n();
  const seen = useLocalSet("estancia:seen-releases");
  const [isOpen, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);

  const open = useCallback(() => {
    setOpen(true);
    seen.add(LATEST_RELEASE.version);
  }, [seen]);
  const close = useCallback(() => setOpen(false), []);

  // Escape to close, lock page scroll and move focus into the dialog while open.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    panel.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = prev;
    };
  }, [isOpen, close]);

  const hasUnseen = seen.ready && !seen.has(LATEST_RELEASE.version);
  const value = useMemo(() => ({ open, hasUnseen }), [open, hasUnseen]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6" role="presentation">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={close} />
            <motion.div
              ref={panel}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-labelledby="whatsnew-title"
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-line bg-surface shadow-2xl outline-none sm:rounded-3xl"
            >
              <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary">
                    <FontAwesomeIcon icon={faWandMagicSparkles} />
                  </span>
                  <div>
                    <h2 id="whatsnew-title" className="text-base font-semibold leading-tight">{t("What's new")}
                    </h2>
                    <p className="text-xs text-muted">{t("Version {version}", { version: LATEST_RELEASE.version })}</p>
                  </div>
                </div>
                <button onClick={close} aria-label={t("Close")} className="grid size-9 place-items-center rounded-lg text-muted transition hover:bg-surface2 hover:text-fg">
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </header>

              <div className="space-y-7 overflow-y-auto overscroll-contain px-5 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                {RELEASES.map((r, i) => (
                  <section key={r.version}>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold">{t(r.title)}</h3>
                      {i === 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-fg">{t("Latest")}</span>}
                    </div>
                    <p className="mt-0.5 text-xs text-muted">
                      v{r.version} · {fmtDate(r.date)}
                    </p>
                    <p className="mt-2 text-sm text-muted">{t(r.summary)}</p>
                    <ul className="mt-3 space-y-2">
                      {r.items.map((it) => (
                        <li key={it.text} className="flex items-start gap-2.5 text-sm">
                          <span className={clsx("mt-0.5 w-[4.5rem] shrink-0 rounded-md py-0.5 text-center text-[10px] font-semibold uppercase tracking-wide", TYPE_STYLE[it.type].cls)}>{t(TYPE_STYLE[it.type].label)}</span>
                          <span>{t(it.text)}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  );
}

export function useWhatsNew() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useWhatsNew must be used inside <WhatsNewProvider>");
  return v;
}
