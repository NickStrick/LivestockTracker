import { notFound } from "next/navigation";
import { getAnimal, listRanches } from "@/lib/api";
import { AnimalForm } from "@/components/animals/AnimalForm";
import { PageHeader } from "@/components/ui";
import { pageTitle } from "@/lib/i18n/server";
import { getI18n } from "@/lib/i18n/server";
import { animalLabel } from "@/lib/format";

export const generateMetadata = pageTitle("Edit animal");

export default async function EditAnimalPage({ params }: PageProps<"/animals/[id]/edit">) {
  const { t } = await getI18n();
  const { id } = await params;
  const [animal, ranches] = await Promise.all([getAnimal(id), listRanches()]);
  if (!animal) notFound();
  return (
    <>
      <PageHeader title={t("Edit {tag}", { tag: animalLabel(animal.tag_id, animal.nickname) })} back={{ href: `/animals/${animal.id}`, label: animalLabel(animal.tag_id, animal.nickname) }} />
      <AnimalForm mode="edit" animal={animal} ranches={ranches.map((r) => ({ id: r.id, name: r.name }))} />
    </>
  );
}
