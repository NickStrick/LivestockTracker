import { listRanches, listVaccinationStatus } from "@/lib/api";
import { VaccinationsExplorer } from "@/components/vaccinations/VaccinationsExplorer";
import { PageHeader, ProvisionalNote } from "@/components/ui";
import { getI18n, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle("Vaccinations");

export default async function VaccinationsPage({ searchParams }: PageProps<"/vaccinations">) {
  const { t } = await getI18n();
  const sp = await searchParams;
  const status = Array.isArray(sp.status) ? sp.status[0] : sp.status;
  const initial = status === "due_soon" || status === "ok" || status === "all" ? status : "overdue";

  const [rows, ranches] = await Promise.all([listVaccinationStatus(), listRanches()]);
  return (
    <>
      <PageHeader
        title={t("Vaccinations")}
        subtitle={t("Latest dose of each vaccine for every active animal")}
        back={{ href: "/dashboard", label: "Dashboard" }}
        actions={<ProvisionalNote>{t("Mock health-service data")}</ProvisionalNote>}
      />
      <VaccinationsExplorer rows={rows} ranches={ranches.map((r) => ({ id: r.id, name: r.name }))} initial={initial} />
    </>
  );
}
