import type { Metadata } from "next";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faBell,
  faClipboardCheck,
  faCow,
  faDna,
  faMapLocationDot,
  faMobileScreen,
  faSyringe,
  faTriangleExclamation,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { getDashboard, listAlerts, listAllAuditEvents } from "@/lib/api";
import { fmtNum } from "@/lib/format";
import { Item, Reveal, Stagger } from "@/components/motion";
import { WhatsNewLink } from "@/components/whatsnew/WhatsNewLink";
import { ALERT_META, SEVERITY_META } from "@/components/alerts/alertMeta";
import { LATEST_RELEASE } from "@/lib/releases";
import clsx from "clsx";

export const metadata: Metadata = {
  title: { absolute: "Estancia | Livestock management for working ranches" },
  description: "Herd records, GPS geofencing, health and vaccination tracking, and compliance paperwork in one app that works on your phone in the field.",
};

const FEATURES: { icon: IconDefinition; title: string; body: string }[] = [
  { icon: faCow, title: "Herd records", body: "Tags, RFID and EID identifiers, lineage, weights and a full audit trail for every animal." },
  { icon: faMapLocationDot, title: "Maps and geofencing", body: "Draw ranch perimeters and zones, see live positions, and get told the moment an animal leaves." },
  { icon: faSyringe, title: "Health and vaccinations", body: "Doses, due dates, symptoms and breeding events, with overdue work surfaced first." },
  { icon: faClipboardCheck, title: "Compliance paperwork", body: "Log every movement, attach CVIs and inspections, and catch expiring documents before a truck leaves." },
  { icon: faBell, title: "Alerts that matter", body: "One inbox for boundary breaches, health concerns, overdue vaccines and paperwork problems." },
  { icon: faMobileScreen, title: "Built for the field", body: "Designed phone-first, so it works from the pasture as well as the office." },
];

const STEPS = [
  { n: "1", title: "Set up your ranch", body: "Draw the perimeter on the map, add zones like pastures, water and quarantine pens, and register your animals." },
  { n: "2", title: "Track as you work", body: "Record vaccinations, health notes, weights and movements from your phone. GPS keeps watch between visits." },
  { n: "3", title: "Stay ahead", body: "Alerts and drill-down pages show exactly what needs attention today, and the audit trail proves what was done." },
];

export default async function HomePage() {
  const [d, alerts, events] = await Promise.all([getDashboard(), listAlerts(), listAllAuditEvents()]);
  const acres = d.ranches.reduce((s, r) => s + r.area_acres, 0);
  const preview = alerts.slice(0, 3);

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-24 size-[28rem] rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute -right-24 top-40 size-[26rem] rounded-full bg-accent/15 blur-3xl" />
          <svg className="absolute inset-0 h-full w-full text-line/70" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="topo" width="120" height="120" patternUnits="userSpaceOnUse">
                <path d="M0 60 Q30 20 60 60 T120 60 M0 90 Q30 50 60 90 T120 90 M0 30 Q30 -10 60 30 T120 30" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#topo)" opacity="0.5" />
          </svg>
        </div>

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:pb-24 lg:pt-24">
          <Stagger className="max-w-xl">
            <Item>
              <WhatsNewLink className="group inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 py-1 pl-1 pr-3 text-xs font-medium backdrop-blur transition hover:border-primary/60">
                <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-fg">New</span>
                {LATEST_RELEASE.title}
                <FontAwesomeIcon icon={faArrowRight} className="text-[10px] text-muted transition-transform group-hover:translate-x-0.5" />
              </WhatsNewLink>
            </Item>
            <Item>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.5rem]">
                Know every animal. <span className="text-primary">Every acre.</span> Every load.
              </h1>
            </Item>
            <Item>
              <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">
                Estancia keeps herd records, GPS boundaries, health work and compliance paperwork in one place, so nothing slips while you&apos;re out working.
              </p>
            </Item>
            <Item>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/dashboard" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-fg shadow-lg shadow-primary/20 transition hover:opacity-90 active:scale-[0.98]">
                  Open the dashboard <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                </Link>
                <WhatsNewLink className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-6 text-sm font-semibold transition hover:bg-surface2 active:scale-[0.98]">
                  <FontAwesomeIcon icon={faWandMagicSparkles} className="text-primary" /> What&apos;s new
                </WhatsNewLink>
              </div>
            </Item>
          </Stagger>

          {/* Product peek, driven by the same data as the real dashboard */}
          <Reveal delay={0.15} className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="rounded-3xl border border-line bg-surface p-4 shadow-2xl shadow-black/10 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted">Bartlett Cattle Co.</p>
                  <p className="text-base font-semibold">Today on the ranch</p>
                </div>
                <span className="grid size-9 place-items-center rounded-xl bg-primary/15 text-primary">
                  <FontAwesomeIcon icon={faCow} />
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2.5">
                {[
                  { l: "Active head", v: fmtNum(d.kpis.active_head), c: "" },
                  { l: "Overdue shots", v: String(d.kpis.vaccinations_overdue), c: "text-warn" },
                  { l: "Outside fence", v: String(d.kpis.breaches_7d), c: "text-danger" },
                ].map((k) => (
                  <div key={k.l} className="rounded-2xl bg-surface2 p-3">
                    <p className="text-[10px] font-medium text-muted sm:text-[11px]">{k.l}</p>
                    <p className={clsx("mt-0.5 text-xl font-semibold tabular-nums", k.c)}>{k.v}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {preview.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-2xl border border-line p-3">
                    <span className={clsx("grid size-9 shrink-0 place-items-center rounded-xl text-sm", SEVERITY_META[a.severity].chip)}>
                      <FontAwesomeIcon icon={ALERT_META[a.kind].icon} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        <span className={clsx("text-primary", ALERT_META[a.kind].mono && "font-mono")}>{a.subject}</span> · {a.title}
                      </p>
                      <p className="truncate text-xs text-muted">{a.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-5 -left-3 hidden items-center gap-2 rounded-2xl border border-line bg-surface px-3.5 py-2.5 shadow-xl sm:flex">
              <span className="grid size-8 place-items-center rounded-lg bg-danger/15 text-danger">
                <FontAwesomeIcon icon={faTriangleExclamation} />
              </span>
              <p className="text-xs">
                <b>Boundary alert</b>
                <br />
                <span className="text-muted">{d.kpis.breaches_7d} animals outside</span>
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Numbers */}
      <section className="border-y border-line bg-surface/60">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-y-6 px-4 py-8 sm:px-6 md:grid-cols-4">
          {[
            { v: fmtNum(d.kpis.active_head), l: "Animals tracked" },
            { v: fmtNum(acres), l: "Acres mapped" },
            { v: String(d.ranches.length), l: "Ranches" },
            { v: fmtNum(events.length), l: "Audit events recorded" },
          ].map((s) => (
            <Reveal key={s.l} className="text-center">
              <dd className="text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">{s.v}</dd>
              <dt className="mt-1 text-sm text-muted">{s.l}</dt>
            </Reveal>
          ))}
        </dl>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24">
        <Reveal className="max-w-2xl">
          <p className="text-sm font-semibold text-primary">Everything in one place</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">The whole operation, from tag to truck</h2>
          <p className="mt-3 text-muted">Replace the notebooks, spreadsheets and folder of certificates with one record that stays current.</p>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 0.06}>
              <div className="h-full rounded-2xl border border-line bg-surface p-5 transition hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 sm:p-6">
                <span className="grid size-11 place-items-center rounded-xl bg-primary/15 text-lg text-primary">
                  <FontAwesomeIcon icon={f.icon} />
                </span>
                <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-20 border-t border-line bg-surface/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <Reveal className="max-w-2xl">
            <p className="text-sm font-semibold text-primary">How it works</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Up and running in an afternoon</h2>
          </Reveal>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.08}>
                <div className="h-full rounded-2xl border border-line bg-canvas p-5 sm:p-6">
                  <span className="grid size-9 place-items-center rounded-full bg-primary text-sm font-bold text-primary-fg">{s.n}</span>
                  <h3 className="mt-4 text-base font-semibold">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-12 text-center text-primary-fg sm:px-12 sm:py-16">
            <div aria-hidden className="absolute -right-16 -top-16 size-64 rounded-full bg-white/10 blur-2xl" />
            <h2 className="relative text-3xl font-semibold tracking-tight sm:text-4xl">See it with a working ranch</h2>
            <p className="relative mx-auto mt-3 max-w-lg text-sm opacity-90 sm:text-base">Explore the dashboard, map and compliance tools with sample data. No account needed.</p>
            <div className="relative mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/dashboard" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-black transition hover:bg-white/90 active:scale-[0.98]">
                Open the dashboard <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
              </Link>
              <Link href="/compliance" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/40 px-6 text-sm font-semibold transition hover:bg-white/10 active:scale-[0.98]">
                <FontAwesomeIcon icon={faDna} /> Explore compliance
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
