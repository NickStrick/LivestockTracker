"use client";

import { createContext, useContext, useMemo } from "react";
import type { Alert } from "@/lib/types";
import { useLocalSet } from "@/lib/useLocalSet";

/**
 * Read state lives in localStorage for now (per browser); with a backend it becomes a
 * per-user field on the alert. Everything reads as "unread" until `ready`.
 */
interface AlertsContextValue {
  alerts: Alert[];
  ready: boolean;
  unread: Alert[];
  unreadCount: number;
  hasUnreadCritical: boolean;
  isRead: (id: string) => boolean;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

const Ctx = createContext<AlertsContextValue | null>(null);

export function AlertsProvider({ alerts, children }: { alerts: Alert[]; children: React.ReactNode }) {
  const { ready, has, add } = useLocalSet("estancia:read-alerts");

  const value = useMemo<AlertsContextValue>(() => {
    const unread = alerts.filter((a) => !has(a.id));
    return {
      alerts,
      ready,
      unread,
      unreadCount: unread.length,
      hasUnreadCritical: unread.some((a) => a.severity === "critical"),
      isRead: has,
      markRead: (id) => add(id),
      markAllRead: () => add(...alerts.map((a) => a.id)),
    };
    // `has`/`add` change identity with the stored set, which is exactly when this must recompute.
  }, [alerts, ready, has, add]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAlerts() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAlerts must be used inside <AlertsProvider>");
  return v;
}
