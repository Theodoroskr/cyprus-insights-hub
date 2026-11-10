import { useMemo, useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from "recharts";
import { periodLabel } from "@/lib/finlitI18n";
import { statExplain } from "@/lib/finlitExplain";
import { GEO_LABELS, formatStat, headline, type StatDataset, type StatObs } from "@/lib/eurostatView";
import type { Lang } from "@/lib/academy";

const RED = "hsl(var(--mc-red))", CHAR = "hsl(var(--mc-charcoal))", ORANGE = "hsl(var(--mc-orange))";
const geoName = (g: string, lang: Lang) => (lang === "el" ? ({ CY: "Κύπρος", EU27_2020: "ΕΕ-27", EA: "Ευρωζώνη" } as Record<string, string>)[g] : GEO_LABELS[g]) ?? g;
const title = (d: StatDataset, lang: Lang) => (lang === "el" && d.title_el ? d.title_el : d.title_en);

export function DemoTrendChart({ datasets, obs, lang }: { datasets: StatDataset[]; obs: StatObs[]; lang: Lang }) {
  const [code, setCode] = useState(datasets[0]?.code ?? "");
  const [from, setFrom] = useState(2020);
  const ds = datasets.find((d) => d.code === code) ?? datasets[0];
  const geos = ds ? ds.geos.slice(0, 2) : [];
  const rows = useMemo(() => {
    if (!ds) return [];
    const m = new Map<string, Record<string, number | string>>();
    for (const o of obs) {
      if (o.dataset_id !== ds.id || !geos.includes(o.geo) || Number(o.period.slice(0, 4)) < from) continue;
      const e = m.get(o.period_date) ?? { p: periodLabel(o.period, lang) };
      e[o.geo] = o.value; m.set(o.period_date, e);
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
  }, [ds, obs, from, lang, geos.join()]);
  if (!ds) return null;
  return (
    <div className="rounded-2xl border bg-card p-4 md:p-6 space-y-4">
      <div className="flex flex-wrap gap-2">
        {datasets.map((d) => (
          <button key={d.code} type="button" onClick={() => setCode(d.code)} aria-pressed={d.code === ds.code}
            className={`px-4 py-1.5 text-sm font-medium border transition-colors ${d.code === ds.code ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted"}`}>{title(d, lang)}</button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5 text-xs">
        {[2019, 2020, 2022, 2024].map((y) => (
          <button key={y} type="button" onClick={() => setFrom(y)} aria-pressed={from === y} className={`px-3 py-1 border ${from === y ? "bg-[hsl(var(--mc-charcoal))] text-[hsl(var(--mc-white))]" : "bg-card hover:bg-muted"}`}>{lang === "el" ? "Από" : "From"} {y}</button>
        ))}
      </div>
      <div className="h-72">
        {rows.length ? <ResponsiveContainer><LineChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="p" fontSize={11} minTickGap={28} /><YAxis fontSize={11} width={44} />
          <Tooltip formatter={(v: number, n: string) => [formatStat(v, ds), geoName(n, lang)]} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
          <Legend formatter={(v) => geoName(String(v), lang)} />
          {geos.map((g) => <Line key={g} dataKey={g} stroke={g === "CY" ? RED : CHAR} strokeWidth={g === "CY" ? 2.5 : 1.5} strokeDasharray={g === "CY" ? undefined : "4 3"} dot={false} />)}
        </LineChart></ResponsiveContainer> : <p className="text-sm text-muted-foreground">{lang === "el" ? "Δεν υπάρχουν στοιχεία." : "Data not available."}</p>}
      </div>
      {statExplain(ds.code, lang) && <p className="text-sm border-l-4 border-[hsl(var(--mc-yellow))] pl-3">{statExplain(ds.code, lang)}</p>}
    </div>
  );
}

export function DemoCompareBars({ datasets, obs, lang }: { datasets: StatDataset[]; obs: StatObs[]; lang: Lang }) {
  const rows = datasets.map((d) => {
    const h = headline(d, obs); const b = h.benchmarks.find((x) => x.obs);
    return { name: title(d, lang), CY: h.latest?.value ?? null, EU: b?.obs?.value ?? null, euName: b ? geoName(b.geo, lang) : "EU", ds: d };
  }).filter((r) => r.CY != null);
  if (!rows.length) return null;
  return (
    <div className="rounded-2xl border bg-card p-4 md:p-6">
      <div className="h-72">
        <ResponsiveContainer><BarChart data={rows} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="name" fontSize={11} interval={0} /><YAxis fontSize={11} width={40} unit="%" />
          <Tooltip formatter={(v: number, n: string, p) => [formatStat(v, p.payload.ds), n === "CY" ? geoName("CY", lang) : p.payload.euName]} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
          <Legend formatter={(v) => (v === "CY" ? geoName("CY", lang) : lang === "el" ? "ΕΕ / Ευρωζώνη" : "EU / euro area")} />
          <Bar dataKey="CY" fill={RED} radius={[6, 6, 0, 0]} />
          <Bar dataKey="EU" fill={ORANGE} radius={[6, 6, 0, 0]} />
        </BarChart></ResponsiveContainer>
      </div>
    </div>
  );
}
