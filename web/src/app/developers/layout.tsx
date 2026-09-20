import type { Metadata } from "next";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUpRightFromSquare, faCode } from "@fortawesome/free-solid-svg-icons";
import { ThemeToggle } from "@/components/shell/ThemeToggle";

// For the people building the backend, not for ranchers: English only, kept out of the app's navigation and search results.
export const metadata: Metadata = { title: "Developer reference", robots: { index: false, follow: false } };

export default function DevLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-40 border-b border-line/70 bg-canvas/85 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/developers" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-fg">
              <FontAwesomeIcon icon={faCode} />
            </span>
            <span className="text-base font-semibold tracking-tight">
              Estancia <span className="font-normal text-muted">developers</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/dashboard" className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-3 text-sm font-medium transition hover:bg-surface2">
              Open app <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-xs" />
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8 sm:px-6">{children}</main>
    </div>
  );
}
