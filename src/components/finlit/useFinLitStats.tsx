import { useT, periodLabel, sourceLabel } from "@/lib/finlitI18n";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useState } from "react";
import { ResponsiveContainer, LineChart, Line, Tooltip as RTooltip, YAxis } from "recharts";
import { Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { statExplain } from "@/lib/finlitExplain";
import { GEO_LABELS, formatStat, headline, prettyStatPeriod, datasetSource, type StatDataset, type StatObs } from "@/lib/eurostatView";
import type { Finding as F } from "@/components/finlit/SurveyScores";
import { chartSummary } from "@/components/finlit/StatChart";

export const HOUSEHOLD = ["disposable_income", "saving_rate", "net_earnings", "unexpected_expenses", "poverty_rate", "arope_rate"];
export const COST = ["hicp_all", "hicp_food", "price_level", "household_consumption"];
export const BANKING = ["cbc_hh_loans", "cbc_hh_housing_loans", "cbc_hh_consumer_loans", "cbc_hh_deposits", "cbc_rate_mortgage", "cbc_rate_consumer", "cbc_rate_deposit"];
export const CREDIT = ["cbc_hh_loans", "cbc_hh_consumer_loans", "cbc_rate_mortgage", "cbc_rate_consumer"];

export type Finding = F & { id: string; publisher: string; survey: string; survey_year: number; published_year: number | null; indicator: string; value: number | null; unit: string; comparison_label: string | null; comparison_value: number | null; source_url: string; page_ref: string | null; notes: string | null; status: string; breakdown_dimension?: string | null; breakdown_group?: string | null };

/** Eurostat figures shared by all Financial Literacy modules (one cached query). */
export function useFinLitStats() {
  const q = useQuery({
    queryKey: ["finlit-stats"], staleTime: 3600_000,
    queryFn: async () => {
      const { data: ds, error } = await supabase.rpc("get_public_stat_datasets");
      if (error) throw error;
      const datasets = ((ds ?? []) as StatDataset[]).filter((d) => [...HOUSEHOLD, ...COST, ...BANKING].includes(d.code));
      // Page through results: the API returns at most 1,000 rows per request.
      const all: Record<string, unknown>[] = [];
      for (let from = 0; from < 20000; from += 1000) {
        const { data, error: e } = await supabase.from("stat_observations").select("dataset_id, geo, period, period_date, value, status_flag")
          .in("dataset_id", datasets.map((d) => d.id)).gte("period_date", "2019-01-01").order("period_date").order("dataset_id").order("geo").range(from, from + 999);
        if (e) throw e;
        all.push(...(data ?? []));
        if (!data || data.length < 1000) break;
      }
      return { datasets, obs: all.map((r) => ({ ...r, value: Number(r.value) })) as StatObs[] };
    },
  });
  const ds = q.data?.datasets ?? [];
  const pick = (codes: string[]) => codes.map((c) => ds.find((d) => d.code === c)).filter(Boolean) as StatDataset[];
  return { isLoading: q.isLoading, datasets: ds, obs: q.data?.obs ?? [], pick };
}

export function useFinLitFindings() {
  return useQuery({
    queryKey: ["finlit-findings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("fin_lit_findings").select("*").eq("status", "approved").order("sort_order");
      if (error) throw error;
      return ((data ?? []) as Finding[]).filter((f) => f.status === "approved");
    },
  });
}

const SPARK: Record<string, string> = { CY: "hsl(var(--primary))", EU27_2020: "hsl(var(--muted-foreground))", EA: "hsl(var(--muted-foreground))" };

/** Headline figure with a hover-able trend line (Cyprus vs benchmark) and a tap-to-open plain-language note. */
export function StatCard({ ds, obs }: { ds: StatDataset; obs: StatObs[] }) {
  const t = useT();
  const h = headline(ds, obs);
  const [open, setOpen] = useState(false);
  const note = statExplain(ds.code, t.lang);
  const geos = ds.geos.slice(0, 2);
  const rows = useMemo(() => {
    const m = new Map<string, Record<string, number | string>>();
    for (const o of obs) {
      if (o.dataset_id !== ds.id || !geos.includes(o.geo)) continue;
      const e = m.get(o.period_date) ?? { p: periodLabel(o.period, t.lang) };
      e[o.geo] = o.value; m.set(o.period_date, e);
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v).slice(-36);
  }, [ds.id, obs, t.lang, geos.join()]);
  const latest = h.latest?.value; const prev = rows.length > 1 ? Number(rows[rows.length - 2]?.CY) : null;
  const delta = latest != null && prev != null && Number.isFinite(prev) ? latest - prev : null;
  return (
    <Card className="border-l-4 border-l-primary transition-shadow hover:shadow-md"><CardContent className="p-4 space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground leading-snug">{(t.lang === "el" && ds.title_el ? ds.title_el : ds.title_en)}</p>
        {note && <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={t.lang === "el" ? "Τι σημαίνει" : "What this means"} className={`shrink-0 rounded-full p-1 transition-colors ${open ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}><Info className="h-3.5 w-3.5" /></button>}
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-bold font-serif text-primary">{formatStat(latest, ds)}</p>
        {delta != null && Math.abs(delta) > 0 && <span className="text-xs text-muted-foreground">{delta > 0 ? "▲" : "▼"} {Math.abs(delta).toLocaleString("en-GB", { maximumFractionDigits: ds.decimals ?? 1 })}</span>}
      </div>
      {rows.length > 2 && (
        <div className="h-12 -mx-1" role="img" aria-label={chartSummary(ds, rows)}>
          <ResponsiveContainer><LineChart data={rows} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
            <YAxis hide domain={["auto", "auto"]} />
            <RTooltip cursor={{ stroke: "hsl(var(--border))" }} contentStyle={{ fontSize: 11, padding: "4px 8px", borderRadius: 8 }} labelFormatter={(_, p) => String(p?.[0]?.payload?.p ?? "")}
              formatter={(v: number, name: string) => [formatStat(v, ds), t(GEO_LABELS[name] ?? name)]} />
            {geos.map((g) => <Line key={g} dataKey={g} stroke={SPARK[g]} strokeWidth={g === "CY" ? 2 : 1.25} strokeDasharray={g === "CY" ? undefined : "3 3"} dot={false} isAnimationActive connectNulls={false} />)}
          </LineChart></ResponsiveContainer>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        {h.latest ? periodLabel(h.latest.period, t.lang) : t("Data not available")}
        {h.benchmarks.map((b) => b.obs && <span key={b.geo}> · {t(GEO_LABELS[b.geo] ?? b.geo)} {formatStat(b.obs.value, ds)}</span>)}
      </p>
      {open && note && <p className="rounded-md bg-muted p-2.5 text-xs leading-relaxed">{note}</p>}
      <p className="text-[10px] text-muted-foreground">{t(ds.unit_label)} · <a className="underline" href={datasetSource(ds).href} target="_blank" rel="noopener noreferrer">{sourceLabel(datasetSource(ds).label, t.lang)}</a></p>
    </CardContent></Card>
  );
}
