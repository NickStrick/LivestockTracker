"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";
import { useWhatsNew } from "./WhatsNewProvider";
import { useI18n } from "@/lib/i18n/client";

export function WhatsNewButton() {
  const { t } = useI18n();
  const { open, hasUnseen } = useWhatsNew();
  return (
    <button
      onClick={open}
      aria-label={hasUnseen ? t("What's new (new release)") : t("What's new")}
      title={t("What's new")}
      className="relative inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-3 text-sm font-medium text-muted transition hover:text-fg active:scale-95"
    >
      <FontAwesomeIcon icon={faWandMagicSparkles} className={hasUnseen ? "text-primary" : undefined} />
      <span className="hidden xl:inline">{t("What's new")}</span>
      {hasUnseen && <span className="absolute -right-1 -top-1 size-3 rounded-full bg-primary ring-2 ring-canvas" />}
    </button>
  );
}
