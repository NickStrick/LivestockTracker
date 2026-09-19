"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { titleCase } from "@/lib/format";
import { MOVEMENT_PURPOSES, type AnimalOut, type MovementCreate } from "@/lib/types";
import { Card, btn } from "@/components/ui";
import { RequestPreview } from "@/components/RequestPreview";
import { AnimalPicker } from "./AnimalPicker";

const INPUT = "h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

const schema = z.object({
  ranch_id: z.string().min(1, "Choose a ranch"),
  animal_ids: z.array(z.string()).min(1, "Select at least one animal"),
  kind: z.enum(["interstate", "intrastate"]),
  direction: z.enum(["in", "out"]),
  purpose: z.enum(MOVEMENT_PURPOSES),
  origin: z.string().trim().min(1, "Where is it leaving from?"),
  destination: z.string().trim().min(1, "Where is it going?"),
  moved_at: z.string().min(1, "Pick the movement date"),
  carrier: z.string().nullable(),
  notes: z.string().nullable(),
});

function Row({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
    </label>
  );
}

export function MovementForm({ ranches, animals }: { ranches: { id: string; name: string }[]; animals: AnimalOut[] }) {
  const [ranch, setRanch] = useState(ranches[0]?.id ?? "");
  const [ids, setIds] = useState<string[]>([]);
  const [kind, setKind] = useState<"interstate" | "intrastate">("intrastate");
  const [direction, setDirection] = useState<"in" | "out">("out");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<MovementCreate | null>(null);
  const available = useMemo(() => animals.filter((a) => a.ranch_id === ranch), [animals, ranch]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "");
    const result = schema.safeParse({
      ranch_id: ranch,
      animal_ids: ids,
      kind,
      direction,
      purpose: get("purpose"),
      origin: get("origin"),
      destination: get("destination"),
      moved_at: get("moved_at"),
      carrier: get("carrier").trim() || null,
      notes: get("notes").trim() || null,
    });
    if (!result.success) {
      const next: Record<string, string> = {};
      for (const i of result.error.issues) next[String(i.path[0])] ??= i.message;
      setErrors(next);
      setSaved(null);
      return;
    }
    setErrors({});
    // TODO(backend): fetch(POST /movements)
    setSaved(result.data);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 lg:grid-cols-[1fr_22rem] lg:items-start">
      <Card className="space-y-5 p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Row label="Ranch *" error={errors.ranch_id}>
            <select
              value={ranch}
              onChange={(e) => {
                setRanch(e.target.value);
                setIds([]);
              }}
              className={INPUT}
            >
              {ranches.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </Row>
          <Row label="Direction *">
            <select value={direction} onChange={(e) => setDirection(e.target.value as "in" | "out")} className={INPUT}>
              <option value="out">Outbound (leaving the ranch)</option>
              <option value="in">Inbound (arriving)</option>
            </select>
          </Row>
          <Row label="Type *">
            <select value={kind} onChange={(e) => setKind(e.target.value as "interstate" | "intrastate")} className={INPUT}>
              <option value="intrastate">Intrastate (within the state)</option>
              <option value="interstate">Interstate (crosses state lines)</option>
            </select>
          </Row>
          <Row label="Purpose *">
            <select name="purpose" className={INPUT} defaultValue="sale">
              {MOVEMENT_PURPOSES.map((p) => (
                <option key={p} value={p}>
                  {titleCase(p)}
                </option>
              ))}
            </select>
          </Row>
          <Row label="From *" error={errors.origin}>
            <input name="origin" className={INPUT} placeholder={direction === "out" ? "Rio Seco Ranch, TX" : "Seller or origin"} />
          </Row>
          <Row label="To *" error={errors.destination}>
            <input name="destination" className={INPUT} placeholder={direction === "out" ? "Sale barn or destination" : "Ranch name"} />
          </Row>
          <Row label="Movement date *" error={errors.moved_at}>
            <input name="moved_at" type="date" className={INPUT} />
          </Row>
          <Row label="Carrier">
            <input name="carrier" className={INPUT} placeholder="Hauler or owner" />
          </Row>
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium">Animals *</span>
          <AnimalPicker animals={available} selected={ids} onChange={setIds} error={errors.animal_ids} />
        </div>

        <Row label="Notes">
          <textarea name="notes" rows={2} className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
        </Row>

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <Link href="/compliance" className={btn.ghost}>
            Cancel
          </Link>
          <button type="submit" className={btn.primary}>
            Record movement
          </button>
        </div>
      </Card>

      <div className="space-y-4 lg:sticky lg:top-24">
        {kind === "interstate" && (
          <Card className="border-info/40 bg-info/5 p-4 text-xs sm:p-5">
            <p className="font-medium text-info">Interstate movement</p>
            <p className="mt-1 text-muted">A Certificate of Veterinary Inspection is normally required. After saving, attach it from the movement page. Movements without one are flagged.</p>
          </Card>
        )}
        {saved ? (
          <RequestPreview method="POST" path="/movements" body={saved} doneHref="/compliance" doneLabel="Back to compliance" />
        ) : (
          <Card className="p-4 text-xs text-muted sm:p-5">
            <p className="font-medium text-fg">POST /movements</p>
            <p className="mt-1">One movement can carry several animals. Provisional schema until the compliance-service contract exists.</p>
          </Card>
        )}
      </div>
    </form>
  );
}
