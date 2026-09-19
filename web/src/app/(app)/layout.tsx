import { listAlerts } from "@/lib/api";
import { AlertsProvider } from "@/components/alerts/AlertsProvider";
import { AppShell } from "@/components/shell/AppShell";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const alerts = await listAlerts();
  return (
    <AlertsProvider alerts={alerts}>
      <AppShell>{children}</AppShell>
    </AlertsProvider>
  );
}
