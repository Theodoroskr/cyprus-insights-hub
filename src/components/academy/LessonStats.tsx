import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { GEO_LABELS, formatStat, headline, prettyStatPeriod, databrowserUrl, type StatDataset, type StatObs } from "@/lib/eurostatView";

export function LessonStats({ codes, title }: { codes: string[]; title: string }) {
  const q = useQuery({
    queryKey: ["academy-stats", codes.join(",")], staleTime: 3600_000, enabled: codes.length > 0,
    queryFn: async () => {
      const { data: ds, error } = await supabase.rpc("get_public_stat_datasets");
      if (error) throw error;
      const datasets = ((ds ?? []) as StatDataset[]).filter((d) => codes.includes(d.code));
      if (!datasets.length) return { datasets, obs: [] as StatObs[] };
      const { data, error: e } = await supabase.from("stat_observations").select("dataset_id, geo, period, period_date, value, status_flag")
        .in("dataset_id", datasets.map((d) => d.id)).gte("period_date", "2018-01-01").order("period_date").limit(3000);
      if (e) throw e;
      return { datasets, obs: (data ?? []).map((r) => ({ ...r, value: Number(r.value) })) as StatObs[] };
    },
  });
  if (!codes.length || !q.data?.datasets.length) return null;
  return (
    <section aria-label={title} className="space-y-2">
      <h2 className="text-lg font-serif font-semibold">{title}</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {q.data.datasets.map((ds) => {
          const h = headline(ds, q.data.obs);
          return (
            <Card key={ds.id} className="border-l-4 border-l-primary"><CardContent className="p-4 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">{ds.title_en}</p>
              <p className="text-3xl font-serif font-bold text-primary">{formatStat(h.latest?.value, ds)}</p>
              <p className="text-xs text-muted-foreground">Cyprus · {h.latest ? prettyStatPeriod(h.latest.period) : "Data not available"}
                {h.benchmarks.map((b) => b.obs && <span key={b.geo}> · {GEO_LABELS[b.geo] ?? b.geo} {formatStat(b.obs.value, ds)}</span>)}</p>
              <p className="text-[11px] text-muted-foreground">Unit: {ds.unit_label} · Source: <a className="underline" href={databrowserUrl(ds.dataset_code)} target="_blank" rel="noopener noreferrer">{ds.source_label || "Eurostat"} {ds.dataset_code}</a>
                {ds.last_success_at ? ` · updated ${new Date(ds.last_success_at).toLocaleDateString("en-GB")}` : ""}</p>
            </CardContent></Card>
          );
        })}
      </div>
    </section>
  );
}
