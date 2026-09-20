"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import clsx from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faTag } from "@fortawesome/free-solid-svg-icons";
import { changeAnimalStatus } from "@/app/(app)/animals/[id]/records/actions";
import { useI18n } from "@/lib/i18n/client";
import { Card, CardHeader, ProvisionalNote } from "@/components/ui";
import { btn } from "@/components/ui-styles";

/**
 * "Mark as sold" for active animals only. After it succeeds the card stays (with an Undo and a link to
 * record the sale movement) until the page is left, even though the animal is no longer active.
 */
export function RecordsSale({ animalId, status, label, className }: { animalId: string; status: string; label: string; className?: string }) {
  const { t } = useI18n();
  const [step, setStep] = useState<"idle" | "confirm" | "done">("idle");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  // Deceased or already-sold animals never see this card (unless they were just marked sold here).
  if (status !== "active" && step !== "done") return null;

  const run = (next: "sold" | "active") =>
    start(async () => {
      setError("");
      const r = await changeAnimalStatus(animalId, next);
      if (r.ok) setStep(next === "sold" ? "done" : "idle");
      else setError(r.error === "not_active" ? t("Only active animals can be marked as sold.") : t("Something went wrong. Please try again."));
    });

  return (
    <Card className={clsx("print:hidden", pending && "opacity-70", className)}>
      <CardHeader title={t("Sale")} icon={faTag} action={<ProvisionalNote>{t("Updates example data only")}</ProvisionalNote>} />
      <div className="space-y-3 p-4 sm:p-5">
        {step === "idle" && (
          <>
            <p className="text-sm leading-relaxed text-muted">{t("Selling this animal? Mark it as sold to take it out of your active herd, alerts and maps.")}</p>
            <button type="button" onClick={() => setStep("confirm")} className={clsx(btn.ghost, "w-full")}>
              <FontAwesomeIcon icon={faTag} /> {t("Mark as sold")}
            </button>
          </>
        )}

        {step === "confirm" && (
          <>
            <p className="text-sm font-medium">{t("Mark {animal} as sold?", { animal: label })}</p>
            <p className="text-xs leading-relaxed text-muted">{t("It leaves your active herd, boundary alerts and live maps. Its records stay available.")}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={pending} onClick={() => run("sold")} className={clsx(btn.primary, "flex-1")}>
                {pending ? t("Saving…") : t("Yes, mark as sold")}
              </button>
              <button type="button" disabled={pending} onClick={() => setStep("idle")} className={btn.ghost}>
                {t("Cancel")}
              </button>
            </div>
          </>
        )}

        {step === "done" && (
          <>
            <p className="flex items-start gap-2 text-sm font-medium text-ok" role="status">
              <FontAwesomeIcon icon={faCheck} className="mt-0.5" /> {t("{animal} is now marked as sold.", { animal: label })}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <Link href="/compliance/movements/new" className="font-medium text-primary hover:underline">
                {t("Record the sale movement")}
              </Link>
              <button type="button" disabled={pending} onClick={() => run("active")} className="text-muted underline-offset-2 hover:text-fg hover:underline">
                {t("Undo")}
              </button>
            </div>
          </>
        )}

        {error && (
          <p className="text-xs text-danger" role="alert">
            {error}
          </p>
        )}
      </div>
    </Card>
  );
}
