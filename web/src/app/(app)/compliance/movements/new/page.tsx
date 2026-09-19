import type { Metadata } from "next";
import { listAnimals, listRanches } from "@/lib/api";
import { MovementForm } from "@/components/compliance/MovementForm";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Record movement" };

export default async function NewMovementPage() {
  const [ranches, animals] = await Promise.all([listRanches(), listAnimals({ status_filter: "active" })]);
  return (
    <>
      <PageHeader title="Record movement" subtitle="Log animals arriving at or leaving a ranch" back={{ href: "/compliance", label: "Compliance" }} />
      <MovementForm ranches={ranches.map((r) => ({ id: r.id, name: r.name }))} animals={animals} />
    </>
  );
}
