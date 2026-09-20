"use client";

import Link from "next/link";
import clsx from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCow,
  faDna,
  faFileLines,
  faLocationDot,
  faMap,
  faPen,
  faSyringe,
  faTag,
  faTriangleExclamation,
  faTruck,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import type { AuditEventOut } from "@/lib/types";

import { useI18n } from "@/lib/i18n/client";

const META: Record<string, { icon: IconDefinition; tone: string }> = {
  animal_created: { icon: faCow, tone: "bg-primary/15 text-primary" },
  animal_updated: { icon: faPen, tone: "bg-info/15 text-info" },
  identifier_added: { icon: faTag, tone: "bg-surface2 text-muted" },
  vaccination_recorded: { icon: faSyringe, tone: "bg-ok/15 text-ok" },
  geofence_breach: { icon: faTriangleExclamation, tone: "bg-danger/15 text-danger" },
  movement_recorded: { icon: faTruck, tone: "bg-accent/15 text-accent" },
  document_uploaded: { icon: faFileLines, tone: "bg-info/15 text-info" },
  ranch_created: { icon: faMap, tone: "bg-primary/15 text-primary" },
  zone_created: { icon: faLocationDot, tone: "bg-info/15 text-info" },
  zone_updated: { icon: faLocationDot, tone: "bg-warn/15 text-warn" },
};
const FALLBACK = { icon: faDna, tone: "bg-surface2 text-muted" };

/** `tags` maps animal_id -> tag_id so event rows can link to animals. */
export function AuditTimeline({ events, tags = {}, showAnimal = true, compact = false }: { events: AuditEventOut[]; tags?: Record<string, string>; showAnimal?: boolean; compact?: boolean }) {
  const { t, actorName, eventLabel, eventSummary, fmtDateTime, timeAgo } = useI18n();
  if (!events.length) return <p className="px-5 py-8 text-center text-sm text-muted">{t("No events yet.")}</p>;
  return (
    <ol className={clsx("relative", compact ? "px-4 py-2 sm:px-5" : "px-4 py-4 sm:px-5")}>
      {events.map((e, i) => {
        const m = META[e.event_type] ?? FALLBACK;
        const tag = e.animal_id ? tags[e.animal_id] : null;
        return (
          <li key={e.id} className="relative flex gap-3 pb-4 last:pb-1">
            {i < events.length - 1 && <span className="absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-px bg-line" aria-hidden />}
            <span className={clsx("z-10 grid size-8 shrink-0 place-items-center rounded-full text-xs", m.tone)}>
              <FontAwesomeIcon icon={m.icon} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className="text-sm font-medium">
                  {eventLabel(e.event_type)}
                  {showAnimal && e.animal_id && tag && (
                    <>
                      {" "}
                      <Link href={`/animals/${e.animal_id}`} className="font-mono text-xs text-primary hover:underline">
                        {tag}
                      </Link>
                    </>
                  )}
                </p>
                <time className="text-xs text-muted" dateTime={e.occurred_at} title={fmtDateTime(e.occurred_at)}>
                  {timeAgo(e.occurred_at)}
                </time>
              </div>
              <p className="mt-0.5 break-words text-xs text-muted">{eventSummary(e.event_type, e.event_data)}</p>
              <p className="mt-0.5 text-[11px] text-muted/80">{t("by {name}", { name: actorName(e.actor_id) })}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
