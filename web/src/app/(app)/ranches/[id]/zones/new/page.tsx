import { notFound } from "next/navigation";
import { getRanch, listZones } from "@/lib/api";
import { ZoneForm } from "@/components/ranches/ZoneForm";
import { PageHeader } from "@/components/ui";
import { getI18n, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle("Add zone");

export default async function NewZonePage({ params }: PageProps<"/ranches/[id]/zones/new">) {
  const { t } = await getI18n();
  const { id } = await params;
  const ranch = await getRanch(id);
  if (!ranch) notFound();
  const zones = await listZones(id);
  return (
    <>
      <PageHeader title={t("Add zone")} subtitle={ranch.name} back={{ href: `/ranches/${id}`, label: ranch.name }} />
      <ZoneForm ranchId={id} ranchName={ranch.name} ranchBoundary={ranch.boundary} existing={zones} />
    </>
  );
}
