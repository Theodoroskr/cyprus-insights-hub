import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { StatDataset } from "@/lib/eurostatView";
import type { PulseObs } from "@/lib/greecePulse";

export type StatBundle = { datasets: Record<string, StatDataset>; obs: Record<string, PulseObs[]> };

/** Published Eurostat observations for the given dataset codes (all geographies). */
export function useStatSeries(codes: string[]) {
  return useQuery({
    queryKey: ["stat-series", ...codes],
    staleTime: 3600_000,
    queryFn: async (): Promise<StatBundle> => {
      const { data: ds, error } = await supabase.rpc("get_public_stat_datasets");
      if (error) throw error;
      const list = ((ds ?? []) as StatDataset[]).filter((d) => codes.includes(d.code));
      const byId = new Map(list.map((d) => [d.id, d.code]));
      const obs: Record<string, PulseObs[]> = Object.fromEntries(list.map((d) => [d.code, []]));
      if (list.length) {
        for (let from = 0; ; from += 1000) {
          const { data, error: e } = await supabase.from("stat_observations").select("dataset_id, geo, period, period_date, value, status_flag")
            .in("dataset_id", list.map((d) => d.id)).order("period_date").range(from, from + 999);
          if (e) throw e;
          for (const r of data ?? []) obs[byId.get(r.dataset_id)!].push({ geo: r.geo, period: r.period, period_date: r.period_date, value: Number(r.value), status_flag: r.status_flag });
          if (!data || data.length < 1000) break;
        }
      }
      return { datasets: Object.fromEntries(list.map((d) => [d.code, d])), obs };
    },
  });
}

const FLAGS: Record<string, { en: string; el: string }> = {
  p: { en: "provisional", el: "προσωρινό" }, e: { en: "estimate", el: "εκτίμηση" }, b: { en: "break in series", el: "διακοπή σειράς" },
  d: { en: "definition differs", el: "διαφορετικός ορισμός" }, u: { en: "low reliability", el: "χαμηλή αξιοπιστία" }, s: { en: "Eurostat estimate", el: "εκτίμηση Eurostat" },
};
export function flagLabel(flag: string | null | undefined, lang: "el" | "en"): string | null {
  if (!flag) return null;
  return [...new Set(flag.split(""))].map((c) => FLAGS[c]?.[lang] ?? c).join(", ");
}
