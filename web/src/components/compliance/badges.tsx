"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowDown, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import type { DocStatus, MovementStatus, MovementView } from "@/lib/types";
import { Badge, type Tone } from "@/components/ui";
import { useI18n } from "@/lib/i18n/client";

const MOVE_TONE: Record<MovementStatus, Tone> = { completed: "ok", pending: "info", flagged: "danger" };

/** Shows "Flagged" when the movement has computed compliance issues, regardless of stored status. */
export function MovementStatusBadge({ movement }: { movement: Pick<MovementView, "status" | "issues"> }) {
  const { titleCase } = useI18n();
  const status: MovementStatus = movement.issues.length > 0 ? "flagged" : movement.status;
  return <Badge tone={MOVE_TONE[status]}>{titleCase(status)}</Badge>;
}

const DOC_TONE: Record<DocStatus, Tone> = { valid: "ok", expiring: "warn", expired: "danger", archived: "neutral" };

export function DocStatusBadge({ status, daysLeft }: { status: DocStatus; daysLeft: number | null }) {
  const { t } = useI18n();
  const label =
    status === "archived"
      ? t("Move completed")
      : status === "valid"
        ? daysLeft === null
          ? t("No expiry")
          : t("Valid")
        : status === "expiring"
          ? t("Expires in {n}d", { n: daysLeft ?? 0 })
          : t("Expired {n}d ago", { n: Math.abs(daysLeft ?? 0) });
  return <Badge tone={DOC_TONE[status]}>{label}</Badge>;
}

export function DirectionBadge({ direction }: { direction: "in" | "out" }) {
  const { t } = useI18n();
  return (
    <Badge tone={direction === "out" ? "neutral" : "primary"}>
      <FontAwesomeIcon icon={direction === "out" ? faArrowUp : faArrowDown} className="rotate-45" />
      {direction === "out" ? t("Outbound") : t("Inbound")}
    </Badge>
  );
}
