"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import type { AuditEventOut } from "@/lib/types";
import { eventLabel } from "@/lib/format";
import { AuditTimeline } from "@/components/AuditTimeline";
import { Card } from "@/components/ui";

const PAGE = 25;

export function ActivityFeed({ events, tags }: { events: AuditEventOut[]; tags: Record<string, string> }) {
  const [type, setType] = useState("all");
  const [shown, setShown] = useState(PAGE);

  const types = useMemo(() => {
    const c = new Map<string, number>();
    for (const e of events) c.set(e.event_type, (c.get(e.event_type) ?? 0) + 1);
    return [...c.entries()].sort((a, b) => b[1] - a[1]);
  }, [events]);

  const rows = useMemo(() => (type === "all" ? events : events.filter((e) => e.event_type === type)), [events, type]);

  return (
    <div className="space-y-4">
      <div className="scroll-x -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex w-max gap-2">
          {[["all", events.length] as const, ...types].map(([t, n]) => (
            <button
              key={t}
              onClick={() => {
                setType(t);
                setShown(PAGE);
              }}
              className={clsx("rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors", type === t ? "border-primary bg-primary text-primary-fg" : "border-line bg-surface text-muted hover:text-fg")}
            >
              {t === "all" ? "All" : eventLabel(t)} <span className="opacity-70">{n}</span>
            </button>
          ))}
        </div>
      </div>
      <Card>
        <AuditTimeline events={rows.slice(0, shown)} tags={tags} />
        {rows.length > shown && (
          <div className="border-t border-line p-3 text-center">
            <button onClick={() => setShown((s) => s + PAGE)} className="rounded-lg px-4 py-2 text-sm font-medium text-primary hover:bg-surface2">
              Show more ({rows.length - shown} remaining)
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
