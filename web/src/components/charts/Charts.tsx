"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const AXIS = { fontSize: 11, fill: "var(--muted)" };
const TOOLTIP = {
  contentStyle: { background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, fontSize: 12, color: "var(--fg)" },
  labelStyle: { color: "var(--muted)" },
  cursor: { stroke: "var(--line)", fill: "var(--surface2)" },
};

export function WeightTrendChart({ data }: { data: { month: string; avg_lb: number }[] }) {
  const min = Math.min(...data.map((d) => d.avg_lb));
  const max = Math.max(...data.map((d) => d.avg_lb));
  return (
    <div className="h-56 w-full sm:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="wt" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" tick={AXIS} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS} axisLine={false} tickLine={false} domain={[Math.floor(min * 0.9), Math.ceil(max * 1.05)]} width={48} />
          <Tooltip {...TOOLTIP} formatter={(v) => [`${v} lb`, "Avg weight"]} />
          <Area type="monotone" dataKey="avg_lb" stroke="var(--primary)" strokeWidth={2.5} fill="url(#wt)" dot={{ r: 3, fill: "var(--primary)", strokeWidth: 0 }} activeDot={{ r: 5 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const SLICES = ["var(--primary)", "var(--accent)", "var(--info)", "var(--warn)"];

export function CompositionChart({ data }: { data: { label: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row lg:flex-col xl:flex-row">
      <div className="relative size-40 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" innerRadius="66%" outerRadius="100%" paddingAngle={3} stroke="none" cornerRadius={4}>
              {data.map((_, i) => (
                <Cell key={i} fill={SLICES[i % SLICES.length]} />
              ))}
            </Pie>
            <Tooltip {...TOOLTIP} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-2xl font-semibold leading-none">{total}</p>
            <p className="mt-1 text-[11px] text-muted">active head</p>
          </div>
        </div>
      </div>
      <ul className="grid w-full grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-1">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ background: SLICES[i % SLICES.length] }} />
              {d.label}
            </span>
            <span className="font-medium tabular-nums">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ActivityChart({ data }: { data: { week: string; events: number }[] }) {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
          <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="week" tick={AXIS} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip {...TOOLTIP} formatter={(v) => [v, "Events"]} />
          <Bar dataKey="events" fill="var(--accent)" radius={[6, 6, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WeightSparkline({ data }: { data: { weighed_at: string; weight_lb: number }[] }) {
  const rows = data.map((d) => ({ m: new Date(d.weighed_at).toLocaleString("en-US", { month: "short", timeZone: "UTC" }), lb: d.weight_lb }));
  const lo = Math.min(...rows.map((r) => r.lb));
  const hi = Math.max(...rows.map((r) => r.lb));
  return (
    <div className="h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="aw" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="m" tick={AXIS} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS} axisLine={false} tickLine={false} domain={[Math.floor(lo * 0.92), Math.ceil(hi * 1.04)]} width={48} />
          <Tooltip {...TOOLTIP} formatter={(v) => [`${v} lb`, "Weight"]} />
          <Area type="monotone" dataKey="lb" stroke="var(--accent)" strokeWidth={2.5} fill="url(#aw)" dot={{ r: 3, fill: "var(--accent)", strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
