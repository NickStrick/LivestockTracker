"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faChevronDown, faDna, faHeartPulse, faPlus, faSackDollar, faSyringe, faWeightScale } from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { Modal } from "@/components/Modal";
import { btn } from "@/components/ui-styles";
import { useI18n } from "@/lib/i18n/client";
import type { ParentOption } from "@/lib/api";
import { EstimateForm, LineageForm, ObservationForm, VaccinationForm, WeightForm } from "./forms";

type Kind = "observation" | "vaccination" | "weight" | "estimate" | "lineage";

const ITEMS: { kind: Kind; icon: IconDefinition; menu: string; title: string; done: string }[] = [
  { kind: "observation", icon: faHeartPulse, menu: "Health observation", title: "Record a health observation", done: "Health observation saved" },
  { kind: "vaccination", icon: faSyringe, menu: "Vaccination", title: "Record a vaccination", done: "Vaccination saved" },
  { kind: "weight", icon: faWeightScale, menu: "Weight check", title: "Record a weight check", done: "Weight saved" },
  { kind: "estimate", icon: faSackDollar, menu: "Cost estimate", title: "Add a cost estimate", done: "Cost estimate saved" },
  { kind: "lineage", icon: faDna, menu: "Update lineage", title: "Update lineage", done: "Lineage updated" },
];

/**
 * "Record" dropdown for the animal page: pick what to record, fill a short form in a dialog, and the
 * page updates in place (the server action revalidates it).
 */
export function RecordMenu({
  animalId,
  lastWeight,
  parents,
  current,
}: {
  animalId: string;
  lastWeight: number | null;
  parents: { sires: ParentOption[]; dams: ParentOption[] };
  current: { sire_id: string | null; dam_id: string | null };
}) {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const [kind, setKind] = useState<Kind>("observation");
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0); // a fresh form (empty fields, no errors) each time it opens
  const [toast, setToast] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const away = (e: PointerEvent) => root.current && !root.current.contains(e.target as Node) && setMenuOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  const item = ITEMS.find((i) => i.kind === kind)!;
  const close = useCallback(() => setOpen(false), []);
  const done = () => {
    setOpen(false);
    setToast(item.done);
  };
  const start = (k: Kind) => {
    setMenuOpen(false);
    setKind(k);
    setSession((n) => n + 1);
    setOpen(true);
  };
  const common = { animalId, onDone: done, onCancel: close };

  return (
    <>
      {/* First in the wrapped action row on phones so the menu opens from the left edge; in its natural place from tablet up. */}
      <div ref={root} className="relative order-first sm:order-none">
        <button type="button" className={btn.primary} aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>
          <FontAwesomeIcon icon={faPlus} /> {t("Record")} <FontAwesomeIcon icon={faChevronDown} className={menuOpen ? "rotate-180 transition" : "transition"} size="xs" />
        </button>
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              role="menu"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.14 }}
              className="absolute left-0 top-full z-40 mt-2 w-60 overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-xl sm:left-auto sm:right-0"
            >
              {ITEMS.map((i) => (
                <button key={i.kind} role="menuitem" type="button" onClick={() => start(i.kind)} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm transition hover:bg-surface2">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <FontAwesomeIcon icon={i.icon} />
                  </span>
                  {t(i.menu)}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Modal open={open} onClose={close} title={t(item.title)} icon={item.icon}>
        <div key={session}>
          {kind === "observation" && <ObservationForm {...common} />}
          {kind === "vaccination" && <VaccinationForm {...common} />}
          {kind === "weight" && <WeightForm {...common} lastWeight={lastWeight} />}
          {kind === "estimate" && <EstimateForm {...common} />}
          {kind === "lineage" && <LineageForm {...common} parents={parents} current={current} />}
        </div>
      </Modal>

      <AnimatePresence>
        {toast && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-x-4 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-70 mx-auto flex w-fit max-w-full items-center gap-2 rounded-xl bg-fg px-4 py-3 text-sm font-medium text-canvas shadow-xl print:hidden"
          >
            <FontAwesomeIcon icon={faCheck} className="text-ok" /> {t(toast)}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
