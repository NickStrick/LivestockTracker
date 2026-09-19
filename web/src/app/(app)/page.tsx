import Link from "next/link";
import clsx from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowTrendDown,
  faArrowTrendUp,
  faChevronRight,
  faCow,
  faHeartPulse,
  faLocationCrosshairs,
  faSyringe,
  faTriangleExclamation,
  faWeightScale,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { getAnimalTags, getDashboard } from "@/lib/api";
import { fmtNum, timeAgo } from "@/lib/format";
import { ActivityChart, CompositionChart, WeightTrendChart } from "@/components/charts/Charts";
import { AuditTimeline } from "@/components/AuditTimeline";
import { Item, Stagger } from "@/components/motion";
import { Badge, Card, CardHeader, Empty, PageHeader, ProvisionalNote, type Tone } from "@/components/ui";

const ALERT_STYLE = {
  geofence_breach: { icon: faLocationCrosshairs, tone: "danger" as Tone },
  vaccination_overdue: { icon: faSyringe, tone: "warn" as Tone },
  vaccination_due: { icon: faSyringe, tone: "info" as Tone },
  health: { icon: faHeartPulse, tone: "danger" as Tone },
};

function Kpi({ label, value, icon, tone, foot }: { label: string; value: string; icon: IconDefinition; tone: string; foot: React.ReactNode }) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted sm:text-sm">{label}</p>
        <span className={clsx("grid size-8 shrink-0 place-items-center rounded-lg text-sm", tone)}>
          <FontAwesomeIcon icon={icon} />
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">{value}</p>
      <div className="mt-1 text-xs text-muted">{foot}</div>
    </Card>
  );
}

export default async function DashboardPage() {
  const [d, tags] = await Promise.all([getDashboard(), getAnimalTags()]);
  const k = d.kpis;
  const up = k.avg_weight_delta_pct >= 0;

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Herd overview across all ranches" />

      <Stagger className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Item>
          <Kpi label="Active head" value={fmtNum(k.active_head)} icon={faCow} tone="bg-primary/15 text-primary" foot={`${d.ranches.length} ranches`} />
        </Item>
        <Item>
          <Kpi
            label="Avg. weight"
            value={`${fmtNum(k.avg_weight_lb)} lb`}
            icon={faWeightScale}
            tone="bg-accent/15 text-accent"
            foot={
              <span className={clsx("inline-flex items-center gap-1 font-medium", up ? "text-ok" : "text-danger")}>
                <FontAwesomeIcon icon={up ? faArrowTrendUp : faArrowTrendDown} /> {Math.abs(k.avg_weight_delta_pct)}% vs last month
              </span>
            }
          />
        </Item>
        <Item>
          <Kpi
            label="Vaccines overdue"
            value={String(k.vaccinations_overdue)}
            icon={faSyringe}
            tone="bg-warn/15 text-warn"
            foot={`${k.vaccinations_due_soon} more due in 30 days`}
          />
        </Item>
        <Item>
          <Kpi label="Boundary breaches" value={String(k.breaches_7d)} icon={faTriangleExclamation} tone="bg-danger/15 text-danger" foot="last 7 days" />
        </Item>
      </Stagger>

      <div className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Average herd weight" sub="Monthly average across active animals" icon={faWeightScale} action={<ProvisionalNote>Weights come from mock health-service data</ProvisionalNote>} />
          <div className="p-3 sm:p-5">
            <WeightTrendChart data={d.weight_trend} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Herd composition" icon={faCow} />
          <div className="p-4 sm:p-5">
            <CompositionChart data={d.composition} />
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Needs attention"
            icon={faTriangleExclamation}
            action={<Badge tone={d.alerts.length ? "danger" : "ok"}>{d.alerts.length} open</Badge>}
          />
          {d.alerts.length === 0 ? (
            <Empty>All clear. Nothing needs attention.</Empty>
          ) : (
            <ul className="divide-y divide-line">
              {d.alerts.map((a) => {
                const s = ALERT_STYLE[a.kind];
                return (
                  <li key={a.id}>
                    <Link href={`/animals/${a.animal_id}`} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface2 sm:px-5">
                      <Badge tone={s.tone} className="size-8 shrink-0 justify-center !rounded-lg !p-0">
                        <FontAwesomeIcon icon={s.icon} />
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          <span className="font-mono text-primary">{a.tag_id}</span> · {a.title}
                        </p>
                        <p className="truncate text-xs text-muted">{a.detail}</p>
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
          <CardHeader title="Ranches" icon={faLocationCrosshairs} action={<Link href="/ranches" className="text-xs font-medium text-primary hover:underline">View all</Link>} />
          <ul className="divide-y divide-line">
            {d.ranches.map((r) => (
              <li key={r.id}>
                <Link href={`/ranches/${r.id}`} className="group flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-surface2 sm:px-5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.name}</p>
                    <p className="text-xs text-muted">
                      {fmtNum(r.area_acres)} acres · {r.zone_count} zones
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone="primary">{r.head_count} head</Badge>
                    {r.breach_count > 0 && <Badge tone="danger">{r.breach_count} out</Badge>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Recent activity" sub="Latest audit events across services" action={<Link href="/activity" className="text-xs font-medium text-primary hover:underline">View all</Link>} />
          <AuditTimeline events={d.recent_events} tags={tags} compact />
        </Card>
        <Card>
          <CardHeader title="Events per week" sub="Excludes registrations" />
          <div className="p-3 sm:p-5">
            <ActivityChart data={d.activity_by_week} />
          </div>
        </Card>
      </div>
    </>
  );
}
