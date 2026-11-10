import { useT, periodLabel, sourceLabel } from "@/lib/finlitI18n";
import { useMemo, useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend } from "recharts";
import { Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GEO_LABELS, datasetSource, prettyStatPeriod, type StatDataset, type StatObs } from "@/lib/eurostatView";

const COLORS: Record<string, string> = { CY: "hsl(var(--re-1))", EU27_2020: "hsl(var(--re-2))", EA: "hsl(var(--re-3))" };

export function StatChart({ datasets, obs }: { datasets: StatDataset[]; obs: StatObs[] }) {
  const t = useT();
  const [code, setCode] = useState(datasets[0]?.code ?? "");
  const [from, setFrom] = useState(2020);
  const ds = datasets.find((d) => d.code === code) ?? datasets[0];
  const rows = useMemo(() => {
    if (!ds) return [];
    const m = new Map<string, Record<string, number | string>>();
    for (const o of obs) {
      if (o.dataset_id !== ds.id || Number(o.period.slice(0, 4)) < from) continue;
      const e = m.get(o.period_date) ?? { period: periodLabel(o.period, t.lang), raw: o.period };
      e[o.geo] = o.value; m.set(o.period_date, e);
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
  }, [ds, obs, from, t.lang]);
  if (!ds) return null;
  const download = () => {
    const cell = (v: unknown) => { let s = String(v ?? ""); if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; return `"${s.replace(/"/g, '""')}"`; };
    const lines = [[`Source: ${datasetSource(ds).label} (reuse with attribution). Blank = not available.`], [ds.title_en, ds.unit_label], [], ["period", ...ds.geos.map((g) => GEO_LABELS[g] ?? g)],
      ...rows.map((r) => [r.raw, ...ds.geos.map((g) => r[g])])];
    const url = URL.createObjectURL(new Blob([lines.map((r) => r.map(cell).join(",")).join("\n")], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = `cyprus-${ds.code}.csv`; a.click(); URL.revokeObjectURL(url);
  };
  return (
    <Card><CardContent className="p-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        <Select value={ds.code} onValueChange={setCode}><SelectTrigger className="w-72 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>{datasets.map((d) => <SelectItem key={d.code} value={d.code}>{t.lang === "el" && d.title_el ? d.title_el : d.title_en}</SelectItem>)}</SelectContent></Select>
        <Select value={String(from)} onValueChange={(v) => setFrom(Number(v))}><SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>{[2019, 2020, 2021, 2022, 2023, 2024].map((y) => <SelectItem key={y} value={String(y)}>{t("From")} {y}</SelectItem>)}</SelectContent></Select>
        <Button variant="outline" size="sm" onClick={download} disabled={!rows.length}><Download className="h-4 w-4 mr-1" /> CSV</Button>
      </div>
      <div className="h-72" role="img" aria-label={chartSummary(ds, rows)}>
        {rows.length ? <ResponsiveContainer><LineChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="period" fontSize={11} minTickGap={24} /><YAxis fontSize={11} />
          <RTooltip /><Legend />
          {ds.geos.map((g) => <Line key={g} dataKey={g} name={t(GEO_LABELS[g] ?? g)} stroke={COLORS[g]} dot={false} strokeWidth={2} />)}
        </LineChart></ResponsiveContainer> : <p className="text-muted-foreground text-sm">{t("Data not available for this period.")}</p>}
      </div>
      <p className="text-xs text-muted-foreground">{t("Unit")}: {t(ds.unit_label)} · {t("Source")}: <a className="underline" href={datasetSource(ds).href} target="_blank" rel="noopener noreferrer">{sourceLabel(datasetSource(ds).label, t.lang)}</a>{ds.latest_period ? ` · ${t("latest period")} ${periodLabel(ds.latest_period, t.lang)}` : ""}{ds.last_success_at ? ` · ${t("last updated")} ${new Date(ds.last_success_at).toLocaleDateString(t.lang === "el" ? "el-GR" : "en-GB")}` : ""}. {t("Gaps mean no figure has been published; nothing is estimated.")}</p>
    </CardContent></Card>
  );
}

/** Plain-text summary of a chart for screen readers: latest value per area. */
export function chartSummary(ds: Pick<StatDataset, "title_en" | "unit_label" | "geos">, rows: Record<string, number | string>[]) {
  const last = rows[rows.length - 1];
  if (!last) return `${ds.title_en}: no data for this period`;
  const parts = ds.geos.filter((g) => last[g] !== undefined).map((g) => `${GEO_LABELS[g] ?? g} ${last[g]}`);
  return `${ds.title_en} (${ds.unit_label}), ${rows[0].period} to ${last.period}. Latest ${last.period}: ${parts.join(", ")}.`;
}
