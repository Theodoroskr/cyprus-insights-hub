import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLink, FileSpreadsheet, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type PreviewRow = { period: string; value: number; provisional: boolean; status: "new" | "changed" | "flag" | "unchanged"; previous: number | null };
type Preview = { frequency: "Q" | "M"; notes: string[]; rows: PreviewRow[]; new: number; changed: number; unchanged: number };

const DATASET_PAGE = "https://data.gov.gr/en/dataset/bank-of-greece-number-of-inbound-travellers-in-greece-by-country-of-origin";
const BOG_PAGE = "https://www.bankofgreece.gr/en/statistics/external-sector/balance-of-payments/travel-services";

async function toBase64(file: File): Promise<string> {
  const buf = new Uint8Array(await file.arrayBuffer());
  let s = "";
  for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return btoa(s);
}

/** Admin upload of the official Bank of Greece inbound-travellers file: preview first, publish only after confirming. */
export function BogTravelUploadCard() {
  const qc = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<{ name: string; b64: string } | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);

  const latest = useQuery({
    queryKey: ["bog-latest-file"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("import-bog-travel", { body: { action: "latest" } });
      if (error || data?.error) throw new Error(data?.error ?? error?.message);
      return data.latest as { name: string; url: string; reference_date: string } | null;
    },
    staleTime: 3_600_000,
  });
  const stored = useQuery({
    queryKey: ["bog-travellers-latest"],
    queryFn: async () => {
      const { data } = await supabase.from("stat_datasets").select("latest_period, last_success_at").eq("code", "gr_travellers").maybeSingle();
      return data;
    },
  });

  const send = async (action: "preview" | "import", f = file) => {
    if (!f) return null;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("import-bog-travel", { body: { action, file_name: f.name, file_base64: f.b64 } });
    setBusy(false);
    if (error || data?.error) {
      let msg = data?.error ?? error?.message ?? "Failed";
      try { const ctx = (error as { context?: Response })?.context; if (ctx) msg = (await ctx.json()).error ?? msg; } catch { /* keep message */ }
      toast.error(msg); return null;
    }
    return data as Preview & { imported?: boolean };
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2"><FileSpreadsheet className="h-4 w-4" /> Bank of Greece: inbound travellers file</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          {stored.data?.latest_period ? <Badge>On the site: up to {stored.data.latest_period}</Badge> : <Badge variant="secondary">Nothing imported yet</Badge>}
          {latest.data && <Badge variant="outline">Newest file listed: {latest.data.reference_date}</Badge>}
          {latest.error && <span className="text-xs text-muted-foreground">Could not check data.gov.gr right now.</span>}
        </div>
        <p className="text-xs text-muted-foreground">
          The bank blocks automatic downloads, so download the English "Number of inbound travellers in Greece by country of origin" .xlsx in your browser
          (<a className="underline inline-flex items-center gap-0.5" href={latest.data?.url ?? BOG_PAGE} target="_blank" rel="noopener noreferrer">{latest.data ? latest.data.name : "Bank of Greece page"}<ExternalLink className="h-3 w-3" /></a>,
          {" "}also listed on <a className="underline inline-flex items-center gap-0.5" href={DATASET_PAGE} target="_blank" rel="noopener noreferrer">data.gov.gr<ExternalLink className="h-3 w-3" /></a>), then upload it here.
          Only the all-countries Total line is read. You see every figure before anything is published.
        </p>
        <div className="flex flex-wrap gap-2">
          <input ref={input} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" aria-label="Bank of Greece travellers file"
            onChange={async (e) => {
              const f = e.target.files?.[0]; e.target.value = "";
              if (!f) return;
              const next = { name: f.name, b64: await toBase64(f) };
              setFile(next); setPreview(null);
              const r = await send("preview", next);
              if (r) setPreview(r);
            }} />
          <Button type="button" variant="outline" disabled={busy} onClick={() => input.current?.click()}><Upload className="h-4 w-4 mr-1" /> {busy && !preview ? "Reading…" : "Choose file and preview"}</Button>
          {preview && (
            <Button type="button" disabled={busy || (preview.new === 0 && preview.changed === 0)} onClick={async () => {
              const r = await send("import");
              if (!r) return;
              toast.success(`${r.new} new period(s) published${r.changed ? `, ${r.changed} changed figure(s) sent for approval under Eurostat statistics` : ""}.`);
              setPreview(null); setFile(null);
              ["bog-travellers-latest", "od-sources", "stat-revisions", "stat-series"].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
            }}>Publish {preview.new} new{preview.changed ? ` + send ${preview.changed} changes for approval` : ""}</Button>
          )}
        </div>
        {preview && (
          <div className="space-y-2">
            <p className="text-xs"><span className="font-medium">{file?.name}</span> · {preview.frequency === "Q" ? "quarterly" : "monthly"} · {preview.new} new, {preview.changed} changed, {preview.unchanged} unchanged · thousand travellers</p>
            {preview.notes.map((n) => <p key={n} className="text-xs text-muted-foreground">{n}</p>)}
            <div className="max-h-64 overflow-auto border border-border rounded-md">
              <table className="w-full text-xs">
                <thead className="bg-muted sticky top-0"><tr><th className="text-left p-1.5">Period</th><th className="text-right p-1.5">Total (thousand)</th><th className="text-left p-1.5">Status</th></tr></thead>
                <tbody>{[...preview.rows].reverse().map((r) => (
                  <tr key={r.period} className="border-t border-border">
                    <td className="p-1.5">{r.period}{r.provisional ? " (provisional)" : ""}</td>
                    <td className="p-1.5 text-right tabular-nums">{r.value.toLocaleString("en-GB")}</td>
                    <td className="p-1.5">{r.status === "changed" ? `changed (was ${r.previous?.toLocaleString("en-GB")})` : r.status}</td>
                  </tr>))}</tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
