import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRanch, listZones } from "@/lib/api";
import { ZoneForm } from "@/components/ranches/ZoneForm";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Add zone" };

export default async function NewZonePage({ params }: PageProps<"/ranches/[id]/zones/new">) {
  const { id } = await params;
  const ranch = await getRanch(id);
  if (!ranch) notFound();
  const zones = await listZones(id);
  return (
    <>
      <PageHeader title="Add zone" subtitle={ranch.name} back={{ href: `/ranches/${id}`, label: ranch.name }} />
      <ZoneForm ranchId={id} ranchName={ranch.name} ranchBoundary={ranch.boundary} existing={zones} />
    </>
  );
}
