import Link from "next/link";
import clsx from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowTrendDown,
  faArrowTrendUp,
  faChevronRight,
  faCow,
  faLocationCrosshairs,
  faSyringe,
  faTriangleExclamation,
  faWeightScale,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { getAnimalTags, getDashboard } from "@/lib/api";

import { ActivityChart, CompositionChart, WeightTrendChart } from "@/components/charts/Charts";
import { AuditTimeline } from "@/components/AuditTimeline";
import { Item, Stagger } from "@/components/motion";
import { ALERT_META, SEVERITY_META } from "@/components/alerts/alertMeta";
import { Badge, Card, CardHeader, Empty, PageHeader, ProvisionalNote } from "@/components/ui";
import { getI18n } from "@/lib/i18n/server";

async function Kpi({ label, value, icon, tone, foot, href }: { label: string; value: string; icon: IconDefinition; tone: string; foot: React.ReactNode; href?: string }) {
  const { t } = await getI18n();
  const card = (
    <Card className={clsx("h-full p-4 sm:p-5", href && "transition group-hover:border-primary/60 group-hover:shadow-md")}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted sm:text-sm">{label}</p>
        <span className={clsx("grid size-8 shrink-0 place-items-center rounded-lg text-sm", tone)}>
          <FontAwesomeIcon icon={icon} />
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">{value}</p>
      <div className="mt-1 text-xs text-muted">{foot}</div>
      {href && (
        <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-primary">{t("View details")} <FontAwesomeIcon icon={faChevronRight} className="text-[9px] transition-transform group-hover:translate-x-0.5" />
        </p>
      )}
    </Card>
  );
  return href ? (
    <Link href={href} className="group block h-full rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
      {card}
    </Link>
  ) : (
    card
  );
}

export default async function DashboardPage() {
  const { t, fmtNum, timeAgo } = await getI18n();
  const [d, tags] = await Promise.all([getDashboard(), getAnimalTags()]);
  const k = d.kpis;
  const up = k.avg_weight_delta_pct >= 0;

  return (
    <>
      <PageHeader title={t("Dashboard")} subtitle={t("Herd overview across all ranches")} />

      <Stagger className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Item>
          <Kpi label={t("Active head")} value={fmtNum(k.active_head)} icon={faCow} tone="bg-primary/15 text-primary" foot={t("{n} ranches", { n: d.ranches.length })} href="/animals" />
        </Item>
        <Item>
          <Kpi
            label={t("Avg. weight")}
            value={`${fmtNum(k.avg_weight_lb)} lb`}
            icon={faWeightScale}
            tone="bg-accent/15 text-accent"
            foot={
              <span className={clsx("inline-flex items-center gap-1 font-medium", up ? "text-ok" : "text-danger")}>
                <FontAwesomeIcon icon={up ? faArrowTrendUp : faArrowTrendDown} /> {t("{pct}% vs last month", { pct: Math.abs(k.avg_weight_delta_pct) })}
              </span>
            }
          />
        </Item>
        <Item>
          <Kpi
            label={t("Vaccines overdue")}
            value={String(k.vaccinations_overdue)}
            icon={faSyringe}
            tone="bg-warn/15 text-warn"
            foot={t("{n} more due in 30 days", { n: k.vaccinations_due_soon })}
            href="/vaccinations?status=overdue"
          />
        </Item>
        <Item>
          <Kpi label={t("Boundary breaches")} value={String(k.breaches_7d)} icon={faTriangleExclamation} tone="bg-danger/15 text-danger" foot={t("last 7 days")} href="/breaches" />
        </Item>
      </Stagger>

      <div className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title={t("Average herd weight")} sub={t("Monthly average across active animals")} icon={faWeightScale} action={<ProvisionalNote>{t("Weights come from mock health-service data")}</ProvisionalNote>} />
          <div className="p-3 sm:p-5">
            <WeightTrendChart data={d.weight_trend} />
          </div>
        </Card>
        <Card>
          <CardHeader title={t("Herd composition")} icon={faCow} />
          <div className="p-4 sm:p-5">
            <CompositionChart data={d.composition} />
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title={t("Needs attention")}
            icon={faTriangleExclamation}
            action={<Link href="/alerts" className="-mx-2 inline-flex min-h-10 items-center px-2 text-xs font-medium text-primary hover:underline">{t("View all")}</Link>}
          />
          {d.alerts.length === 0 ? (
            <Empty>{t("All clear. Nothing needs attention.")}</Empty>
          ) : (
            <ul className="divide-y divide-line">
              {d.alerts.map((a) => {
                const meta = ALERT_META[a.kind];
                const sev = SEVERITY_META[a.severity];
                return (
                  <li key={a.id}>
                    <Link href={a.href} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface2 sm:px-5">
                      <span className={clsx("grid size-8 shrink-0 place-items-center rounded-lg text-sm", sev.chip)}>
                        <FontAwesomeIcon icon={meta.icon} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          <span className={clsx("text-primary", meta.mono && "font-mono")}>{a.subject}</span> · {t(a.title)}
                        </p>
                        <p className="truncate text-xs text-muted">{t(a.detail)}</p>
                      </div>
                      <span className="hidden shrink-0 text-xs text-muted sm:block">{timeAgo(a.at)}</span>
                      <FontAwesomeIcon icon={faChevronRight} className="text-xs text-muted transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title={t("Ranches")} icon={faLocationCrosshairs} action={<Link href="/ranches" className="-mx-2 inline-flex min-h-10 items-center px-2 text-xs font-medium text-primary hover:underline">{t("View all")}</Link>} />
          <ul className="divide-y divide-line">
            {d.ranches.map((r) => (
              <li key={r.id}>
                <Link href={`/ranches/${r.id}`} className="group flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-surface2 sm:px-5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.name}</p>
                    <p className="text-xs text-muted">
                      {t("{acres} acres · {zones} zones", { acres: fmtNum(r.area_acres), zones: r.zone_count })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone="primary">{t("{n} head", { n: r.head_count })}</Badge>
                    {r.breach_count > 0 && <Badge tone="danger">{t("{n} out", { n: r.breach_count })}</Badge>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title={t("Recent activity")} sub={t("Latest audit events across services")} action={<Link href="/activity" className="-mx-2 inline-flex min-h-10 items-center px-2 text-xs font-medium text-primary hover:underline">{t("View all")}</Link>} />
          <AuditTimeline events={d.recent_events} tags={tags} compact />
        </Card>
        <Card>
          <CardHeader title={t("Events per week")} sub={t("Excludes registrations")} />
          <div className="p-3 sm:p-5">
            <ActivityChart data={d.activity_by_week} />
          </div>
        </Card>
      </div>
    </>
  );
}
