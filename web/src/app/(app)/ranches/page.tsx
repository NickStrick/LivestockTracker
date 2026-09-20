import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight, faCow, faLayerGroup, faMountain, faPlus, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { listRanches } from "@/lib/api";

import { Item, Stagger } from "@/components/motion";
import { Badge, Card, PageHeader } from "@/components/ui";
import { btn } from "@/components/ui-styles";
import { getI18n, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle("Ranches");

export default async function RanchesPage() {
  const { t, fmtDate, fmtNum } = await getI18n();
  const ranches = await listRanches();
  return (
    <>
      <PageHeader
        title={t("Ranches")}
        subtitle={t("Properties, perimeters and zones")}
        actions={
          <Link href="/ranches/new" className={btn.primary}>
            <FontAwesomeIcon icon={faPlus} /> {t("Add ranch")}
          </Link>
        }
      />
      <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {ranches.map((r) => (
          <Item key={r.id}>
            <Link href={`/ranches/${r.id}`} className="group block">
              <Card className="p-5 transition group-hover:border-primary/60 group-hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold tracking-tight">{r.name}</h2>
                    <p className="text-xs text-muted">{t("Onboarded {date}", { date: fmtDate(r.created_at) })}</p>
                  </div>
                  <FontAwesomeIcon icon={faChevronRight} className="mt-1.5 text-xs text-muted transition-transform group-hover:translate-x-0.5" />
                </div>
                <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
                  {[
                    { icon: faCow, v: r.head_count, l: "Head" },
                    { icon: faMountain, v: fmtNum(r.area_acres), l: "Acres" },
                    { icon: faLayerGroup, v: r.zone_count, l: "Zones" },
                  ].map((s) => (
                    <div key={s.l} className="rounded-xl bg-surface2 px-2 py-3">
                      <FontAwesomeIcon icon={s.icon} className="text-primary" />
                      <dd className="mt-1 text-lg font-semibold tabular-nums leading-none">{s.v}</dd>
                      <dt className="mt-1 text-[11px] text-muted">{t(s.l)}</dt>
                    </div>
                  ))}
                </dl>
                {r.breach_count > 0 && (
                  <Badge tone="danger" className="mt-4">
                    <FontAwesomeIcon icon={faTriangleExclamation} /> {t("{n} outside boundary", { n: r.breach_count })}
                  </Badge>
                )}
              </Card>
            </Link>
          </Item>
        ))}
      </Stagger>
    </>
  );
}
