"use client";

import clsx from "clsx";
import { useI18n } from "@/lib/i18n/client";
import { btn } from "@/components/ui-styles";

export const INPUT = "h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";
export const TEXTAREA = "w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

/** Label + control + error/hint. Error and hint arrive as English keys and are translated here. */
export function F({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-danger">{t(error)}</span> : hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

/** Shared form frame: the fields, a general error line, and Cancel / Save. */
export function FormShell({
  onSubmit,
  onCancel,
  pending,
  error,
  children,
}: {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  pending: boolean;
  error: string;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <form onSubmit={onSubmit} noValidate className={clsx("space-y-4", pending && "opacity-80")}>
      {children}
      {error && (
        <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} disabled={pending} className={btn.ghost}>
          {t("Cancel")}
        </button>
        <button type="submit" disabled={pending} className={btn.primary}>
          {pending ? t("Saving…") : t("Save")}
        </button>
      </div>
    </form>
  );
}
