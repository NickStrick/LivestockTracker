"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import clsx from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChartPie, faClipboardCheck, faClockRotateLeft, faCow, faMap, faPlus } from "@fortawesome/free-solid-svg-icons";
import { NotificationsBell } from "@/components/alerts/NotificationsBell";
import { WhatsNewButton } from "@/components/whatsnew/WhatsNewButton";
import { AnnouncementBanner } from "./AnnouncementBanner";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: faChartPie },
  { href: "/animals", label: "Animals", icon: faCow },
  { href: "/ranches", label: "Ranches", icon: faMap },
  { href: "/compliance", label: "Compliance", icon: faClipboardCheck },
  { href: "/activity", label: "Activity", icon: faClockRotateLeft },
];

// Drill-down pages belong to the dashboard section, so keep its nav item lit on them.
const SECTION: Record<string, string[]> = { "/dashboard": ["/dashboard", "/vaccinations", "/breaches", "/alerts"] };
const isActive = (path: string, href: string) => (SECTION[href] ?? [href]).some((p) => path === p || path.startsWith(p + "/"));

function Logo({ compact }: { compact?: boolean }) {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-fg">
        <FontAwesomeIcon icon={faCow} />
      </span>
      {!compact && <span className="text-lg font-semibold tracking-tight">Estancia</span>}
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();

  return (
    <div className="min-h-dvh md:pl-[4.5rem] lg:pl-64">
      {/* Sidebar: icon rail on tablet, full on desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[4.5rem] flex-col border-r border-line bg-surface md:flex lg:w-64">
        <div className="flex h-16 items-center justify-center px-4 lg:justify-start">
          <span className="lg:hidden">
            <Logo compact />
          </span>
          <span className="hidden lg:block">
            <Logo />
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
          {NAV.map((n) => {
            const active = isActive(path, n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                title={n.label}
                className={clsx(
                  "relative flex h-11 items-center justify-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors lg:justify-start",
                  active ? "text-primary" : "text-muted hover:text-fg",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-xl bg-primary/12"
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  />
                )}
                <FontAwesomeIcon icon={n.icon} className="relative w-5 text-base" />
                <span className="relative hidden lg:inline">{n.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="flex flex-col items-center gap-3 border-t border-line p-3 lg:flex-row lg:justify-between lg:px-5">
          <div className="hidden min-w-0 lg:block">
            <p className="truncate text-sm font-medium">Bartlett Cattle Co.</p>
            <p className="truncate text-xs text-muted">2 ranches</p>
          </div>
          <ThemeToggle />
        </div>
      </aside>

      <AnnouncementBanner />

      {/* Top bar: brand + theme on mobile, quick action on larger screens */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-canvas/85 px-4 backdrop-blur md:h-16 md:px-8">
        <div className="md:hidden">
          <Logo />
        </div>
        <p className="hidden text-sm text-muted md:block">Bartlett Cattle Co.</p>
        <div className="flex items-center gap-2">
          <WhatsNewButton />
          <NotificationsBell />
          <Link
            href="/animals/new"
            className="hidden h-10 items-center gap-2 rounded-xl bg-primary px-3.5 text-sm font-medium text-primary-fg transition hover:opacity-90 active:scale-[0.98] sm:inline-flex"
          >
            <FontAwesomeIcon icon={faPlus} /> Add animal
          </Link>
          <span className="md:hidden">
            <ThemeToggle />
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-5 sm:px-6 md:px-8 md:pb-12 md:pt-8">{children}</main>

      {/* Bottom tab bar (mobile only) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        aria-label="Primary"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {NAV.map((n) => {
            const active = isActive(path, n.href);
            return (
              <li key={n.href}>
                <Link
                  href={n.href}
                  className={clsx(
                    "relative flex h-16 flex-col items-center justify-center gap-1 text-[10.5px] font-medium transition-colors",
                    active ? "text-primary" : "text-muted",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="tab-dot"
                      className="absolute top-0 h-0.5 w-8 rounded-full bg-primary"
                      transition={{ type: "spring", stiffness: 500, damping: 38 }}
                    />
                  )}
                  <FontAwesomeIcon icon={n.icon} className="text-lg" />
                  {n.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
