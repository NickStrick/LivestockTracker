import { getAnimalTags, listAllAuditEvents } from "@/lib/api";
import { ActivityFeed } from "@/components/ActivityFeed";
import { PageHeader } from "@/components/ui";
import { getI18n, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle("Activity");

export default async function ActivityPage() {
  const { t } = await getI18n();
  const [events, tags] = await Promise.all([listAllAuditEvents(), getAnimalTags()]);
  return (
    <>
      <PageHeader title={t("Activity")} subtitle={t("Audit trail across animals, ranches and services")} />
      <ActivityFeed events={events} tags={tags} />
    </>
  );
}
