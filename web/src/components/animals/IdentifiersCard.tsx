"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTag, faXmark } from "@fortawesome/free-solid-svg-icons";
import { ID_TYPES, type IdType, type IdentifierOut } from "@/lib/types";

import { Badge, Card, CardHeader, Empty } from "@/components/ui";
import { btn } from "@/components/ui-styles";
import { useI18n } from "@/lib/i18n/client";

const INPUT = "h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

export function IdentifiersCard({ animalId, initial }: { animalId: string; initial: IdentifierOut[] }) {
  const { t, fmtDate, titleCase } = useI18n();
  const [items, setItems] = useState(initial);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const value = String(f.get("value") ?? "").trim();
    const id_type = String(f.get("id_type")) as IdType;
    if (!value) return setError(t("Enter the identifier value"));
    if (items.some((i) => i.value === value)) return setError(t("That identifier is already attached (409 in the real API)"));
    // TODO(backend): POST /animals/{id}/identifiers
    setItems((xs) => [...xs, { id: `idn_new_${xs.length}`, animal_id: animalId, id_type, value, issued_by: String(f.get("issued_by") ?? "").trim() || null, issued_at: new Date().toISOString() }]);
    setError("");
    setOpen(false);
  }

  return (
    <Card>
      <CardHeader
        title={t("Identifiers")}
        icon={faTag}
        action={
          <button onClick={() => setOpen((o) => !o)} className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-surface2 hover:text-fg" aria-label={open ? t("Close form") : t("Add identifier")}>
            <FontAwesomeIcon icon={open ? faXmark : faPlus} />
          </button>
        }
      />
      <AnimatePresence initial={false}>
        {open && (
          <motion.form onSubmit={onSubmit} noValidate initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-b border-line bg-surface2/50">
            <div className="grid gap-3 p-4 sm:p-5">
              <select name="id_type" className={INPUT} aria-label={t("Identifier type")}>
                {ID_TYPES.map((tk) => (
                  <option key={tk} value={tk}>
                    {titleCase(tk)}
                  </option>
                ))}
              </select>
              <input name="value" className={INPUT} placeholder={t("Value")} aria-label={t("Identifier value")} />
              <input name="issued_by" className={INPUT} placeholder={t("Issued by (optional)")} aria-label={t("Issued by")} />
              {error && <p className="text-xs text-danger">{error}</p>}
              <button className={btn.primary}>{t("Attach identifier")}</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
      {items.length === 0 ? (
        <Empty>{t("No identifiers attached.")}</Empty>
      ) : (
        <ul className="divide-y divide-line">
          {items.map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <p className="truncate font-mono text-sm">{i.value}</p>
                <p className="truncate text-xs text-muted">
                  {i.issued_by ?? t("Unknown issuer")} · {fmtDate(i.issued_at)}
                </p>
              </div>
              <Badge tone="primary">{titleCase(i.id_type)}</Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
