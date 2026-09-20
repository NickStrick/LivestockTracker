import { listBreaches, listRanches, listZones } from "@/lib/api";
import { BreachesView } from "@/components/breaches/BreachesView";
import { Card, PageHeader, ProvisionalNote } from "@/components/ui";
import { getI18n, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle("Boundary breaches");

export default async function BreachesPage() {
  const { t } = await getI18n();
  const [breaches, ranches] = await Promise.all([listBreaches(), listRanches()]);
  const withZones = await Promise.all(ranches.map(async (r) => ({ id: r.id, name: r.name, boundary: r.boundary, zones: await listZones(r.id) })));

  return (
    <>
      <PageHeader
        title={t("Boundary breaches")}
        subtitle={t("Animals whose latest GPS ping is outside the ranch perimeter (last 7 days)")}
        back={{ href: "/dashboard", label: "Dashboard" }}
        actions={<ProvisionalNote>{t("Mock gps-service data")}</ProvisionalNote>}
      />
      {breaches.length === 0 ? (
        <Card>
          <p className="px-5 py-16 text-center text-sm text-muted">{t("Every animal is inside its ranch boundary.")}</p>
        </Card>
      ) : (
        <BreachesView breaches={breaches} ranches={withZones} />
      )}
    </>
  );
}
