import type { Metadata } from "next";
import { AlertsList } from "@/components/alerts/AlertsList";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Alerts" };

export default function AlertsPage() {
  // Alerts come from AlertsProvider (set in the (app) layout), so read state is shared with the bell.
  return (
    <>
      <PageHeader title="Alerts" subtitle="Boundary breaches, health notes and vaccination reminders" />
      <AlertsList />
    </>
  );
}
