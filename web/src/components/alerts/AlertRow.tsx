"use client";

import Link from "next/link";
import clsx from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { Alert } from "@/lib/types";

import { ALERT_META, SEVERITY_META } from "./alertMeta";
import { useI18n } from "@/lib/i18n/client";

export function AlertRow({ alert, read, onOpen }: { alert: Alert; read: boolean; onOpen?: () => void }) {
  const { t, timeAgo } = useI18n();
  const meta = ALERT_META[alert.kind];
  const sev = SEVERITY_META[alert.severity];
  return (
    <Link
      href={alert.href}
      onClick={onOpen}
      className={clsx("group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface2 focus-visible:bg-surface2 focus-visible:outline-none", !read && "bg-primary/[0.04]")}
    >
      <span className={clsx("mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl text-sm", sev.chip)}>
        <FontAwesomeIcon icon={meta.icon} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className={clsx("truncate text-sm", read ? "font-medium" : "font-semibold")}>
            <span className={clsx("text-primary", meta.mono && "font-mono")}>{alert.subject}</span> · {t(alert.title)}
          </p>
          <time className="shrink-0 text-[11px] text-muted" dateTime={alert.at}>
            {timeAgo(alert.at)}
          </time>
        </div>
        <p className="line-clamp-2 text-xs text-muted">{t(alert.detail)}</p>
      </div>
      <span aria-label={read ? t("Read") : t("Unread")} className={clsx("mt-2 size-2 shrink-0 rounded-full", read ? "bg-transparent" : "bg-primary")} />
    </Link>
  );
}
