import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faCow } from "@fortawesome/free-solid-svg-icons";
import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { WhatsNewLink } from "@/components/whatsnew/WhatsNewLink";
import { LATEST_RELEASE } from "@/lib/releases";

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-40 border-b border-line/70 bg-canvas/80 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Estancia home">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-fg">
              <FontAwesomeIcon icon={faCow} />
            </span>
            <span className="text-lg font-semibold tracking-tight">Estancia</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted md:flex" aria-label="Sections">
            <a href="#features" className="transition-colors hover:text-fg">Features</a>
            <a href="#how" className="transition-colors hover:text-fg">How it works</a>
            <WhatsNewLink className="transition-colors hover:text-fg">What&apos;s new</WhatsNewLink>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/dashboard" className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-fg transition hover:opacity-90 active:scale-[0.98]">
              Open app <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
            </Link>
          </div>
        </div>
      </header>

      {children}

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] text-sm text-muted sm:flex-row sm:items-center sm:px-6">
          <p>Estancia v{LATEST_RELEASE.version} · Livestock management for working ranches</p>
          <p className="text-xs">Demo build running on sample data.</p>
        </div>
      </footer>
    </div>
  );
}
