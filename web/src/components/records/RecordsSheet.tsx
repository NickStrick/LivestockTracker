import type { ReactNode } from "react";
import clsx from "clsx";
import type { AnimalOut, BreedingEvent, DocumentView, HealthObservation, IdentifierOut, MovementView, RanchOut, Vaccination, WeightRecord } from "@/lib/types";
import type { Locale } from "@/lib/i18n/config";
import { createI18n } from "@/lib/i18n/create";
import { DOC_TYPE_LABEL } from "@/lib/format";
import { MOCK_NOW } from "@/lib/clock";
import type { SectionId } from "./sections";
import { animalLabel } from "@/lib/format";

/**
 * The printable record. It is deliberately independent of the app's theme and language: it always
 * renders on white with dark text, in whichever language the seller picked, so what is on screen is
 * what comes out of the printer (or the saved PDF). No hooks: safe to render on the server.
 */
export interface RecordsSheetProps {
  locale: Locale;
  skip: SectionId[];
  animal: AnimalOut;
  ranch: RanchOut | null;
  sire: AnimalOut | null;
  dam: AnimalOut | null;
  identifiers: IdentifierOut[];
  vaccinations: Vaccination[]; // newest first
  observations: HealthObservation[];
  breeding: BreedingEvent[];
  weights: WeightRecord[]; // oldest first
  movements: MovementView[];
  documents: DocumentView[];
  tagOf: Record<string, string>;
}

const TH = "px-2 py-1.5 first:pl-0 last:pr-0 text-left text-[10px] font-semibold uppercase tracking-wide text-neutral-500";
const TD = "px-2 py-1.5 first:pl-0 last:pr-0 align-top text-[12px] leading-snug text-neutral-800";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-7">
      <h2 className="break-after-avoid border-b border-neutral-300 pb-1 text-[12px] font-semibold uppercase tracking-wider text-neutral-700">{title}</h2>
      {children}
    </section>
  );
}

function Table({ heads, rows, empty }: { heads: string[]; rows: ReactNode[][]; empty: string }) {
  if (rows.length === 0) return <p className="mt-2 text-[12px] text-neutral-500">{empty}</p>;
  return (
    <div className="mt-1 overflow-x-auto print:overflow-visible">
      <table className="w-full min-w-[32rem] border-collapse print:min-w-0">
        <thead>
          <tr className="border-b border-neutral-300">
            {heads.map((h) => (
              <th key={h} className={TH}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="break-inside-avoid border-b border-neutral-200">
              {r.map((c, j) => (
                // short text (dates, numbers, yes/no) stays on one line
                <td key={j} className={clsx(TD, typeof c === "string" && c.length <= 14 && "whitespace-nowrap")}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">{label}</dt>
      <dd className="mt-0.5 break-words text-[13px] text-neutral-900">{children || "-"}</dd>
    </div>
  );
}

export function RecordsSheet(p: RecordsSheetProps) {
  const { t, fmtDate, fmtNum, titleCase, ageLabel } = createI18n(p.locale);
  const { animal, ranch, skip } = p;
  const now = MOCK_NOW.getTime();
  const show = (id: SectionId) => !skip.includes(id);
  const yes = (b: boolean) => (b ? t("Yes") : t("No"));

  // Newest dose per vaccine decides what is current / past due.
  const latest = new Map<string, Vaccination>();
  for (const v of p.vaccinations) if (!latest.has(v.vaccine)) latest.set(v.vaccine, v);
  const nextDue = [...latest.values()].sort((a, b) => a.next_due_at.localeCompare(b.next_due_at))[0];
  const isPastDue = (v: Vaccination) => latest.get(v.vaccine)?.id === v.id && new Date(v.next_due_at).getTime() < now;
  const lastWeight = p.weights.at(-1);
  const docStatus = (d: DocumentView) => (d.status === "archived" ? t("Move completed") : d.status === "valid" ? (d.days_left === null ? t("No expiry") : t("Valid")) : d.status === "expiring" ? t("Expiring") : t("Expired"));

  return (
    <article
      lang={p.locale}
      className="mx-auto max-w-4xl rounded-2xl bg-white p-5 text-neutral-900 shadow-sm ring-1 ring-black/10 sm:p-10 print:max-w-none print:rounded-none print:p-0 print:shadow-none print:ring-0"
    >
      <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2 border-b-2 border-neutral-800 pb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Estancia</p>
          <h1 className="mt-1 text-xl font-semibold leading-tight sm:text-2xl">{t("Animal health and compliance record")}</h1>
        </div>
        <div className="text-[12px] text-neutral-600 sm:text-right">
          <p>{t("Prepared {date}", { date: fmtDate(MOCK_NOW.toISOString()) })}</p>
          {ranch && <p className="font-medium text-neutral-800">{ranch.name}</p>}
        </div>
      </header>

      <div className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <p className="font-mono text-3xl font-semibold tracking-tight">{animal.tag_id}</p>
        {animal.nickname && <p className="text-2xl font-semibold text-neutral-600">“{animal.nickname}”</p>}
        <p className="text-sm text-neutral-600">
          {titleCase(animal.status)}
          {animal.cause_of_death ? ` · ${t(animal.cause_of_death)}` : ""}
        </p>
      </div>

      <Section title={t("Identification")}>
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
          <Field label={t("Nickname")}>{animal.nickname}</Field>
          <Field label={t("Gender")}>{animal.gender ? titleCase(animal.gender) : null}</Field>
          <Field label={t("Color")}>{animal.color ? t(animal.color) : null}</Field>
          <Field label={t("Date of birth")}>{animal.dob ? `${fmtDate(animal.dob)} (${ageLabel(animal.dob)})` : null}</Field>
          <Field label={t("Registry number")}>{animal.registry_number}</Field>
          <Field label={t("Breed association")}>{animal.breed_association}</Field>
          <Field label={t("Ranch")}>{ranch?.name}</Field>
          <Field label={t("Sire")}>{p.sire ? animalLabel(p.sire.tag_id, p.sire.nickname) : null}</Field>
          <Field label={t("Dam")}>{p.dam ? animalLabel(p.dam.tag_id, p.dam.nickname) : null}</Field>
          <Field label={t("Identifiers")}>
            {p.identifiers.length > 0 && (
              <span className="block space-y-0.5">
                {p.identifiers.map((i) => (
                  <span key={i.id} className="block font-mono text-[12px]">
                    {titleCase(i.id_type)} {i.value}
                  </span>
                ))}
              </span>
            )}
          </Field>
        </dl>
      </Section>

      <Section title={t("At a glance")}>
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
          <Field label={t("Vaccinations on file")}>{p.vaccinations.length}</Field>
          <Field label={t("Next vaccine due")}>{nextDue ? `${nextDue.vaccine}, ${fmtDate(nextDue.next_due_at)}${new Date(nextDue.next_due_at).getTime() < now ? ` (${t("Past due")})` : ""}` : null}</Field>
          <Field label={t("Health observations")}>{p.observations.length}</Field>
          <Field label={t("Last weight")}>{lastWeight ? `${fmtNum(lastWeight.weight_lb)} lb, ${fmtDate(lastWeight.weighed_at)}` : null}</Field>
          <Field label={t("Movements on file")}>{p.movements.length}</Field>
          <Field label={t("Documents on file")}>{p.documents.length}</Field>
        </dl>
      </Section>

      {show("vaccinations") && (
        <Section title={t("Vaccinations")}>
          <Table
            empty={t("None on file.")}
            heads={[t("Vaccine"), t("Date given"), t("Dose"), t("Given by"), t("Next due")]}
            rows={p.vaccinations.map((v) => [
              v.vaccine,
              fmtDate(v.administered_at),
              `${v.dose_ml} mL`,
              v.administered_by,
              <span key="n">
                {fmtDate(v.next_due_at)}
                {isPastDue(v) && <strong className="ml-1 font-semibold text-red-700">({t("Past due")})</strong>}
              </span>,
            ])}
          />
        </Section>
      )}

      {show("health") && (
        <Section title={t("Health observations")}>
          <Table
            empty={t("None on file.")}
            heads={[t("Date"), t("Type"), t("Severity"), t("Notes")]}
            rows={p.observations.map((o) => [fmtDate(o.observed_at), o.kind === "symptom" ? t("Symptom") : t("Routine check"), titleCase(o.severity), o.notes])}
          />
        </Section>
      )}

      {show("breeding") && (
        <Section title={t("Breeding")}>
          <Table
            empty={t("None on file.")}
            heads={[t("Date"), t("Event"), t("Sire"), t("Notes")]}
            rows={p.breeding.map((b) => [fmtDate(b.occurred_at), titleCase(b.event), b.sire_id ? (p.tagOf[b.sire_id] ?? "") : "", b.notes ?? ""])}
          />
        </Section>
      )}

      {show("weights") && (
        <Section title={t("Weight history")}>
          <Table empty={t("None on file.")} heads={[t("Date"), t("Weight")]} rows={p.weights.map((w) => [fmtDate(w.weighed_at), `${fmtNum(w.weight_lb)} lb`])} />
        </Section>
      )}

      {show("movements") && (
        <Section title={t("Movements")}>
          <Table
            empty={t("None on file.")}
            heads={[t("Date"), t("Direction"), t("From"), t("To"), t("Purpose"), t("Type"), t("CVI")]}
            rows={p.movements.map((m) => [
              fmtDate(m.moved_at),
              m.direction === "out" ? t("Outbound") : t("Inbound"),
              m.origin,
              m.destination,
              titleCase(m.purpose),
              titleCase(m.kind),
              yes(p.documents.some((d) => d.movement_id === m.id && d.doc_type === "cvi")),
            ])}
          />
        </Section>
      )}

      {show("documents") && (
        <Section title={t("Documents")}>
          <Table
            empty={t("None on file.")}
            heads={[t("Title"), t("Type"), t("Issued"), t("Expires"), t("Issued by"), t("Status")]}
            rows={p.documents.map((d) => [d.title, t(DOC_TYPE_LABEL[d.doc_type]), fmtDate(d.issued_at), d.expires_at ? fmtDate(d.expires_at) : "-", d.issued_by, docStatus(d)])}
          />
          {p.documents.length > 0 && <p className="mt-2 text-[11px] text-neutral-500">{t("Copies of the documents listed are available from the seller.")}</p>}
        </Section>
      )}

      <footer className="mt-8 border-t border-neutral-300 pt-3 text-[10.5px] leading-relaxed text-neutral-500">
        {t("Generated by Estancia from the records on file as of {date}. It summarizes the ranch's records and does not replace official certificates or inspection documents.", { date: fmtDate(MOCK_NOW.toISOString()) })}
      </footer>
    </article>
  );
}
