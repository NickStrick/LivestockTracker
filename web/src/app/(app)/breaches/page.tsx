import type { Metadata } from "next";
import { listBreaches, listRanches, listZones } from "@/lib/api";
import { BreachesView } from "@/components/breaches/BreachesView";
import { Card, PageHeader, ProvisionalNote } from "@/components/ui";

export const metadata: Metadata = { title: "Boundary breaches" };

export default async function BreachesPage() {
  const [breaches, ranches] = await Promise.all([listBreaches(), listRanches()]);
  const withZones = await Promise.all(ranches.map(async (r) => ({ id: r.id, name: r.name, boundary: r.boundary, zones: await listZones(r.id) })));

  return (
    <>
      <PageHeader
        title="Boundary breaches"
        subtitle="Animals whose latest GPS ping is outside the ranch perimeter (last 7 days)"
        back={{ href: "/dashboard", label: "Dashboard" }}
        actions={<ProvisionalNote>Mock gps-service data</ProvisionalNote>}
      />
      {breaches.length === 0 ? (
        <Card>
          <p className="px-5 py-16 text-center text-sm text-muted">Every animal is inside its ranch boundary.</p>
        </Card>
      ) : (
        <BreachesView breaches={breaches} ranches={withZones} />
      )}
    </>
  );
}
