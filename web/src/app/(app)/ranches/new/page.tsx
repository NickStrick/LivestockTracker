import type { Metadata } from "next";
import { listRanches } from "@/lib/api";
import { RanchForm } from "@/components/ranches/RanchForm";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Onboard ranch" };

export default async function NewRanchPage() {
  // Mock: reuse the existing customer. Real auth will supply the customer_id from the session.
  const [first] = await listRanches();
  return (
    <>
      <PageHeader title="Onboard ranch" subtitle="Draw the perimeter, then add zones" back={{ href: "/ranches", label: "Ranches" }} />
      <RanchForm customerId={first?.customer_id ?? "cus_demo"} />
    </>
  );
}
