import { faHeartPulse, faLocationCrosshairs, faSyringe } from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import type { AlertKind, AlertSeverity } from "@/lib/types";

export const ALERT_META: Record<AlertKind, { icon: IconDefinition; label: string }> = {
  geofence_breach: { icon: faLocationCrosshairs, label: "Boundary" },
  health: { icon: faHeartPulse, label: "Health" },
  vaccination_overdue: { icon: faSyringe, label: "Vaccination" },
  vaccination_due: { icon: faSyringe, label: "Vaccination" },
};

export const SEVERITY_META: Record<AlertSeverity, { label: string; chip: string; dot: string }> = {
  critical: { label: "Critical", chip: "bg-danger/15 text-danger", dot: "bg-danger" },
  warning: { label: "Warning", chip: "bg-warn/15 text-warn", dot: "bg-warn" },
  info: { label: "Upcoming", chip: "bg-info/15 text-info", dot: "bg-info" },
};
