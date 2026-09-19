import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClockRotateLeft, faPlus } from "@fortawesome/free-solid-svg-icons";
import { getRanch, getRanchAuditTrail, listAnimals, listRanchPositions, listZones } from "@/lib/api";
import { fmtNum } from "@/lib/format";
import { AuditTimeline } from "@/components/AuditTimeline";
import { RanchView } from "@/components/ranches/RanchView";
import { Badge, Card, CardHeader, PageHeader, btn } from "@/components/ui";

export async function generateMetadata({ params }: PageProps<"/ranches/[id]">): Promise<Metadata> {
  const r = await getRanch((await params).id);
  return { title: r ? r.name : "Ranch" };
}

export default async function RanchPage({ params }: PageProps<"/ranches/[id]">) {
  const { id } = await params;
  const ranch = await getRanch(id);
  if (!ranch) notFound();

  const [zones, positions, animals, audit] = await Promise.all([
    listZones(id),
    listRanchPositions(id),
    listAnimals({ ranch_id: id }),
    getRanchAuditTrail(id),
  ]);
  const tag = new Map(animals.map((a) => [a.id, a.tag_id]));

  return (
    <>
      <PageHeader
        title={ranch.name}
        back={{ href: "/ranches", label: "Ranches" }}
        subtitle={`${fmtNum(ranch.area_acres)} acres · ${ranch.head_count} head · ${ranch.zone_count} active zones`}
        actions={
          <>
            {ranch.breach_count > 0 ? <Badge tone="danger">{ranch.breach_count} outside boundary</Badge> : <Badge tone="ok">All animals inside</Badge>}
            <Link href={`/ranches/${id}/zones/new`} className={btn.ghost}>
              <FontAwesomeIcon icon={faPlus} /> Add zone
            </Link>
          </>
        }
      />
      <RanchView
        boundary={ranch.boundary}
        zones={zones}
        animals={positions.map((p) => ({ animal_id: p.animal_id, tag_id: tag.get(p.animal_id) ?? p.animal_id, lat: p.lat, lon: p.lon, inside_boundary: p.inside_boundary }))}
      />
      <Card className="mt-4 sm:mt-6">
        <CardHeader title="Ranch audit trail" icon={faClockRotateLeft} sub="Latest 15 events" />
        <AuditTimeline events={audit.slice(0, 15)} tags={Object.fromEntries(tag)} compact />
      </Card>
    </>
  );
}
