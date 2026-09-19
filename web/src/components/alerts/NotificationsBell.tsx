"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faCheckDouble } from "@fortawesome/free-solid-svg-icons";
import { AlertRow } from "./AlertRow";
import { useAlerts } from "./AlertsProvider";

const PREVIEW_LIMIT = 8;

export function NotificationsBell() {
  const { alerts, unread, unreadCount, hasUnreadCritical, ready, isRead, markRead, markAllRead } = useAlerts();
  const path = usePathname();
  // Storing the path the menu was opened on closes it automatically on any navigation.
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const [tab, setTab] = useState<"all" | "unread">("all");
  const open = openedAt === path;
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpenedAt(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenedAt(null);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const list = (tab === "unread" ? unread : alerts).slice(0, PREVIEW_LIMIT);
  const badge = ready && unreadCount > 0;

  return (
    <div ref={wrap} className="sm:relative">
      <button
        onClick={() => setOpenedAt(open ? null : path)}
        aria-label={badge ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={clsx(
          "relative grid size-10 place-items-center rounded-xl border bg-surface text-muted transition hover:text-fg active:scale-95",
          open ? "border-primary text-fg" : "border-line",
        )}
      >
        <motion.span
          key={hasUnreadCritical ? "ring" : "still"}
          animate={hasUnreadCritical ? { rotate: [0, -14, 12, -8, 5, 0] } : { rotate: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="origin-top"
        >
          <FontAwesomeIcon icon={faBell} />
        </motion.span>
        <AnimatePresence>
          {badge && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className={clsx(
                "absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] font-bold leading-none text-white ring-2 ring-canvas",
                hasUnreadCritical ? "bg-danger" : "bg-warn",
              )}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Notifications"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute inset-x-3 top-full z-50 mt-2 origin-top-right overflow-hidden rounded-2xl border border-line bg-surface shadow-xl sm:inset-x-auto sm:right-0 sm:w-[24rem]"
          >
            <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
              <div className="flex gap-1 rounded-lg bg-surface2 p-0.5 text-xs font-medium">
                {(["all", "unread"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={clsx("rounded-md px-2.5 py-1 transition-colors", tab === t ? "bg-surface shadow-sm" : "text-muted hover:text-fg")}
                  >
                    {t === "all" ? "All" : `Unread${ready ? ` ${unreadCount}` : ""}`}
                  </button>
                ))}
              </div>
              <button
                onClick={markAllRead}
                disabled={!unreadCount}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-primary transition hover:bg-surface2 disabled:pointer-events-none disabled:opacity-40"
              >
                <FontAwesomeIcon icon={faCheckDouble} /> Mark all read
              </button>
            </div>

            <div className="max-h-[60vh] divide-y divide-line overflow-y-auto overscroll-contain">
              {list.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-muted">{tab === "unread" ? "You're all caught up." : "No alerts right now."}</p>
              ) : (
                list.map((a) => <AlertRow key={a.id} alert={a} read={isRead(a.id)} onOpen={() => markRead(a.id)} />)
              )}
            </div>

            <Link href="/alerts" className="block border-t border-line px-4 py-3 text-center text-sm font-medium text-primary transition-colors hover:bg-surface2">
              View all alerts ({alerts.length})
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
