import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAnimal, listRanches } from "@/lib/api";
import { AnimalForm } from "@/components/animals/AnimalForm";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Edit animal" };

export default async function EditAnimalPage({ params }: PageProps<"/animals/[id]/edit">) {
  const { id } = await params;
  const [animal, ranches] = await Promise.all([getAnimal(id), listRanches()]);
  if (!animal) notFound();
  return (
    <>
      <PageHeader title={`Edit ${animal.tag_id}`} back={{ href: `/animals/${animal.id}`, label: animal.tag_id }} />
      <AnimalForm mode="edit" animal={animal} ranches={ranches.map((r) => ({ id: r.id, name: r.name }))} />
    </>
  );
}
