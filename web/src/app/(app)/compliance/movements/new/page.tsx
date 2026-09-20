import { listAnimals, listRanches } from "@/lib/api";
import { MovementForm } from "@/components/compliance/MovementForm";
import { PageHeader } from "@/components/ui";
import { getI18n, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle("Record movement");

export default async function NewMovementPage() {
  const { t } = await getI18n();
  const [ranches, animals] = await Promise.all([listRanches(), listAnimals({ status_filter: "active" })]);
  return (
    <>
      <PageHeader title={t("Record movement")} subtitle={t("Log animals arriving at or leaving a ranch")} back={{ href: "/compliance", label: "Compliance" }} />
      <MovementForm ranches={ranches.map((r) => ({ id: r.id, name: r.name }))} animals={animals} />
    </>
  );
}
