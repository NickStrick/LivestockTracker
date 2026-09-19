import type { Metadata } from "next";
import { getAnimalTags, listAllAuditEvents } from "@/lib/api";
import { ActivityFeed } from "@/components/ActivityFeed";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Activity" };

export default async function ActivityPage() {
  const [events, tags] = await Promise.all([listAllAuditEvents(), getAnimalTags()]);
  return (
    <>
      <PageHeader title="Activity" subtitle="Audit trail across animals, ranches and services" />
      <ActivityFeed events={events} tags={tags} />
    </>
  );
}
