import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, RefreshCw, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { RealEstatePanel } from "@/components/admin/RealEstatePanel";

const fmt = (d: string | null) => (d ? new Date(d).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—");

export function OpenDataSourcesPanel() {
  const qc = useQueryClient();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const sources = useQuery({ queryKey: ["od-sources"], queryFn: async () => (await supabase.from("open_data_sources").select("*").order("module").order("title_en")).data ?? [] });
  const revisions = useQuery({ queryKey: ["tourism-revisions"], queryFn: async () => (await supabase.from("tourism_revisions").select("*").eq("status", "pending").order("period_date").limit(200)).data ?? [] });
  const refresh = () => ["od-sources", "tourism-revisions", "tourism-totals"].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));

  const invoke = async (fn: string, body: Record<string, unknown>, ok: string) => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke(fn, { body });
    setBusy(false);
    if (error || data?.error) { toast.error(data?.error ?? error?.message ?? "Failed"); return null; }
    toast.success(ok); refresh(); return data;
  };

  const toggle = async (id: string, enabled: boolean) => {
    const { error } = await supabase.from("open_data_sources").update({ enabled }).eq("id", id);
    if (error) toast.error(error.message); else refresh();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Add a data.gov.cy dataset</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Input className="max-w-md" placeholder="https://data.gov.cy/en/dataset/1007" value={url} onChange={(e) => setUrl(e.target.value)} />
          <Button disabled={busy || !url} onClick={async () => { const r = await invoke("discover-open-data", { url }, "Dataset read"); if (r) { toast.message(`${r.resources.length} files or links found`); setUrl(""); } }}>
            <Plus className="h-4 w-4 mr-1" /> Read dataset
          </Button>
          <p className="w-full text-xs text-muted-foreground">New datasets are listed switched off. Nothing is imported or shown publicly until an importer is built for them.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Official sources ({sources.data?.length ?? 0})</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-left text-muted-foreground"><tr><th className="py-1">Source</th><th>Area</th><th>Checked</th><th>Latest period</th><th>Last check</th><th>Status</th><th>Public</th><th /></tr></thead>
            <tbody>{(sources.data ?? []).map((s) => (
              <tr key={s.id} className="border-t align-top">
                <td className="py-1.5 max-w-xs">
                  <a href={s.portal_url ?? s.upstream_url ?? "#"} target="_blank" rel="noopener noreferrer" className="font-medium underline">{s.title_en}</a>
                  <p className="text-muted-foreground">{s.publisher}{s.format ? ` · ${s.format}` : ""}{s.licence ? ` · ${s.licence}` : ""}</p>
                  {Array.isArray(s.discovered_resources) && s.discovered_resources.length > 0 && s.module === "catalog" && (
                    <details><summary className="cursor-pointer text-muted-foreground">{s.discovered_resources.length} files</summary>
                      <ul>{(s.discovered_resources as { url: string; format: string }[]).map((r) => <li key={r.url} className="truncate"><a href={r.url} target="_blank" rel="noopener noreferrer" className="underline">{r.format}</a> {decodeURIComponent(r.url.split("/").pop() ?? "")}</li>)}</ul>
                    </details>
                  )}
                  {s.last_error && <p className="text-destructive break-words">{s.last_error}</p>}
                </td>
                <td>{s.module}</td><td>{s.check_frequency}</td><td>{s.latest_period ?? "—"}</td><td className="whitespace-nowrap">{fmt(s.last_checked_at)}</td>
                <td><Badge variant={s.status === "ok" ? "default" : s.status === "error" ? "destructive" : "secondary"}>{s.status}</Badge></td>
                <td><Switch checked={s.enabled} onCheckedChange={(v) => toggle(s.id, v)} aria-label="Show publicly" /></td>
                <td>{s.module === "tourism" && <Button size="sm" variant="ghost" disabled={busy} onClick={() => invoke("ingest-tourism", { action: "check" }, "Tourism data checked")}><RefreshCw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} /></Button>}</td>
              </tr>
            ))}</tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Tourism figures changed by CYSTAT, awaiting approval ({revisions.data?.length ?? 0})</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {(revisions.data ?? []).length === 0 && <p className="text-muted-foreground">No pending changes. New months publish automatically.</p>}
          {(revisions.data ?? []).map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-2 border rounded p-2">
              <span>{r.country_code} · {r.period_date.slice(0, 7)}: {r.previous_value?.toLocaleString()} → <strong>{r.replacement_value?.toLocaleString()}</strong></span>
              <span className="flex gap-1">
                <Button size="sm" disabled={busy} onClick={() => invoke("ingest-tourism", { action: "approve_revision", id: r.id }, "Approved")}><Check className="h-4 w-4" /></Button>
                <Button size="sm" variant="outline" disabled={busy} onClick={() => invoke("ingest-tourism", { action: "reject_revision", id: r.id }, "Rejected")}><X className="h-4 w-4" /></Button>
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <h3 className="font-semibold pt-2">Real Estate imports</h3>
      <RealEstatePanel />
    </div>
  );
}
