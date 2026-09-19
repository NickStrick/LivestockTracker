"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTag, faXmark } from "@fortawesome/free-solid-svg-icons";
import { ID_TYPES, type IdType, type IdentifierOut } from "@/lib/types";
import { fmtDate } from "@/lib/format";
import { Badge, Card, CardHeader, Empty, btn } from "@/components/ui";

const INPUT = "h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

export function IdentifiersCard({ animalId, initial }: { animalId: string; initial: IdentifierOut[] }) {
  const [items, setItems] = useState(initial);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const value = String(f.get("value") ?? "").trim();
    const id_type = String(f.get("id_type")) as IdType;
    if (!value) return setError("Enter the identifier value");
    if (items.some((i) => i.value === value)) return setError("That identifier is already attached (409 in the real API)");
    // TODO(backend): POST /animals/{id}/identifiers
    setItems((xs) => [...xs, { id: `idn_new_${xs.length}`, animal_id: animalId, id_type, value, issued_by: String(f.get("issued_by") ?? "").trim() || null, issued_at: new Date().toISOString() }]);
    setError("");
    setOpen(false);
  }

  return (
    <Card>
      <CardHeader
        title="Identifiers"
        icon={faTag}
        action={
          <button onClick={() => setOpen((o) => !o)} className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-surface2 hover:text-fg" aria-label={open ? "Close form" : "Add identifier"}>
            <FontAwesomeIcon icon={open ? faXmark : faPlus} />
          </button>
        }
      />
      <AnimatePresence initial={false}>
        {open && (
          <motion.form onSubmit={onSubmit} noValidate initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-b border-line bg-surface2/50">
            <div className="grid gap-3 p-4 sm:p-5">
              <select name="id_type" className={INPUT} aria-label="Identifier type">
                {ID_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace("_", " ")}
                  </option>
                ))}
              </select>
              <input name="value" className={INPUT} placeholder="Value" aria-label="Identifier value" />
              <input name="issued_by" className={INPUT} placeholder="Issued by (optional)" aria-label="Issued by" />
              {error && <p className="text-xs text-danger">{error}</p>}
              <button className={btn.primary}>Attach identifier</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
      {items.length === 0 ? (
        <Empty>No identifiers attached.</Empty>
      ) : (
        <ul className="divide-y divide-line">
          {items.map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <p className="truncate font-mono text-sm">{i.value}</p>
                <p className="truncate text-xs text-muted">
                  {i.issued_by ?? "Unknown issuer"} · {fmtDate(i.issued_at)}
                </p>
              </div>
              <Badge tone="primary">{i.id_type.replace("_", " ")}</Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
