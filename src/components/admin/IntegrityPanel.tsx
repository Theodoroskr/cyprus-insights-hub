import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

/** Staff-only controls for the Corruption & Public Integrity section. */
export function IntegrityPanel() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const { data } = useQuery({
    queryKey: ["integrity-admin"],
    queryFn: async () => {
      const [runs, ups, staged] = await Promise.all([
        supabase.from("integrity_check_runs").select("*").order("started_at", { ascending: false }).limit(8),
        supabase.from("integrity_source_updates").select("*").eq("status", "pending").order("created_at", { ascending: false }).limit(40),
        supabase.from("cpi_results").select("edition_year,country_iso3,country_name,score,rank,rank_tied").eq("status", "staged").limit(500),
      ]);
      return { runs: runs.data ?? [], updates: ups.data ?? [], staged: staged.data ?? [] };
    },
  });
  const call = async (key: string, body: Record<string, unknown>) => {
    setBusy(key);
    const { data: r, error } = await supabase.functions.invoke("ingest-integrity", { body });
    setBusy(null);
    if (error || r?.error) toast.error(r?.error ?? error?.message ?? "Failed");
    else toast.success(r?.status ? `Check finished: ${r.status}` : "Done");
    qc.invalidateQueries({ queryKey: ["integrity-admin"] });
  };
  const stagedYears = [...new Set((data?.staged ?? []).map((s: any) => s.edition_year))];

  return (
    <Card className="mt-6">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="font-serif">Integrity data (Corruption Perceptions)</CardTitle>
        <Button size="sm" disabled={busy === "check"} onClick={() => call("check", { action: "check" })}>{busy === "check" ? "Checking…" : "Check sources now"}</Button>
      </CardHeader>
      <CardContent className="space-y-6 text-sm">
        <p className="text-muted-foreground">Checked automatically every Monday at 09:00 Cyprus time. Public figures only change when you publish a staged edition.</p>

        <div><h3 className="font-semibold mb-2">Staged CPI editions</h3>
          {stagedYears.length === 0 && <p className="text-muted-foreground">Nothing staged.</p>}
          {stagedYears.map((y) => {
            const rows = (data?.staged ?? []).filter((s: any) => s.edition_year === y);
            return (<div key={y} className="border rounded p-3 space-y-2">
              <p className="font-medium">CPI {y} — {rows.length} countries staged</p>
              <ul className="max-h-40 overflow-auto text-xs">{rows.slice(0, 50).map((r: any) => <li key={r.country_iso3}>{r.country_name}: {r.score ?? "Unavailable"} · {r.rank_tied ? "=" : ""}{r.rank ?? "—"}</li>)}</ul>
              <Button size="sm" disabled={!!busy} onClick={() => call(`pub-${y}`, { action: "publish-cpi", year: y })}>Publish CPI {y}</Button>
            </div>);
          })}
        </div>

        <div><h3 className="font-semibold mb-2">Pending official developments</h3>
          {(data?.updates ?? []).length === 0 && <p className="text-muted-foreground">None pending.</p>}
          <ul className="space-y-2">{(data?.updates ?? []).map((u: any) => (
            <li key={u.id} className="border rounded p-2 space-y-1">
              <div className="flex flex-wrap gap-1"><Badge variant="secondary">{u.claim_status}</Badge>{u.audience.map((a: string) => <Badge key={a} variant="outline">{a}</Badge>)}</div>
              <a href={u.canonical_url} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">{u.title}</a>
              <p className="text-xs text-muted-foreground">{u.publisher} · published {u.published_at ?? "unavailable"} · checked {String(u.checked_at).slice(0, 10)}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={!!busy} onClick={() => call(u.id, { action: "approve-update", id: u.id })}>Create drafts</Button>
                <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => call(u.id, { action: "dismiss-update", id: u.id })}>Dismiss</Button>
              </div>
            </li>))}</ul>
        </div>

        <div><h3 className="font-semibold mb-2">Recent checks</h3>
          <ul className="space-y-1">{(data?.runs ?? []).map((r: any) => (
            <li key={r.id} className="flex items-center gap-2">
              <Badge variant={r.status === "ok" ? "default" : r.status === "running" ? "secondary" : "destructive"}>{r.status}</Badge>
              <span>{new Date(r.started_at).toLocaleString("en-GB")} ({r.trigger})</span>
              {r.error && <span className="text-xs text-destructive truncate max-w-md" title={r.error}>{r.error}</span>}
              {r.status !== "ok" && r.status !== "running" && <Button size="sm" variant="outline" disabled={!!busy} onClick={() => call("check", { action: "check" })}>Retry</Button>}
            </li>))}</ul>
        </div>
      </CardContent>
    </Card>
  );
}
