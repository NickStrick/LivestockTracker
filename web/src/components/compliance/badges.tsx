import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowDown, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import type { DocStatus, MovementStatus, MovementView } from "@/lib/types";
import { Badge, type Tone } from "@/components/ui";

const MOVE_TONE: Record<MovementStatus, Tone> = { completed: "ok", pending: "info", flagged: "danger" };

/** Shows "Flagged" when the movement has computed compliance issues, regardless of stored status. */
export function MovementStatusBadge({ movement }: { movement: Pick<MovementView, "status" | "issues"> }) {
  const status: MovementStatus = movement.issues.length > 0 ? "flagged" : movement.status;
  return <Badge tone={MOVE_TONE[status]}>{status[0].toUpperCase() + status.slice(1)}</Badge>;
}

const DOC_TONE: Record<DocStatus, Tone> = { valid: "ok", expiring: "warn", expired: "danger", archived: "neutral" };

export function DocStatusBadge({ status, daysLeft }: { status: DocStatus; daysLeft: number | null }) {
  const label = status === "archived" ? "Move completed" : status === "valid" ? (daysLeft === null ? "No expiry" : "Valid") : status === "expiring" ? `Expires in ${daysLeft}d` : `Expired ${Math.abs(daysLeft ?? 0)}d ago`;
  return <Badge tone={DOC_TONE[status]}>{label}</Badge>;
}

export function DirectionBadge({ direction }: { direction: "in" | "out" }) {
  return (
    <Badge tone={direction === "out" ? "neutral" : "primary"}>
      <FontAwesomeIcon icon={direction === "out" ? faArrowUp : faArrowDown} className="rotate-45" />
      {direction === "out" ? "Outbound" : "Inbound"}
    </Badge>
  );
}
