"use client";

import Link from "next/link";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation, faWandMagicSparkles, faXmark } from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { useAlerts } from "@/components/alerts/AlertsProvider";
import { useWhatsNew } from "@/components/whatsnew/WhatsNewProvider";
import { LATEST_RELEASE } from "@/lib/releases";
import { useLocalSet } from "@/lib/useLocalSet";
import { useI18n } from "@/lib/i18n/client";

interface Banner {
  /** Changes whenever the message changes, so a dismissed banner returns for new information. */
  key: string;
  tone: "critical" | "info";
  icon: IconDefinition;
  text: React.ReactNode;
  action: { label: string; href?: string; onClick?: () => void };
}

const hash = (s: string) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
};

/** One banner at a time: unread critical alerts come first, then release news. A dismissed banner falls through to the next. */
export function AnnouncementBanner() {
  const { t } = useI18n();
  const { alerts, unread, ready: alertsReady } = useAlerts();
  const { open, hasUnseen } = useWhatsNew();
  const dismissed = useLocalSet("estancia:dismissed-banners");

  const critical = unread.filter((a) => a.severity === "critical");
  const candidates: Banner[] = [];

  if (critical.length > 0) {
    const breaches = critical.filter((a) => a.kind === "geofence_breach");
    const allBreaches = breaches.length === critical.length;
    const n = critical.length;
    candidates.push({
      // Keyed on ALL current critical alerts (not just unread) so reading one never resurrects a dismissed banner.
      key: `critical:${hash(alerts.filter((a) => a.severity === "critical").map((a) => a.id).sort().join(","))}`,
      tone: "critical",
      icon: faTriangleExclamation,
      text: allBreaches ? (
        <>
          <b>{n === 1 ? t("1 animal is outside the ranch boundary.") : t("{n} animals are outside the ranch boundary.", { n })}</b>{" "}
          <span className="hidden sm:inline">
            {n === 1 ? critical[0].subject : critical.slice(0, 3).map((a) => a.subject).join(", ")}
            {n > 3 && ` ${t("and {n} more", { n: n - 3 })}`}
          </span>
        </>
      ) : (
        <>
          <b>{n === 1 ? t("1 critical alert needs attention.") : t("{n} critical alerts need attention.", { n })}</b>{" "}
          <span className="hidden sm:inline">
            {critical[0].subject}: {t(critical[0].title).toLowerCase()}
          </span>
        </>
      ),
      action: { label: t("Review"), href: allBreaches ? "/breaches" : n === 1 ? critical[0].href : "/alerts" },
    });
  }
  if (hasUnseen) {
    candidates.push({
      key: `release:${LATEST_RELEASE.version}`,
      tone: "info",
      icon: faWandMagicSparkles,
      text: (
        <>
          <b>{t("New in Estancia {version}:", { version: LATEST_RELEASE.version })}</b> <span className="hidden sm:inline">{t(LATEST_RELEASE.title)}</span>
        </>
      ),
      action: { label: t("What's new"), onClick: open },
    });
  }

  const show = alertsReady && dismissed.ready ? (candidates.find((b) => !dismissed.has(b.key)) ?? null) : null;

  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div key={show.key} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden print:hidden" role="status">
          <div className={clsx("flex items-center gap-3 px-4 py-2.5 text-sm md:px-8", show.tone === "critical" ? "bg-danger text-white" : "bg-primary text-primary-fg")}>
            <FontAwesomeIcon icon={show.icon} className="shrink-0" />
            <p className="min-w-0 flex-1 text-[13px] leading-snug">{show.text}</p>
            {show.action.href ? (
              <Link href={show.action.href} className="shrink-0 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/30">
                {show.action.label}
              </Link>
            ) : (
              <button onClick={show.action.onClick} className="shrink-0 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/30">
                {show.action.label}
              </button>
            )}
            <button onClick={() => dismissed.add(show.key)} aria-label={t("Dismiss")} className="grid size-10 shrink-0 place-items-center rounded-lg transition hover:bg-white/20">
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
