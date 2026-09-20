"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { useI18n } from "@/lib/i18n/client";

/**
 * A dialog that is a centered card on tablets/desktops and a bottom sheet on phones. Escape or a tap on
 * the backdrop closes it; the page behind it doesn't scroll while it is open.
 */
export function Modal({ open, onClose, title, icon, children }: { open: boolean; onClose: () => void; title: string; icon?: IconDefinition; children: React.ReactNode }) {
  const { t } = useI18n();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    panel.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6 print:hidden" role="presentation">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
          <motion.div
            ref={panel}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-line bg-surface shadow-2xl outline-none sm:rounded-3xl"
          >
            <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
              <h2 className="flex items-center gap-3 text-base font-semibold">
                {icon && (
                  <span className="grid size-9 place-items-center rounded-xl bg-primary/15 text-primary">
                    <FontAwesomeIcon icon={icon} />
                  </span>
                )}
                {title}
              </h2>
              <button onClick={onClose} aria-label={t("Close")} className="grid size-9 place-items-center rounded-lg text-muted transition hover:bg-surface2 hover:text-fg">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </header>
            <div className="overflow-y-auto overscroll-contain px-5 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
