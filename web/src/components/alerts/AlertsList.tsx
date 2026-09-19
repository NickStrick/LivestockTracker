"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckDouble } from "@fortawesome/free-solid-svg-icons";
import type { AlertSeverity } from "@/lib/types";
import { Card, btn } from "@/components/ui";
import { AlertRow } from "./AlertRow";
import { useAlerts } from "./AlertsProvider";
import { SEVERITY_META } from "./alertMeta";

type Filter = "all" | AlertSeverity;

export function AlertsList() {
  const { alerts, unreadCount, ready, isRead, markRead, markAllRead } = useAlerts();
  const [filter, setFilter] = useState<Filter>("all");
  const [unreadOnly, setUnreadOnly] = useState(false);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: alerts.length };
    for (const a of alerts) c[a.severity] = (c[a.severity] ?? 0) + 1;
    return c;
  }, [alerts]);

  const rows = alerts.filter((a) => (filter === "all" || a.severity === filter) && (!unreadOnly || !isRead(a.id)));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="scroll-x -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex w-max gap-2">
            {(["all", "critical", "warning", "info"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                  filter === f ? "border-primary bg-primary text-primary-fg" : "border-line bg-surface text-muted hover:text-fg",
                )}
              >
                {f !== "all" && <span className={clsx("size-2 rounded-full", filter === f ? "bg-current" : SEVERITY_META[f].dot)} />}
                {f === "all" ? "All" : SEVERITY_META[f].label} <span className="opacity-70">{counts[f] ?? 0}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} className="size-4 accent-[var(--primary)]" />
            Unread only
          </label>
          <button onClick={markAllRead} disabled={!ready || unreadCount === 0} className={btn.ghost}>
            <FontAwesomeIcon icon={faCheckDouble} /> Mark all read
          </button>
        </div>
      </div>

      <Card>
        {rows.length === 0 ? (
          <p className="px-5 py-14 text-center text-sm text-muted">{unreadOnly ? "You're all caught up." : "No alerts match this filter."}</p>
        ) : (
          <div className="divide-y divide-line">
            {rows.map((a) => (
              <AlertRow key={a.id} alert={a} read={isRead(a.id)} onOpen={() => markRead(a.id)} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
