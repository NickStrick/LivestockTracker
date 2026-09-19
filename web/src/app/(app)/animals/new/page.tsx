import type { Metadata } from "next";
import { listAnimals, listRanches } from "@/lib/api";
import { AnimalForm } from "@/components/animals/AnimalForm";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Add animal" };

export default async function NewAnimalPage() {
  const [ranches, parents] = await Promise.all([listRanches(), listAnimals({ status_filter: "active" })]);
  return (
    <>
      <PageHeader title="Add animal" subtitle="Register a new animal in the herd" back={{ href: "/animals", label: "Animals" }} />
      <AnimalForm mode="create" ranches={ranches.map((r) => ({ id: r.id, name: r.name }))} parents={parents} />
    </>
  );
}
