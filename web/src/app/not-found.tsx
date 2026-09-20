import Link from "next/link";
import { getI18n } from "@/lib/i18n/server";

export default async function NotFound() {
  const { t } = await getI18n();
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-4 text-center">
      <div>
        <p className="text-5xl font-semibold tracking-tight text-primary">404</p>
        <h1 className="mt-3 text-xl font-semibold">{t("Page not found")}</h1>
        <p className="mt-1 text-sm text-muted">{t("The page you're looking for doesn't exist or was moved.")}</p>
        <Link href="/dashboard" className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-fg transition hover:opacity-90">
          {t("Back to the dashboard")}
        </Link>
      </div>
    </main>
  );
}
