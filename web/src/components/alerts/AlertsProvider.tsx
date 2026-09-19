"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import type { Alert } from "@/lib/types";

/**
 * Read/unread state lives in localStorage for now (per browser). With a backend this
 * becomes a per-user field on the alert. useSyncExternalStore keeps SSR output
 * identical to the first client render (everything "unread", badge hidden until ready).
 */
const KEY = "estancia:read-alerts";
const SERVER = "__server__";
const listeners = new Set<() => void>();

const read = () => {
  try {
    return localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
  }
};
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
};
const write = (ids: string[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* storage unavailable (private mode) - state simply won't persist */
  }
  listeners.forEach((l) => l());
};

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
  const raw = useSyncExternalStore(subscribe, read, () => SERVER);
  const ready = raw !== SERVER;
  const readIds = useMemo(() => new Set<string>(ready ? (JSON.parse(raw) as string[]) : []), [raw, ready]);

  const markRead = useCallback(
    (id: string) => {
      if (!readIds.has(id)) write([...readIds, id]);
    },
    [readIds],
  );
  const markAllRead = useCallback(() => write(alerts.map((a) => a.id)), [alerts]);

  const value = useMemo<AlertsContextValue>(() => {
    const unread = alerts.filter((a) => !readIds.has(a.id));
    return {
      alerts,
      ready,
      unread,
      unreadCount: unread.length,
      hasUnreadCritical: unread.some((a) => a.severity === "critical"),
      isRead: (id) => readIds.has(id),
      markRead,
      markAllRead,
    };
  }, [alerts, readIds, ready, markRead, markAllRead]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAlerts() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAlerts must be used inside <AlertsProvider>");
  return v;
}
