import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faCow } from "@fortawesome/free-solid-svg-icons";
import { LanguageToggle } from "@/components/shell/LanguageToggle";
import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { WhatsNewLink } from "@/components/whatsnew/WhatsNewLink";
import { LATEST_RELEASE } from "@/lib/releases";
import { getI18n } from "@/lib/i18n/server";

export default async function MarketingLayout({ children }: LayoutProps<"/">) {
  const { t } = await getI18n();
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-40 border-b border-line/70 bg-canvas/80 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5" aria-label={t("Estancia home")}>
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-fg">
              <FontAwesomeIcon icon={faCow} />
            </span>
            <span className="text-lg font-semibold tracking-tight max-[420px]:hidden">{t("Estancia")}</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted md:flex" aria-label={t("Sections")}>
            <a href="#features" className="transition-colors hover:text-fg">{t("Features")}</a>
            <a href="#how" className="transition-colors hover:text-fg">{t("How it works")}</a>
            <WhatsNewLink className="transition-colors hover:text-fg">{t("What's new")}</WhatsNewLink>
          </nav>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <Link href="/dashboard" className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-3 text-sm font-medium sm:px-4 text-primary-fg transition hover:opacity-90 active:scale-[0.98]">{t("Open app")} <FontAwesomeIcon icon={faArrowRight} className="hidden text-xs sm:inline" />
            </Link>
          </div>
        </div>
      </header>

      {children}

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] text-sm text-muted sm:flex-row sm:items-center sm:px-6">
          <p>{t("Estancia v{version} · Livestock management for working ranches", { version: LATEST_RELEASE.version })}</p>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span>{t("Demo build running on sample data.")}</span>
            <Link href="/developers" className="font-medium underline-offset-2 hover:text-fg hover:underline">{t("For developers")}</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
