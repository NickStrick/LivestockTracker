import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCloudArrowUp, faTruck } from "@fortawesome/free-solid-svg-icons";
import { getAnimalTags, getComplianceSummary, listDocuments, listMovements, listRanches } from "@/lib/api";
import { ComplianceExplorer, type ComplianceTab } from "@/components/compliance/ComplianceExplorer";
import { PageHeader } from "@/components/ui";
import { btn } from "@/components/ui-styles";
import { getI18n, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle("Compliance");

export default async function CompliancePage({ searchParams }: PageProps<"/compliance">) {
  const { t } = await getI18n();
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const tab: ComplianceTab = one(sp.tab) === "documents" ? "documents" : "movements";

  const [movements, documents, ranches, tags, summary] = await Promise.all([listMovements(), listDocuments(), listRanches(), getAnimalTags(), getComplianceSummary()]);

  return (
    <>
      <PageHeader
        title={t("Compliance")}
        subtitle={t("Animal movements, certificates and regulatory documents")}
        actions={
          <>
            <Link href="/compliance/documents/new" className={btn.ghost}>
              <FontAwesomeIcon icon={faCloudArrowUp} /> <span className="hidden sm:inline">{t("Upload document")}</span>
              <span className="sm:hidden">{t("Upload")}</span>
            </Link>
            <Link href="/compliance/movements/new" className={btn.primary}>
              <FontAwesomeIcon icon={faTruck} /> {t("Record movement")}
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
