import { listAnimals, listRanches } from "@/lib/api";
import { AnimalForm } from "@/components/animals/AnimalForm";
import { PageHeader } from "@/components/ui";
import { getI18n, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle("Add animal");

export default async function NewAnimalPage() {
  const { t } = await getI18n();
  const [ranches, parents] = await Promise.all([listRanches(), listAnimals({ status_filter: "active" })]);
  return (
    <>
      <PageHeader title={t("Add animal")} subtitle={t("Register a new animal in the herd")} back={{ href: "/animals", label: "Animals" }} />
      <AnimalForm mode="create" ranches={ranches.map((r) => ({ id: r.id, name: r.name }))} parents={parents} />
    </>
  );
}
