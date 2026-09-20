import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClipboardCheck, faPrint, faClockRotateLeft, faDna, faHeartPulse, faLocationDot, faPen, faSyringe, faVenusMars, faWeightScale } from "@fortawesome/free-solid-svg-icons";
import {
  getAnimal,
  getAnimalAuditTrail,
  getLineage,
  getPosition,
  getRanch,
  listAnimalDocuments,
  listAnimalMovements,
  listBreeding,
  listIdentifiers,
  listObservations,
  listOffspring,
  listVaccinations,
  listWeights,
} from "@/lib/api";
import { MOCK_NOW } from "@/lib/mock/seed";
import { DOC_TYPE_LABEL } from "@/lib/format";
import { DocStatusBadge, MovementStatusBadge } from "@/components/compliance/badges";
import { AuditTimeline } from "@/components/AuditTimeline";
import { WeightSparkline } from "@/components/charts/Charts";
import { IdentifiersCard } from "@/components/animals/IdentifiersCard";
import { LineageTree } from "@/components/animals/LineageTree";
import { FadeIn } from "@/components/motion";
import { Badge, Card, CardHeader, Empty, Field, PageHeader, ProvisionalNote, StatusBadge } from "@/components/ui";
import { btn } from "@/components/ui-styles";
import { getI18n } from "@/lib/i18n/server";
import { animalLabel } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/animals/[id]">): Promise<Metadata> {
  const { t } = await getI18n();
  const a = await getAnimal((await params).id);
  return { title: a ? animalLabel(a.tag_id, a.nickname) : t("Animal") };
}

export default async function AnimalPage({ params }: PageProps<"/animals/[id]">) {
  const { t, ageLabel, fmtDate, fmtNum, titleCase } = await getI18n();
  const { id } = await params;
  const animal = await getAnimal(id);
  if (!animal) notFound();

  const [ranch, identifiers, weights, vaccinations, observations, breeding, lineage, offspring, audit, position, movements, documents] = await Promise.all([
    getRanch(animal.ranch_id),
    listIdentifiers(id),
    listWeights(id),
    listVaccinations(id),
    listObservations(id),
    listBreeding(id),
    getLineage(id),
    listOffspring(id),
    getAnimalAuditTrail(id),
    getPosition(id),
    listAnimalMovements(id),
    listAnimalDocuments(id),
  ]);

  const lastW = weights.at(-1);
  const prevW = weights.at(-2);
  const now = MOCK_NOW.getTime();
  const female = animal.gender === "cow" || animal.gender === "heifer";

  return (
    <>
      <PageHeader
        title={
          // Tag and nickname share the heading: same size and color. The nickname is a lighter weight so the official tag still leads.
          <span className="flex flex-wrap items-baseline gap-x-3">
            <span>{animal.tag_id}</span>
            {animal.nickname && <span className="font-normal">“{animal.nickname}”</span>}
          </span>
        }
        back={{ href: "/animals", label: "Animals" }}
        subtitle={[animal.gender && titleCase(animal.gender), animal.color && t(animal.color), ageLabel(animal.dob)].filter(Boolean).join(" · ")}
        actions={
          <>
            <StatusBadge status={animal.status} />
            <Link href={`/animals/${id}/edit`} className={btn.ghost}>
              <FontAwesomeIcon icon={faPen} /> {t("Edit")}
            </Link>
            <Link href={`/animals/${id}/records`} className={btn.ghost}>
              <FontAwesomeIcon icon={faPrint} /> {t("Print records")}
            </Link>
          </>
        }
      />

      {position && !position.inside_boundary && (
        <FadeIn className="mb-4 flex items-start gap-3 rounded-2xl border border-danger/40 bg-danger/10 p-3.5 text-sm text-danger">
          <FontAwesomeIcon icon={faLocationDot} className="mt-0.5" />
          <p>
            <b>{t("Outside ranch boundary.")}</b> {t("Last GPS ping at {lat}, {lon}.", { lat: position.lat.toFixed(4), lon: position.lon.toFixed(4) })}
          </p>
        </FadeIn>
      )}

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="space-y-4 sm:space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title={t("Overview")} icon={faVenusMars} />
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4 p-4 sm:grid-cols-3 sm:p-5">
              <Field label={t("Nickname")} value={animal.nickname} />
              <Field label={t("Ranch")} value={ranch ? <Link href={`/ranches/${ranch.id}`} className="text-primary hover:underline">{ranch.name}</Link> : null} />
              <Field label={t("Born")} value={fmtDate(animal.dob)} />
              <Field label={t("Age")} value={ageLabel(animal.dob)} />
              <Field label={t("Breed association")} value={animal.breed_association} />
              <Field label={t("Registry #")} value={animal.registry_number && <span className="font-mono">{animal.registry_number}</span>} />
              <Field label={t("Registered")} value={fmtDate(animal.created_at)} />
              {animal.status === "deceased" && <Field label={t("Cause of death")} value={animal.cause_of_death} />}
              <Field label={t("Last weight")} value={lastW ? `${fmtNum(lastW.weight_lb)} lb${prevW ? ` (${lastW.weight_lb >= prevW.weight_lb ? "+" : ""}${lastW.weight_lb - prevW.weight_lb})` : ""}` : null} />
            </dl>
          </Card>

          <Card>
            <CardHeader title={t("Weight history")} icon={faWeightScale} action={<ProvisionalNote>{t("Mock health-service data")}</ProvisionalNote>} />
            {weights.length > 1 ? (
              <div className="p-3 sm:p-5">
                <WeightSparkline data={weights} />
              </div>
            ) : (
              <Empty>{t("Not enough weigh-ins to chart.")}</Empty>
            )}
          </Card>

          <Card>
            <CardHeader title={t("Vaccinations")} icon={faSyringe} action={<ProvisionalNote>{t("Mock health-service data")}</ProvisionalNote>} />
            {vaccinations.length === 0 ? (
              <Empty>{t("No vaccinations recorded.")}</Empty>
            ) : (
              <ul className="divide-y divide-line">
                {vaccinations.map((v) => {
                  const due = new Date(v.next_due_at).getTime();
                  const overdue = due < now;
                  const soon = !overdue && due - now < 30 * 86_400_000;
                  return (
                    <li key={v.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{v.vaccine}</p>
                        <p className="truncate text-xs text-muted">
                          {fmtDate(v.administered_at)} · {v.dose_ml} mL · {v.administered_by}
                        </p>
                      </div>
                      <Badge tone={overdue ? "danger" : soon ? "warn" : "ok"}>{overdue ? t("Overdue") : t("Next")} {fmtDate(v.next_due_at)}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title={t("Health observations")} icon={faHeartPulse} action={<ProvisionalNote>{t("Mock health-service data")}</ProvisionalNote>} />
            {observations.length === 0 ? (
              <Empty>{t("No observations logged.")}</Empty>
            ) : (
              <ul className="divide-y divide-line">
                {observations.map((o) => (
                  <li key={o.id} className="flex items-start gap-3 px-4 py-3 sm:px-5">
                    <span className={clsx("mt-1.5 size-2 shrink-0 rounded-full", o.severity === "high" ? "bg-danger" : o.severity === "medium" ? "bg-warn" : "bg-ok")} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">{o.notes}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {fmtDate(o.observed_at)} · {o.kind === "symptom" ? t("Symptom") : t("Routine check")}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {(female || breeding.length > 0) && (
            <Card>
              <CardHeader title={t("Breeding")} icon={faDna} action={<ProvisionalNote>{t("Mock health-service data")}</ProvisionalNote>} />
              {breeding.length === 0 ? (
                <Empty>{t("No breeding events.")}</Empty>
              ) : (
                <ul className="divide-y divide-line">
                  {breeding.map((b) => (
                    <li key={b.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{titleCase(b.event)}</p>
                        {b.notes && <p className="truncate text-xs text-muted">{b.notes}</p>}
                      </div>
                      <span className="shrink-0 text-xs text-muted">{fmtDate(b.occurred_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-4 sm:space-y-6">
          <IdentifiersCard animalId={id} initial={identifiers} />

          <Card>
            <CardHeader title={t("Lineage")} icon={faDna} sub={t("Up to 3 generations")} />
            {lineage && (lineage.sire || lineage.dam) ? <LineageTree root={lineage} /> : <Empty>{t("No parentage on record.")}</Empty>}
            {offspring.length > 0 && (
              <div className="border-t border-line px-4 py-3 sm:px-5">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted">{t("Offspring ({n})", { n: offspring.length })}</p>
                <div className="flex flex-wrap gap-1.5">
                  {offspring.map((o) => (
                    <Link key={o.id} href={`/animals/${o.id}`} className="rounded-lg border border-line px-2 py-1 font-mono text-xs transition hover:border-primary hover:text-primary">
                      {animalLabel(o.tag_id, o.nickname)}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader
              title={t("Compliance")}
              icon={faClipboardCheck}
              action={
                <Link href={`/compliance/documents/new?animal=${id}`} className="-mx-2 inline-flex min-h-10 items-center px-2 text-xs font-medium text-primary hover:underline">{t("Upload")}
                </Link>
              }
            />
            {movements.length === 0 && documents.length === 0 ? (
              <Empty>{t("No movements or documents on file.")}</Empty>
            ) : (
              <ul className="divide-y divide-line">
                {movements.map((m) => (
                  <li key={m.id}>
                    <Link href={`/compliance/movements/${m.id}`} className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface2 sm:px-5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {m.direction === "out" ? t("To") : t("From")} {(m.direction === "out" ? m.destination : m.origin).split(",")[0]}
                        </p>
                        <p className="text-xs text-muted">
                          {titleCase(m.purpose)} · {fmtDate(m.moved_at)}
                        </p>
                      </div>
                      <MovementStatusBadge movement={m} />
                    </Link>
                  </li>
                ))}
                {documents.map((d) => (
                  <li key={d.id}>
                    <Link href={`/compliance/documents/${d.id}`} className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface2 sm:px-5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{d.title}</p>
                        <p className="text-xs text-muted">{t(DOC_TYPE_LABEL[d.doc_type])}</p>
                      </div>
                      <DocStatusBadge status={d.status} daysLeft={d.days_left} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title={t("Audit trail")} icon={faClockRotateLeft} />
            <AuditTimeline events={audit} showAnimal={false} compact />
          </Card>
        </div>
      </div>
    </>
  );
}
