import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { GEO_LABELS, formatStat, headline, prettyStatPeriod, datasetSource, type StatDataset, type StatObs } from "@/lib/eurostatView";
import type { Finding as F } from "@/components/finlit/SurveyScores";

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

export function StatCard({ ds, obs }: { ds: StatDataset; obs: StatObs[] }) {
  const h = headline(ds, obs);
  return (
    <Card className="border-l-4 border-l-primary transition-shadow hover:shadow-md"><CardContent className="p-4 space-y-1">
      <p className="text-xs font-medium text-muted-foreground leading-snug">{ds.title_en}</p>
      <p className="text-3xl font-bold font-serif text-primary">{formatStat(h.latest?.value, ds)}</p>
      <p className="text-xs text-muted-foreground">
        {h.latest ? prettyStatPeriod(h.latest.period) : "Data not available"}
        {h.benchmarks.map((b) => b.obs && <span key={b.geo}> · {GEO_LABELS[b.geo] ?? b.geo} {formatStat(b.obs.value, ds)}</span>)}
      </p>
      <p className="text-[10px] text-muted-foreground">{ds.unit_label} · <a className="underline" href={datasetSource(ds).href} target="_blank" rel="noopener noreferrer">{datasetSource(ds).label}</a></p>
    </CardContent></Card>
  );
}
