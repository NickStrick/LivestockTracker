import { listAnimals, listMovements, listRanches } from "@/lib/api";
import { DocumentForm } from "@/components/compliance/DocumentForm";
import { PageHeader } from "@/components/ui";
import { getI18n, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle("Upload document");

export default async function NewDocumentPage({ searchParams }: PageProps<"/compliance/documents/new">) {
  const { t } = await getI18n();
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const [ranches, animals, movements] = await Promise.all([listRanches(), listAnimals({ status_filter: "active" }), listMovements()]);
  return (
    <>
      <PageHeader title={t("Upload document")} subtitle={t("Certificates, inspections, test results and registry papers")} back={{ href: "/compliance?tab=documents", label: "Documents" }} />
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
