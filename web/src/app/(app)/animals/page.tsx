import type { Metadata } from "next";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { listAnimals, listRanches } from "@/lib/api";
import { AnimalsExplorer } from "@/components/animals/AnimalsExplorer";
import { PageHeader, btn } from "@/components/ui";

export const metadata: Metadata = { title: "Animals" };

export default async function AnimalsPage() {
  const [animals, ranches] = await Promise.all([listAnimals(), listRanches()]);
  return (
    <>
      <PageHeader
        title="Animals"
        subtitle="Every animal across your ranches"
        actions={
          <Link href="/animals/new" className={btn.primary}>
            <FontAwesomeIcon icon={faPlus} /> Add animal
          </Link>
        }
      />
      <AnimalsExplorer animals={animals} ranches={ranches.map((r) => ({ id: r.id, name: r.name }))} />
    </>
  );
}
