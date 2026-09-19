import { faFileCircleExclamation, faHeartPulse, faLocationCrosshairs, faSyringe, faTruck } from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import type { AlertKind, AlertSeverity } from "@/lib/types";

/** `mono` marks alerts whose subject is an animal tag (rendered in a monospace font). */
export const ALERT_META: Record<AlertKind, { icon: IconDefinition; label: string; mono: boolean }> = {
  geofence_breach: { icon: faLocationCrosshairs, label: "Boundary", mono: true },
  health: { icon: faHeartPulse, label: "Health", mono: true },
  vaccination_overdue: { icon: faSyringe, label: "Vaccination", mono: true },
  vaccination_due: { icon: faSyringe, label: "Vaccination", mono: true },
  document_expired: { icon: faFileCircleExclamation, label: "Compliance", mono: false },
  document_expiring: { icon: faFileCircleExclamation, label: "Compliance", mono: false },
  movement_issue: { icon: faTruck, label: "Compliance", mono: false },
};

export const SEVERITY_META: Record<AlertSeverity, { label: string; chip: string; dot: string }> = {
  critical: { label: "Critical", chip: "bg-danger/15 text-danger", dot: "bg-danger" },
  warning: { label: "Warning", chip: "bg-warn/15 text-warn", dot: "bg-warn" },
  info: { label: "Upcoming", chip: "bg-info/15 text-info", dot: "bg-info" },
};
