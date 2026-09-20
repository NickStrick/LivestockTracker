import { listRanches } from "@/lib/api";
import { RanchForm } from "@/components/ranches/RanchForm";
import { PageHeader } from "@/components/ui";
import { getI18n, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle("Onboard ranch");

export default async function NewRanchPage() {
  const { t } = await getI18n();
  // Mock: reuse the existing customer. Real auth will supply the customer_id from the session.
  const [first] = await listRanches();
  return (
    <>
      <PageHeader title={t("Onboard ranch")} subtitle={t("Draw the perimeter, then add zones")} back={{ href: "/ranches", label: "Ranches" }} />
      <RanchForm customerId={first?.customer_id ?? "cus_demo"} />
    </>
  );
}
