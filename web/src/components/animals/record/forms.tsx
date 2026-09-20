"use client";

import { useState, useTransition } from "react";
import type { ZodType } from "zod";
import { useI18n } from "@/lib/i18n/client";
import { COST_BASIS_LABEL } from "@/lib/i18n/create";
import { animalLabel } from "@/lib/format";
import { COST_BASES, CURRENCIES } from "@/lib/types";
import { VACCINE_CATALOG, vaccineInterval } from "@/lib/vaccines";
import { estimateSchema, fieldErrors, lineageSchema, observationSchema, TODAY, vaccinationSchema, weightSchema } from "@/lib/recordSchemas";
import type { ParentOption } from "@/lib/api";
import { addCostEstimate, addObservation, addVaccination, addWeight, saveLineage, type ActionResult } from "@/app/(app)/animals/[id]/actions";
import { F, FormShell, INPUT, TEXTAREA } from "./parts";

interface FormProps {
  animalId: string;
  onDone: () => void;
  onCancel: () => void;
}
type Errors = Record<string, string>;

/**
 * Shared submit flow: check with the same zod schema the server uses (instant feedback), then call the
 * server action, which checks again. Field errors from either side land under the inputs.
 */
function useSubmit(schema: ZodType, action: (input: unknown) => Promise<ActionResult>, onDone: () => void) {
  const { t } = useI18n();
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent<HTMLFormElement>, values: unknown) => {
    e.preventDefault();
    const parsed = schema.safeParse(values);
    setError("");
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    start(async () => {
      const res = await action(parsed.data);
      if (res.ok) return onDone();
      if (res.fields) setErrors(res.fields);
      setError(res.error ? t(res.error) : res.fields ? "" : t("Something went wrong. Please try again."));
    });
  };
  return { errors, error, pending, submit };
}

const num = (s: string) => (s.trim() === "" ? undefined : Number(s));
const addDays = (date: string, days: number) => new Date(new Date(date + "T12:00:00Z").getTime() + days * 86_400_000).toISOString().slice(0, 10);

export function ObservationForm({ animalId, onDone, onCancel }: FormProps) {
  const { t } = useI18n();
  const [v, setV] = useState({ observed_at: TODAY, kind: "routine_check", severity: "low", notes: "" });
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV((p) => ({ ...p, [k]: e.target.value }));
  const { errors, error, pending, submit } = useSubmit(observationSchema, (i) => addObservation(animalId, i), onDone);

  return (
    <FormShell onSubmit={(e) => submit(e, v)} onCancel={onCancel} pending={pending} error={error}>
      <div className="grid gap-4 sm:grid-cols-2">
        <F label={t("Date")} error={errors.observed_at}>
          <input type="date" max={TODAY} value={v.observed_at} onChange={set("observed_at")} className={INPUT} />
        </F>
        <F label={t("Type")} error={errors.kind}>
          <select value={v.kind} onChange={set("kind")} className={INPUT}>
            <option value="routine_check">{t("Routine check")}</option>
            <option value="symptom">{t("Symptom")}</option>
          </select>
        </F>
      </div>
      <F label={t("Severity")} error={errors.severity}>
        <select value={v.severity} onChange={set("severity")} className={INPUT}>
          <option value="low">{t("Low")}</option>
          <option value="medium">{t("Medium")}</option>
          <option value="high">{t("High")}</option>
        </select>
      </F>
      <F label={t("What did you observe?")} error={errors.notes}>
        <textarea rows={4} value={v.notes} onChange={set("notes")} maxLength={600} className={TEXTAREA} placeholder={t("e.g. Limping on the left rear leg")} />
      </F>
    </FormShell>
  );
}

export function VaccinationForm({ animalId, onDone, onCancel }: FormProps) {
  const { t } = useI18n();
  const [v, setV] = useState({ vaccine: "", administered_at: TODAY, dose_ml: "2", administered_by: "", next_due_at: "" });
  // Suggest the next due date from the vaccine and date until the person picks their own.
  const [dueTouched, setDueTouched] = useState(false);
  const { errors, error, pending, submit } = useSubmit(vaccinationSchema, (i) => addVaccination(animalId, i), onDone);

  const suggest = (next: typeof v): typeof v => {
    const days = vaccineInterval(next.vaccine);
    return dueTouched || days === null || !/^\d{4}-\d{2}-\d{2}$/.test(next.administered_at) ? next : { ...next, next_due_at: addDays(next.administered_at, days) };
  };
  const set = (k: "vaccine" | "administered_at" | "dose_ml" | "administered_by") => (e: React.ChangeEvent<HTMLInputElement>) => setV((p) => suggest({ ...p, [k]: e.target.value }));

  return (
    <FormShell onSubmit={(e) => submit(e, { ...v, dose_ml: num(v.dose_ml), next_due_at: v.next_due_at })} onCancel={onCancel} pending={pending} error={error}>
      <F label={t("Vaccine")} error={errors.vaccine}>
        <input list="vaccine-catalog" value={v.vaccine} onChange={set("vaccine")} className={INPUT} placeholder={t("Choose or type a vaccine")} autoComplete="off" />
        <datalist id="vaccine-catalog">
          {VACCINE_CATALOG.map((c) => (
            <option key={c.name} value={c.name} />
          ))}
        </datalist>
      </F>
      <div className="grid gap-4 sm:grid-cols-2">
        <F label={t("Date given")} error={errors.administered_at}>
          <input type="date" max={TODAY} value={v.administered_at} onChange={set("administered_at")} className={INPUT} />
        </F>
        <F label={t("Dose (mL)")} error={errors.dose_ml}>
          <input type="number" inputMode="decimal" step="0.1" min="0" value={v.dose_ml} onChange={set("dose_ml")} className={INPUT} />
        </F>
      </div>
      <F label={t("Given by")} error={errors.administered_by}>
        <input value={v.administered_by} onChange={set("administered_by")} className={INPUT} placeholder={t("e.g. Dr. Ortiz")} />
      </F>
      <F label={t("Next due")} error={errors.next_due_at} hint={vaccineInterval(v.vaccine) !== null && !dueTouched ? t("Suggested from the usual schedule for this vaccine.") : undefined}>
        <input
          type="date"
          value={v.next_due_at}
          onChange={(e) => {
            setDueTouched(true);
            setV((p) => ({ ...p, next_due_at: e.target.value }));
          }}
          className={INPUT}
        />
      </F>
    </FormShell>
  );
}

export function WeightForm({ animalId, onDone, onCancel, lastWeight }: FormProps & { lastWeight: number | null }) {
  const { t, fmtNum } = useI18n();
  const [v, setV] = useState({ weighed_at: TODAY, weight_lb: "" });
  const { errors, error, pending, submit } = useSubmit(weightSchema, (i) => addWeight(animalId, i), onDone);

  return (
    <FormShell onSubmit={(e) => submit(e, { ...v, weight_lb: num(v.weight_lb) })} onCancel={onCancel} pending={pending} error={error}>
      <div className="grid gap-4 sm:grid-cols-2">
        <F label={t("Date")} error={errors.weighed_at}>
          <input type="date" max={TODAY} value={v.weighed_at} onChange={(e) => setV((p) => ({ ...p, weighed_at: e.target.value }))} className={INPUT} />
        </F>
        <F label={t("Weight (lb)")} error={errors.weight_lb} hint={lastWeight ? t("Last weigh-in: {w} lb", { w: fmtNum(lastWeight) }) : undefined}>
          <input type="number" inputMode="decimal" step="1" min="0" value={v.weight_lb} onChange={(e) => setV((p) => ({ ...p, weight_lb: e.target.value }))} className={INPUT} />
        </F>
      </div>
    </FormShell>
  );
}

export function EstimateForm({ animalId, onDone, onCancel }: FormProps) {
  const { t, locale } = useI18n();
  const [v, setV] = useState({ estimated_at: TODAY, amount: "", currency: locale === "es" ? "MXN" : "USD", basis: "market", notes: "" });
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV((p) => ({ ...p, [k]: e.target.value }));
  const { errors, error, pending, submit } = useSubmit(estimateSchema, (i) => addCostEstimate(animalId, i), onDone);

  return (
    <FormShell onSubmit={(e) => submit(e, { ...v, amount: num(v.amount), notes: v.notes.trim() || null })} onCancel={onCancel} pending={pending} error={error}>
      <div className="grid grid-cols-[1fr_6.5rem] gap-3">
        <F label={t("Estimated value")} error={errors.amount}>
          <input type="number" inputMode="decimal" step="any" min="0" value={v.amount} onChange={set("amount")} className={INPUT} />
        </F>
        <F label={t("Currency")} error={errors.currency}>
          <select value={v.currency} onChange={set("currency")} className={INPUT}>
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </F>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <F label={t("Based on")} error={errors.basis}>
          <select value={v.basis} onChange={set("basis")} className={INPUT}>
            {COST_BASES.map((b) => (
              <option key={b} value={b}>
                {t(COST_BASIS_LABEL[b])}
              </option>
            ))}
          </select>
        </F>
        <F label={t("Date")} error={errors.estimated_at}>
          <input type="date" max={TODAY} value={v.estimated_at} onChange={set("estimated_at")} className={INPUT} />
        </F>
      </div>
      <F label={t("Notes (optional)")} error={errors.notes}>
        <textarea rows={3} value={v.notes} onChange={set("notes")} maxLength={400} className={TEXTAREA} />
      </F>
    </FormShell>
  );
}

const optionLabel = (o: ParentOption) => `${animalLabel(o.tag_id, o.nickname)} · ${o.ranch_name}`;

export function LineageForm({
  animalId,
  onDone,
  onCancel,
  parents,
  current,
}: FormProps & { parents: { sires: ParentOption[]; dams: ParentOption[] }; current: { sire_id: string | null; dam_id: string | null } }) {
  const { t } = useI18n();
  const [v, setV] = useState({ sire_id: current.sire_id ?? "", dam_id: current.dam_id ?? "" });
  const { errors, error, pending, submit } = useSubmit(lineageSchema, (i) => saveLineage(animalId, i), onDone);
  const pick = (k: "sire_id" | "dam_id") => (e: React.ChangeEvent<HTMLSelectElement>) => setV((p) => ({ ...p, [k]: e.target.value }));

  return (
    <FormShell onSubmit={(e) => submit(e, { sire_id: v.sire_id || null, dam_id: v.dam_id || null })} onCancel={onCancel} pending={pending} error={error}>
      <F label={t("Sire (father)")} error={errors.sire_id}>
        <select value={v.sire_id} onChange={pick("sire_id")} className={INPUT}>
          <option value="">{t("Unknown")}</option>
          {parents.sires.map((o) => (
            <option key={o.id} value={o.id}>
              {optionLabel(o)}
            </option>
          ))}
        </select>
      </F>
      <F label={t("Dam (mother)")} error={errors.dam_id}>
        <select value={v.dam_id} onChange={pick("dam_id")} className={INPUT}>
          <option value="">{t("Unknown")}</option>
          {parents.dams.map((o) => (
            <option key={o.id} value={o.id}>
              {optionLabel(o)}
            </option>
          ))}
        </select>
      </F>
      <p className="text-xs text-muted">{t("Only bulls can be the sire, and only cows or heifers the dam. An animal's own offspring aren't listed.")}</p>
    </FormShell>
  );
}
