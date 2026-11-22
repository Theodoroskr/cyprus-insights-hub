import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { SOURCE_STATUS_LABEL } from "@/lib/integrityHealth";

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
  const { data: sources } = useQuery({
    queryKey: ["integrity-admin", "sources"],
    queryFn: async () => (await supabase.functions.invoke("ingest-integrity", { body: { action: "sources" } })).data?.sources ?? [],
  });
  const [edit, setEdit] = useState<{ slug: string; url: string } | null>(null);
  const testUrl = async () => {
    if (!edit) return;
    setBusy("url");
    const { data: r } = await supabase.functions.invoke("ingest-integrity", { body: { action: "test", slug: edit.slug, url: edit.url } });
    const res = r?.results?.[0];
    if (!res?.ok) { setBusy(null); toast.error(`Not saved: ${res?.error ?? "test failed"}`); return; }
    await supabase.functions.invoke("ingest-integrity", { body: { action: "set-source", slug: edit.slug, url: edit.url } });
    setBusy(null); setEdit(null); toast.success(`Saved — address works (${res.found} items found)`);
    call(`t-${edit.slug}`, { action: "test", slug: edit.slug });
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

        <div><h3 className="font-semibold mb-2">Source health</h3>
          <div className="overflow-x-auto"><table className="w-full text-xs">
            <thead><tr className="text-left text-muted-foreground"><th className="py-1 pr-2">Source</th><th className="pr-2">Status</th><th className="pr-2">Last success</th><th className="pr-2">Last attempt</th><th className="pr-2">Fails in a row</th><th className="pr-2">Items</th><th></th></tr></thead>
            <tbody>{(sources ?? []).map((s: any) => {
              const st = SOURCE_STATUS_LABEL[s.manual_only ? "manual" : (s.last_status ?? "unknown")] ?? SOURCE_STATUS_LABEL.unknown;
              return (<tr key={s.slug} className="border-t align-top">
                <td className="py-2 pr-2"><div className="font-medium">{s.publisher}</div>
                  {edit?.slug === s.slug
                    ? <div className="flex gap-1 mt-1"><Input className="h-7 text-xs" value={edit.url} onChange={(e) => setEdit({ ...edit, url: e.target.value })} /><Button size="sm" className="h-7" disabled={busy === "url"} onClick={testUrl}>{busy === "url" ? "Testing…" : "Test & save"}</Button><Button size="sm" variant="ghost" className="h-7" onClick={() => setEdit(null)}>Cancel</Button></div>
                    : <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:underline break-all">{s.url}</a>}
                  {s.last_error && <div className="text-destructive">{s.last_error}</div>}</td>
                <td className="pr-2"><Badge variant={st.variant}>{st.label}</Badge></td>
                <td className="pr-2">{s.last_success_at ? new Date(s.last_success_at).toLocaleString("en-GB") : "Never"}</td>
                <td className="pr-2">{s.last_attempt_at ? new Date(s.last_attempt_at).toLocaleString("en-GB") : "—"}</td>
                <td className="pr-2">{s.consecutive_failures ?? 0}</td>
                <td className="pr-2">{s.last_found ?? "—"}</td>
                <td className="whitespace-nowrap space-x-1">
                  <Button size="sm" variant="outline" className="h-7" disabled={!!busy} onClick={() => call(`t-${s.slug}`, { action: "test", slug: s.slug })}>{busy === `t-${s.slug}` ? "Testing…" : "Test now"}</Button>
                  {s.slug !== "ti-cpi" && <Button size="sm" variant="ghost" className="h-7" onClick={() => setEdit({ slug: s.slug, url: s.url })}>Edit address</Button>}
                  <Button size="sm" variant="ghost" className="h-7" disabled={!!busy} onClick={() => call(`m-${s.slug}`, { action: "set-source", slug: s.slug, manual_only: !s.manual_only })}>{s.manual_only ? "Resume auto" : "Manual check"}</Button>
                </td></tr>);
            })}</tbody></table></div>
          <p className="text-muted-foreground mt-1">Blocked sites refuse automated reading; mark them "Manual check" and open the link yourself. Admins get one alert when a source stops or starts working.</p>
        </div>

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
