import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RefreshCw, Upload, Check, X, Undo2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const fmt = (d: string | null) => (d ? new Date(d).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—");

export function RealEstatePanel() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const sources = useQuery({ queryKey: ["re-admin-sources"], queryFn: async () => (await supabase.from("re_sources").select("*").order("dataset_type")).data ?? [] });
  const batches = useQuery({ queryKey: ["re-admin-batches"], queryFn: async () => (await supabase.from("re_import_batches").select("*").order("imported_at", { ascending: false }).limit(30)).data ?? [] });
  const revisions = useQuery({ queryKey: ["re-admin-revisions"], queryFn: async () => (await supabase.from("re_revisions").select("*").eq("status", "pending").order("period_date")).data ?? [] });

  const refresh = () => ["re-admin-sources", "re-admin-batches", "re-admin-revisions", "re-contracts", "re-transfers"].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));

  const call = async (body: Record<string, unknown>, ok: string) => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("ingest-real-estate", { body });
    setBusy(false);
    if (error || data?.error) { toast.error(data?.error ?? error?.message ?? "Failed"); return; }
    toast.success(ok);
    refresh();
    return data;
  };

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    const r = await call({ action: "upload", filename: f.name, csv: await f.text() }, "File imported");
    if (r) toast.message(`${r.added} new, ${r.unchanged} unchanged, ${r.revisions} changes for review, ${r.rejected} rejected`);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => call({ action: "check" }, "Official portal checked")} disabled={busy}>
          <RefreshCw className={`h-4 w-4 mr-1 ${busy ? "animate-spin" : ""}`} /> Check now
        </Button>
        <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={busy}><Upload className="h-4 w-4 mr-1" /> Upload CSV</Button>
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {(sources.data ?? []).map((s) => (
          <Card key={s.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between gap-2">
                {s.source_name_en}
                <Badge variant={s.status === "ok" ? "default" : s.status === "error" ? "destructive" : "secondary"}>{s.status}</Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">{s.source_name_el} · {s.publisher} · {s.licence}</p>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p>Latest month: <strong>{s.latest_reporting_period ?? "—"}</strong></p>
              <p>Last check: {fmt(s.last_checked_at)}</p>
              <p>Last successful import: {fmt(s.last_successful_import_at)}</p>
              <p>Next check: {fmt(s.next_check_at)}</p>
              <a href={s.official_dataset_url} target="_blank" rel="noopener noreferrer" className="text-xs underline">{s.official_dataset_url}</a>
              {s.last_error && <p className="text-xs text-destructive break-words">{s.last_error}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Changed historical figures awaiting approval ({revisions.data?.length ?? 0})</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {(revisions.data ?? []).length === 0 && <p className="text-muted-foreground">No pending changes. New months publish automatically.</p>}
          {(revisions.data ?? []).map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 border rounded p-2">
              <div>
                <p className="font-medium">{r.dataset_type === "sale_contracts" ? "Sale contracts" : "Transfers"} · {r.district_code} · {r.period_date.slice(0, 7)}</p>
                <p className="text-xs text-muted-foreground">Now: {JSON.stringify(r.previous_values)} → Official file: {JSON.stringify(r.replacement_values)}</p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" disabled={busy} onClick={() => call({ action: "approve_revision", id: r.id }, "Change approved")}><Check className="h-4 w-4" /></Button>
                <Button size="sm" variant="outline" disabled={busy} onClick={() => call({ action: "reject_revision", id: r.id }, "Change rejected")}><X className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Import history</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-left text-muted-foreground"><tr><th className="py-1">When</th><th>File</th><th>Rows</th><th>New</th><th>Unchanged</th><th>Changes</th><th>Rejected</th><th>Status</th><th /></tr></thead>
            <tbody>
              {(batches.data ?? []).map((b) => (
                <tr key={b.id} className="border-t">
                  <td className="py-1 whitespace-nowrap">{fmt(b.imported_at)}</td>
                  <td className="max-w-xs truncate" title={b.filename ?? ""}>{b.filename}</td>
                  <td>{b.total_rows}</td><td>{b.new_rows}</td><td>{b.unchanged_rows}</td><td>{b.changed_rows}</td>
                  <td title={JSON.stringify((b.validation_report as { rejected?: unknown })?.rejected ?? [])}>{b.rejected_rows}</td>
                  <td>{b.status}</td>
                  <td>
                    {b.status === "completed" && b.new_rows > 0 && (
                      <Button size="sm" variant="ghost" disabled={busy}
                        onClick={() => confirm("Remove the figures this import added?") && call({ action: "rollback_batch", id: b.id }, "Import undone")}>
                        <Undo2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
