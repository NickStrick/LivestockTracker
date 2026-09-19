import type { Metadata } from "next";
import { listAnimals, listMovements, listRanches } from "@/lib/api";
import { DocumentForm } from "@/components/compliance/DocumentForm";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Upload document" };

export default async function NewDocumentPage({ searchParams }: PageProps<"/compliance/documents/new">) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const [ranches, animals, movements] = await Promise.all([listRanches(), listAnimals({ status_filter: "active" }), listMovements()]);
  return (
    <>
      <PageHeader title="Upload document" subtitle="Certificates, inspections, test results and registry papers" back={{ href: "/compliance?tab=documents", label: "Documents" }} />
      <DocumentForm
        ranches={ranches.map((r) => ({ id: r.id, name: r.name }))}
        animals={animals}
        movements={movements}
        initialMovement={one(sp.movement)}
        initialAnimal={one(sp.animal)}
      />
    </>
  );
}
