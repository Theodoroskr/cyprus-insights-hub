import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RefreshCw, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { GEO_LABELS, databrowserUrl, prettyStatPeriod } from "@/lib/eurostatView";

const fmt = (d: string | null) => (d ? new Date(d).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—");

/** Admin-only: Eurostat dataset settings, manual refresh, revisions awaiting approval and import history. */
export function EurostatAdminPanel() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const datasets = useQuery({ queryKey: ["stat-datasets-admin"], queryFn: async () => (await supabase.from("stat_datasets").select("*").order("sort_order")).data ?? [] });
  const revisions = useQuery({ queryKey: ["stat-revisions"], queryFn: async () => (await supabase.from("stat_revisions").select("*").eq("status", "pending").order("created_at").limit(500)).data ?? [] });
  const jobs = useQuery({ queryKey: ["stat-jobs"], queryFn: async () => (await supabase.from("stat_import_jobs").select("*").order("started_at", { ascending: false }).limit(15)).data ?? [] });
  const refresh = () => ["stat-datasets-admin", "stat-revisions", "stat-jobs", "eurostat-cyprus", "od-sources"].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
  const titleOf = (id: string) => datasets.data?.find((d) => d.id === id)?.title_en ?? id;

  const run = async (key: string, body: Record<string, unknown>, ok: string) => {
    setBusy(key);
    const { data, error } = await supabase.functions.invoke("ingest-eurostat", { body });
    setBusy(null);
    if (error || data?.error) { toast.error(data?.error ?? error?.message ?? "Failed"); return; }
    toast.success(data?.added != null ? `${ok}: ${data.added} new, ${data.revisions} revised` : ok);
    refresh();
  };
  const update = async (id: string, patch: { enabled?: boolean; refresh_hours?: number }) => {
    const { error } = await supabase.from("stat_datasets").update(patch).eq("id", id);
    if (error) toast.error(error.message); else refresh();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center justify-between gap-2">
          Eurostat datasets ({datasets.data?.length ?? 0})
          <Button size="sm" variant="outline" disabled={!!busy} onClick={() => run("all", { action: "check", force: true }, "Eurostat refreshed")}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${busy === "all" ? "animate-spin" : ""}`} /> Refresh all now
          </Button>
        </CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <p className="text-xs text-muted-foreground mb-2">Checked every day at 07:15 Cyprus time. A dataset is re-read only once its refresh interval has passed, and only new or changed figures are imported.</p>
          <table className="w-full text-xs">
            <thead><tr className="text-left text-muted-foreground border-b"><th className="py-1.5">Indicator</th><th>Dataset</th><th>Latest period</th><th>Eurostat updated</th><th>Last refresh</th><th>Status</th><th>Every (h)</th><th>On</th><th /></tr></thead>
            <tbody>
              {(datasets.data ?? []).map((d) => (
                <tr key={d.id} className="border-b align-top">
                  <td className="py-1.5 pr-2">{d.title_en}<p className="text-muted-foreground">{d.geos.map((g) => GEO_LABELS[g] ?? g).join(" · ")}</p></td>
                  <td><a className="underline" href={databrowserUrl(d.dataset_code)} target="_blank" rel="noopener noreferrer">{d.dataset_code}</a><p className="text-muted-foreground break-all">{Object.entries(d.filters as Record<string, string>).map(([k, v]) => `${k}=${v}`).join(", ")}</p></td>
                  <td>{d.latest_period ? prettyStatPeriod(d.latest_period) : "—"}</td>
                  <td>{fmt(d.source_updated_at)}</td>
                  <td>{fmt(d.last_success_at)}</td>
                  <td className="max-w-[14rem]"><Badge variant={d.status === "ok" ? "default" : d.status === "error" ? "destructive" : "secondary"}>{d.status}</Badge>{d.last_error && <p className="text-destructive mt-0.5">{d.last_error}</p>}</td>
                  <td><Input type="number" min={1} max={720} defaultValue={d.refresh_hours} className="h-7 w-16 text-xs" onBlur={(e) => { const n = Number(e.target.value); if (n >= 1 && n <= 720 && n !== d.refresh_hours) update(d.id, { refresh_hours: n }); }} /></td>
                  <td><Switch checked={d.enabled} onCheckedChange={(v) => update(d.id, { enabled: v })} aria-label={`Enable ${d.title_en}`} /></td>
                  <td><Button size="sm" variant="ghost" disabled={!!busy} onClick={() => run(d.code, { action: "check", code: d.code, force: true }, "Refreshed")} aria-label={`Refresh ${d.title_en}`}><RefreshCw className={`h-3.5 w-3.5 ${busy === d.code ? "animate-spin" : ""}`} /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Figures revised by Eurostat, awaiting approval ({revisions.data?.length ?? 0})</CardTitle>
          {(revisions.data ?? []).length > 1 && <Button size="sm" disabled={!!busy} onClick={() => run("approve", { action: "approve_all" }, "All revisions approved")}>Approve all</Button>}
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {(revisions.data ?? []).length === 0 && <p className="text-muted-foreground">No pending changes. New periods publish automatically.</p>}
          {(revisions.data ?? []).map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 border-b pb-2">
              <span>{titleOf(r.dataset_id)} · {GEO_LABELS[r.geo] ?? r.geo} · {prettyStatPeriod(r.period)}: <span className="text-muted-foreground line-through">{r.previous_value}{r.previous_flag ? ` (${r.previous_flag})` : ""}</span> → <strong>{r.replacement_value}{r.replacement_flag ? ` (${r.replacement_flag})` : ""}</strong></span>
              <span className="flex gap-1">
                <Button size="sm" disabled={!!busy} onClick={() => run(r.id, { action: "approve_revision", id: r.id }, "Approved")} aria-label="Approve"><Check className="h-4 w-4" /></Button>
                <Button size="sm" variant="outline" disabled={!!busy} onClick={() => run(r.id, { action: "reject_revision", id: r.id }, "Rejected")} aria-label="Reject"><X className="h-4 w-4" /></Button>
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Import history</CardTitle></CardHeader>
        <CardContent className="space-y-1 text-xs">
          {(jobs.data ?? []).map((j) => {
            const report = (j.report ?? {}) as { datasets?: Record<string, string> };
            const errors = Object.entries(report.datasets ?? {}).filter(([, v]) => v.startsWith("error"));
            return (
              <details key={j.id} className="border-b pb-1">
                <summary className="cursor-pointer flex flex-wrap gap-2 items-center">
                  <Badge variant={j.status === "completed" ? "default" : j.status === "failed" ? "destructive" : "secondary"}>{j.status}</Badge>
                  <span>{fmt(j.started_at)} · {j.trigger}</span>
                  <span className="text-muted-foreground">{j.datasets_checked} checked, {j.datasets_skipped} skipped · {j.new_rows} new · {j.changed_rows} revised · {j.rejected_rows} rejected{errors.length ? ` · ${errors.length} failed` : ""}</span>
                </summary>
                <ul className="pl-4 pt-1 text-muted-foreground">{Object.entries(report.datasets ?? {}).map(([k, v]) => <li key={k}>{k}: {v}</li>)}</ul>
              </details>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
