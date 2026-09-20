import { AlertsList } from "@/components/alerts/AlertsList";
import { PageHeader } from "@/components/ui";
import { getI18n, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle("Alerts");

export default async function AlertsPage() {
  const { t } = await getI18n();
  // Alerts come from AlertsProvider (set in the (app) layout), so read state is shared with the bell.
  return (
    <>
      <PageHeader title={t("Alerts")} subtitle={t("Boundary breaches, health notes and vaccination reminders")} />
      <AlertsList />
    </>
  );
}
