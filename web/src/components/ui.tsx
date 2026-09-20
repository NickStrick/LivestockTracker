"use client";

import Link from "next/link";
import clsx from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { useI18n } from "@/lib/i18n/client";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={clsx("rounded-2xl border border-line bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04)]", className)}>{children}</section>;
}

export function CardHeader({ title, icon, action, sub }: { title: string; icon?: IconDefinition; action?: React.ReactNode; sub?: string }) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          {icon && <FontAwesomeIcon icon={icon} className="text-primary" />}
          <span className="truncate">{title}</span>
        </h2>
        {sub && <p className="mt-0.5 truncate text-xs text-muted">{sub}</p>}
      </div>
      {action}
    </header>
  );
}

export type Tone = "neutral" | "ok" | "warn" | "danger" | "info" | "primary";
const TONES: Record<Tone, string> = {
  neutral: "bg-surface2 text-muted",
  ok: "bg-ok/15 text-ok",
  warn: "bg-warn/15 text-warn",
  danger: "bg-danger/15 text-danger",
  info: "bg-info/15 text-info",
  primary: "bg-primary/15 text-primary",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return <span className={clsx("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium leading-5", TONES[tone], className)}>{children}</span>;
}

export const STATUS_TONE: Record<string, Tone> = { active: "ok", sold: "info", deceased: "neutral" };
export function StatusBadge({ status }: { status: string }) {
  const { titleCase } = useI18n();
  return (
    <Badge tone={STATUS_TONE[status] ?? "neutral"}>
      <span className="size-1.5 rounded-full bg-current" />
      {titleCase(status)}
    </Badge>
  );
}

export function PageHeader({ title, subtitle, actions, back }: { title: React.ReactNode; subtitle?: string; actions?: React.ReactNode; back?: { href: string; label: string } }) {
  const { t } = useI18n();
  return (
    <div className="mb-5 sm:mb-6">
      {back && (
        <Link href={back.href} className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-fg">
          <FontAwesomeIcon icon={faArrowLeft} /> {t(back.label)}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/** An animal's tag (monospace) with its nickname beside it when there is one. */
export function AnimalTag({ tag, nickname, className }: { tag: string; nickname?: string | null; className?: string }) {
  return (
    <span className={clsx("inline-flex min-w-0 items-baseline gap-1.5", className)}>
      <span className="font-mono font-semibold">{tag}</span>
      {nickname && <span className="truncate font-normal text-muted">“{nickname}”</span>}
    </span>
  );
}

export function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 truncate text-sm">{value || <span className="text-muted">-</span>}</dd>
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-5 py-8 text-center text-sm text-muted">{children}</p>;
}

export function ProvisionalNote({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  return <span title={String(children)} className="rounded-md border border-dashed border-line px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">{t("mock")}</span>;
}
