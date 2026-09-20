import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClockRotateLeft, faPlus } from "@fortawesome/free-solid-svg-icons";
import { getRanch, getRanchAuditTrail, listAnimals, listRanchPositions, listZones } from "@/lib/api";

import { AuditTimeline } from "@/components/AuditTimeline";
import { RanchView } from "@/components/ranches/RanchView";
import { Badge, Card, CardHeader, PageHeader } from "@/components/ui";
import { btn } from "@/components/ui-styles";
import { getI18n } from "@/lib/i18n/server";
import { animalLabel } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/ranches/[id]">): Promise<Metadata> {
  const { t } = await getI18n();
  const r = await getRanch((await params).id);
  return { title: r ? r.name : t("Ranch") };
}

export default async function RanchPage({ params }: PageProps<"/ranches/[id]">) {
  const { t, fmtNum } = await getI18n();
  const { id } = await params;
  const ranch = await getRanch(id);
  if (!ranch) notFound();

  const [zones, positions, animals, audit] = await Promise.all([
    listZones(id),
    listRanchPositions(id),
    listAnimals({ ranch_id: id }),
    getRanchAuditTrail(id),
  ]);
  const tag = new Map(animals.map((a) => [a.id, animalLabel(a.tag_id, a.nickname)]));

  return (
    <>
      <PageHeader
        title={ranch.name}
        back={{ href: "/ranches", label: "Ranches" }}
        subtitle={t("{acres} acres · {head} head · {zones} active zones", { acres: fmtNum(ranch.area_acres), head: ranch.head_count, zones: ranch.zone_count })}
        actions={
          <>
            {ranch.breach_count > 0 ? <Badge tone="danger">{t("{n} outside boundary", { n: ranch.breach_count })}</Badge> : <Badge tone="ok">{t("All animals inside")}</Badge>}
            <Link href={`/ranches/${id}/zones/new`} className={btn.ghost}>
              <FontAwesomeIcon icon={faPlus} /> {t("Add zone")}
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
        <CardHeader title={t("Ranch audit trail")} icon={faClockRotateLeft} sub={t("Latest 15 events")} />
        <AuditTimeline events={audit.slice(0, 15)} tags={Object.fromEntries(tag)} compact />
      </Card>
    </>
  );
}
