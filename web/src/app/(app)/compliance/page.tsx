import type { Metadata } from "next";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCloudArrowUp, faTruck } from "@fortawesome/free-solid-svg-icons";
import { getAnimalTags, getComplianceSummary, listDocuments, listMovements, listRanches } from "@/lib/api";
import { ComplianceExplorer, type ComplianceTab } from "@/components/compliance/ComplianceExplorer";
import { PageHeader, btn } from "@/components/ui";

export const metadata: Metadata = { title: "Compliance" };

export default async function CompliancePage({ searchParams }: PageProps<"/compliance">) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const tab: ComplianceTab = one(sp.tab) === "documents" ? "documents" : "movements";

  const [movements, documents, ranches, tags, summary] = await Promise.all([listMovements(), listDocuments(), listRanches(), getAnimalTags(), getComplianceSummary()]);

  return (
    <>
      <PageHeader
        title="Compliance"
        subtitle="Animal movements, certificates and regulatory documents"
        actions={
          <>
            <Link href="/compliance/documents/new" className={btn.ghost}>
              <FontAwesomeIcon icon={faCloudArrowUp} /> <span className="hidden sm:inline">Upload</span> document
            </Link>
            <Link href="/compliance/movements/new" className={btn.primary}>
              <FontAwesomeIcon icon={faTruck} /> Record movement
            </Link>
          </>
        }
      />
      <ComplianceExplorer
        movements={movements}
        documents={documents}
        ranches={ranches.map((r) => ({ id: r.id, name: r.name }))}
        tags={tags}
        summary={summary}
        initialTab={tab}
        initialFilter={one(sp.filter) ?? "all"}
      />
    </>
  );
}
