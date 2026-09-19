import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCow, faFileLines, faPaperclip, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { getMovement, getRanch, listAnimals, listDocuments } from "@/lib/api";
import { DOC_TYPE_LABEL, fmtDate, titleCase } from "@/lib/format";
import { DirectionBadge, DocStatusBadge, MovementStatusBadge } from "@/components/compliance/badges";
import { Badge, Card, CardHeader, Empty, Field, PageHeader, StatusBadge, btn } from "@/components/ui";

export const metadata: Metadata = { title: "Movement" };

export default async function MovementPage({ params }: PageProps<"/compliance/movements/[id]">) {
  const { id } = await params;
  const move = await getMovement(id);
  if (!move) notFound();

  const [ranch, animals, docs] = await Promise.all([getRanch(move.ranch_id), listAnimals(), listDocuments({ ranch_id: move.ranch_id })]);
  const loaded = animals.filter((a) => move.animal_ids.includes(a.id));
  const attached = docs.filter((d) => move.document_ids.includes(d.id));
  const place = (s: string) => s.split(",")[0];

  return (
    <>
      <PageHeader
        title={`${place(move.origin)} → ${place(move.destination)}`}
        subtitle={`${titleCase(move.purpose)} · ${fmtDate(move.moved_at)}`}
        back={{ href: "/compliance", label: "Compliance" }}
        actions={<MovementStatusBadge movement={move} />}
      />

      {move.issues.length > 0 && (
        <div className="mb-4 rounded-2xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
          <p className="flex items-center gap-2 font-semibold">
            <FontAwesomeIcon icon={faTriangleExclamation} /> Compliance {move.issues.length === 1 ? "issue" : "issues"}
          </p>
          <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-xs">
            {move.issues.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
          <Link href={`/compliance/documents/new?movement=${move.id}`} className={btn.primary + " mt-3"}>
            <FontAwesomeIcon icon={faPaperclip} /> Attach a document
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="space-y-4 sm:space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Details" />
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4 p-4 sm:grid-cols-3 sm:p-5">
              <Field label="Direction" value={<DirectionBadge direction={move.direction} />} />
              <Field label="Type" value={<Badge tone={move.kind === "interstate" ? "info" : "neutral"}>{titleCase(move.kind)}</Badge>} />
              <Field label="Purpose" value={titleCase(move.purpose)} />
              <Field label="From" value={move.origin} />
              <Field label="To" value={move.destination} />
              <Field label="Date" value={fmtDate(move.moved_at)} />
              <Field label="Carrier" value={move.carrier} />
              <Field label="Ranch" value={ranch ? <Link href={`/ranches/${ranch.id}`} className="text-primary hover:underline">{ranch.name}</Link> : null} />
            </dl>
            {move.notes && <p className="border-t border-line px-4 py-3 text-sm text-muted sm:px-5">{move.notes}</p>}
          </Card>

          <Card>
            <CardHeader title={`Animals (${loaded.length})`} icon={faCow} />
            <ul className="divide-y divide-line">
              {loaded.map((a) => (
                <li key={a.id}>
                  <Link href={`/animals/${a.id}`} className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface2 sm:px-5">
                    <div>
                      <p className="font-mono text-sm font-semibold">{a.tag_id}</p>
                      <p className="text-xs text-muted">{[a.gender && titleCase(a.gender), a.color].filter(Boolean).join(" · ")}</p>
                    </div>
                    <StatusBadge status={a.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader title="Documents" icon={faFileLines} action={<Link href={`/compliance/documents/new?movement=${move.id}`} className="text-xs font-medium text-primary hover:underline">Add</Link>} />
          {attached.length === 0 ? (
            <Empty>No documents attached.</Empty>
          ) : (
            <ul className="divide-y divide-line">
              {attached.map((d) => (
                <li key={d.id}>
                  <Link href={`/compliance/documents/${d.id}`} className="block px-4 py-3 transition-colors hover:bg-surface2 sm:px-5">
                    <p className="truncate text-sm font-medium">{d.title}</p>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="text-xs text-muted">{DOC_TYPE_LABEL[d.doc_type]}</span>
                      <DocStatusBadge status={d.status} daysLeft={d.days_left} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
