import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend } from "recharts";
import { ExternalLink, Globe2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CATEGORY_LABELS, GEO_LABELS, databrowserUrl, flagText, formatStat, headline, prettyStatPeriod,
  type StatDataset, type StatObs,
} from "@/lib/eurostatView";

const COLORS: Record<string, string> = { CY: "hsl(var(--re-1))", EU27_2020: "hsl(var(--re-2))", EA: "hsl(var(--re-3))" };

async function loadAll(): Promise<{ datasets: StatDataset[]; obs: StatObs[] }> {
  const { data: ds, error } = await supabase.rpc("get_public_stat_datasets");
  if (error) throw error;
  const datasets = ((ds ?? []) as StatDataset[]).filter((d) => d.source !== "ecb");
  const obs: StatObs[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error: e } = await supabase.from("stat_observations").select("dataset_id, geo, period, period_date, value, status_flag")
      .in("dataset_id", datasets.map((d) => d.id)).order("period_date").range(from, from + 999);
    if (e) throw e;
    obs.push(...(data ?? []).map((r) => ({ ...r, value: Number(r.value) })));
    if (!data || data.length < 1000) break;
  }
  return { datasets, obs };
}

export function EurostatSection() {
  const q = useQuery({ queryKey: ["eurostat-cyprus"], staleTime: 3600_000, queryFn: loadAll, enabled: true });
  const datasets = q.data?.datasets ?? [];
  const obs = q.data?.obs ?? [];
  const [code, setCode] = useState("hicp_all");
  const selected = datasets.find((d) => d.code === code) ?? datasets[0];

  const series = useMemo(() => {
    if (!selected) return [];
    const m = new Map<string, Record<string, number | string>>();
    for (const o of obs) {
      if (o.dataset_id !== selected.id) continue;
      const e = m.get(o.period_date) ?? { period: prettyStatPeriod(o.period) };
      e[o.geo] = o.value; m.set(o.period_date, e);
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
  }, [obs, selected]);

  const groups = useMemo(() => {
    const g = new Map<string, StatDataset[]>();
    for (const d of datasets) g.set(d.category, [...(g.get(d.category) ?? []), d]);
    return [...g.entries()];
  }, [datasets]);
  const lastRefresh = datasets.map((d) => d.last_success_at).filter(Boolean).sort().pop();

  if (q.isLoading) return <p className="text-muted-foreground">Loading Eurostat figures…</p>;
  if (q.isError) return <p className="text-muted-foreground">Eurostat figures could not be loaded right now.</p>;
  if (!datasets.length) return null;

  return (
    <section className="space-y-6" aria-labelledby="eurostat-heading">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Globe2 className="h-4 w-4" /> Cyprus vs EU · Κύπρος έναντι ΕΕ</div>
        <h2 id="eurostat-heading" className="text-2xl font-serif font-bold">Household & cost-of-living indicators</h2>
        <p className="text-muted-foreground max-w-3xl text-sm">Official Eurostat figures for Cyprus, compared with the EU average for the same period. Checked daily; when Eurostat revises a past figure, it is reviewed before it changes here.</p>
      </div>

      {groups.map(([cat, list]) => (
        <div key={cat} className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">{CATEGORY_LABELS[cat] ?? cat}</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {list.map((d) => {
              const h = headline(d, obs);
              const flag = flagText(h.latest?.status_flag);
              const unitPts = d.unit_label.startsWith("%") ? " pts" : "";
              return (
                <Card key={d.id} className={`cursor-pointer transition-shadow hover:shadow-md ${selected?.id === d.id ? "ring-2 ring-secondary" : ""}`} onClick={() => setCode(d.code)}>
                  <CardContent className="p-4 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground leading-snug">{d.title_en}</p>
                    <p className="text-2xl font-semibold font-serif">{formatStat(h.latest?.value, d)}</p>
                    <p className="text-xs text-muted-foreground">{h.latest ? prettyStatPeriod(h.latest.period) : "—"} · {d.unit_label}{flag ? ` · ${flag}` : ""}</p>
                    {h.change != null && <p className="text-xs"><span className="font-medium">{h.change > 0 ? "+" : ""}{h.change.toFixed(d.decimals)}{unitPts}</span> <span className="text-muted-foreground">vs a year earlier</span></p>}
                    {h.benchmarks.map((b) => (
                      <p key={b.geo} className="text-xs text-muted-foreground">{GEO_LABELS[b.geo] ?? b.geo}: <span className="text-foreground">{b.obs ? formatStat(b.obs.value, d) : "not yet published"}</span></p>
                    ))}
                    <a href={databrowserUrl(d.dataset_code)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-[10px] text-muted-foreground underline">Eurostat {d.dataset_code} <ExternalLink className="h-2.5 w-2.5" /></a>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {selected && (
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between gap-3 space-y-0">
            <CardTitle className="text-base">{selected.title_en}{selected.title_el ? ` · ${selected.title_el}` : ""}</CardTitle>
            <Select value={selected.code} onValueChange={setCode}>
              <SelectTrigger className="w-64 h-9" aria-label="Choose indicator"><SelectValue /></SelectTrigger>
              <SelectContent>{datasets.map((d) => <SelectItem key={d.code} value={d.code}>{d.title_en}</SelectItem>)}</SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">{selected.description} Unit: {selected.unit_label}.</p>
            <div className="h-72" role="img" aria-label={`${selected.title_en}: Cyprus compared with ${selected.geos.filter((g) => g !== "CY").map((g) => GEO_LABELS[g] ?? g).join(" and ")}`}>
              <ResponsiveContainer>
                <LineChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="period" fontSize={11} minTickGap={24} /><YAxis fontSize={11} />
                  <RTooltip formatter={(v: number) => formatStat(v, selected)} /><Legend />
                  {selected.geos.map((g) => <Line key={g} dataKey={g} name={GEO_LABELS[g] ?? g} stroke={COLORS[g]} dot={false} strokeWidth={g === "CY" ? 2.5 : 1.5} connectNulls />)}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        Source: Eurostat (European Commission), reused under the Eurostat copyright and licence policy (CC BY 4.0).
        {lastRefresh && <> Last successful refresh {new Date(lastRefresh).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}.</>}
        {" "}Flags: estimate / provisional figures may still change. Periods not yet published are left out, never shown as zero.
      </p>
    </section>
  );
}
