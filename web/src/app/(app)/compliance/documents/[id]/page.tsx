import Link from "next/link";
import { notFound } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCow, faDownload, faFilePdf } from "@fortawesome/free-solid-svg-icons";
import { getDocument, getMovement, getRanch, listAnimals } from "@/lib/api";
import { DOC_TYPE_FULL } from "@/lib/format";
import { DocStatusBadge } from "@/components/compliance/badges";
import { AnimalTag, Card, CardHeader, Field, PageHeader, StatusBadge } from "@/components/ui";
import { getI18n, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle("Document");

export default async function DocumentPage({ params }: PageProps<"/compliance/documents/[id]">) {
  const { t, fmtDate, fmtSize } = await getI18n();
  const { id } = await params;
  const doc = await getDocument(id);
  if (!doc) notFound();

  const [ranch, animals, movement] = await Promise.all([getRanch(doc.ranch_id), listAnimals(), doc.movement_id ? getMovement(doc.movement_id) : null]);
  const linked = animals.filter((a) => doc.animal_ids.includes(a.id));

  // Progress through the validity window, for a quick visual of how close expiry is.
  const span = doc.expires_at ? new Date(doc.expires_at).getTime() - new Date(doc.issued_at).getTime() : 0;
  const used = doc.days_left === null || !span ? 0 : Math.min(100, Math.max(0, 100 - (doc.days_left * 86_400_000 * 100) / span));
  const bar = doc.status === "expired" ? "bg-danger" : doc.status === "expiring" ? "bg-warn" : doc.status === "archived" ? "bg-muted" : "bg-ok";

  return (
    <>
      <PageHeader title={doc.title} subtitle={t(DOC_TYPE_FULL[doc.doc_type])} back={{ href: "/compliance?tab=documents", label: "Documents" }} actions={<DocStatusBadge status={doc.status} daysLeft={doc.days_left} />} />

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="space-y-4 sm:space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title={t("Details")} />
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4 p-4 sm:grid-cols-3 sm:p-5">
              <Field label={t("Issued")} value={fmtDate(doc.issued_at)} />
              <Field label={t("Expires")} value={doc.expires_at ? fmtDate(doc.expires_at) : t("Never")} />
              <Field label={t("Issued by")} value={doc.issued_by} />
              <Field label={t("Ranch")} value={ranch ? <Link href={`/ranches/${ranch.id}`} className="text-primary hover:underline">{ranch.name}</Link> : null} />
              <Field label={t("Movement")} value={movement ? <Link href={`/compliance/movements/${movement.id}`} className="text-primary hover:underline">{movement.origin.split(",")[0]} → {movement.destination.split(",")[0]}</Link> : null} />
              <Field label={t("File")} value={`${doc.file_name} (${fmtSize(doc.size_kb)})`} />
            </dl>
            {doc.expires_at && (
              <div className="border-t border-line px-4 py-4 sm:px-5">
                <div className="mb-1.5 flex justify-between text-xs text-muted">
                  <span>{fmtDate(doc.issued_at)}</span>
                  <span>{fmtDate(doc.expires_at)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface2" role="progressbar" aria-valuenow={Math.round(used)} aria-valuemin={0} aria-valuemax={100} aria-label={t("Validity used")}>
                  <div className={`h-full rounded-full ${bar}`} style={{ width: `${used}%` }} />
                </div>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title={linked.length === 1 ? t("Applies to 1 animal") : t("Applies to {n} animals", { n: linked.length })} icon={faCow} />
            <ul className="divide-y divide-line">
              {linked.map((a) => (
                <li key={a.id}>
                  <Link href={`/animals/${a.id}`} className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface2 sm:px-5">
                    <AnimalTag tag={a.tag_id} nickname={a.nickname} className="text-sm" />
                    <StatusBadge status={a.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader title={t("File")} />
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <span className="grid size-16 place-items-center rounded-2xl bg-surface2 text-3xl text-muted">
              <FontAwesomeIcon icon={faFilePdf} />
            </span>
            <p className="break-all text-sm font-medium">{doc.file_name}</p>
            <button disabled className="inline-flex items-center gap-2 rounded-xl border border-line px-3.5 py-2 text-sm font-medium opacity-60">
              <FontAwesomeIcon icon={faDownload} /> {t("Download")}
            </button>
            <p className="text-xs text-muted">{t("Files will download from S3 through a short-lived signed URL once the backend is connected.")}</p>
          </div>
        </Card>
      </div>
    </>
  );
}
