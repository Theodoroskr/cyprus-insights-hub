import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, KeyRound, PlugZap, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Status = { configured: boolean; saved_at: string | null; last_checked_at: string | null; last_ok: boolean | null; last_error: string | null };
type TestResult = { ok: boolean; rejected: boolean; message: string };

const fmt = (d: string | null) => (d ? new Date(d).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—");

/** Admin setting for the GEMI Open Data access key. The key is write-only: it is never shown again after saving. */
export function GemiAccessCard() {
  const qc = useQueryClient();
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const status = useQuery({
    queryKey: ["gemi-status"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("gemi-connection", { body: { action: "status" } });
      if (error || data?.error) throw new Error(data?.error ?? error?.message);
      return data as Status;
    },
  });

  const call = async (body: Record<string, unknown>) => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("gemi-connection", { body });
    setBusy(false);
    qc.invalidateQueries({ queryKey: ["gemi-status"] });
    qc.invalidateQueries({ queryKey: ["od-sources"] });
    if (error || data?.error) { toast.error(data?.error ?? error?.message ?? "Failed"); return null; }
    return data as Status & { saved?: boolean; test?: TestResult };
  };

  const report = (t?: TestResult) => { if (t) (t.ok ? toast.success : toast.error)(t.message); };

  const s = status.data;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2"><KeyRound className="h-4 w-4" /> GEMI access key (Greek business register)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          {status.isLoading ? <span className="text-muted-foreground">Checking…</span> : s?.configured
            ? <Badge>Key saved {fmt(s.saved_at)}</Badge>
            : <Badge variant="secondary">No key saved</Badge>}
          {s?.last_checked_at && (
            <Badge variant={s.last_ok ? "outline" : "destructive"}>{s.last_ok ? "Last test passed" : "Last test failed"} · {fmt(s.last_checked_at)}</Badge>
          )}
          {status.error && <span className="text-destructive">{(status.error as Error).message}</span>}
        </div>
        {s?.last_ok === false && s.last_error && <p className="text-destructive">{s.last_error}</p>}

        <form
          className="flex flex-wrap gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const r = await call({ action: "save", key });
            if (!r) return;
            if (r.saved) { setKey(""); toast.success("Key saved"); } else toast.error("Key not saved");
            report(r.test);
          }}
        >
          <Input
            className="max-w-md" type="password" autoComplete="off" spellCheck={false}
            placeholder={s?.configured ? "Paste a new key to replace the saved one" : "Paste your GEMI api_key"}
            value={key} onChange={(e) => setKey(e.target.value)} aria-label="GEMI access key"
          />
          <Button type="submit" disabled={busy || key.trim().length < 8}>Save &amp; test</Button>
          <Button type="button" variant="outline" disabled={busy || !s?.configured} onClick={async () => { const r = await call({ action: "test" }); if (r) report(r.test); }}>
            <PlugZap className="h-4 w-4 mr-1" /> Test connection
          </Button>
          <Button type="button" variant="secondary" disabled={busy || !s?.configured} onClick={async () => {
            setBusy(true);
            const { data, error } = await supabase.functions.invoke("ingest-gemi", { body: {} });
            setBusy(false);
            qc.invalidateQueries({ queryKey: ["gemi-status"] }); qc.invalidateQueries({ queryKey: ["od-sources"] }); qc.invalidateQueries({ queryKey: ["stat-revisions"] });
            if (error || !data?.ok) { toast.error(data?.error ?? error?.message ?? "Import failed"); return; }
            const n = data.new_registrations ?? {};
            toast.success(`Active businesses: ${data.active?.value?.toLocaleString("en-GB") ?? "—"}. New-registration months added: ${n.added ?? 0}${n.revisions ? `, ${n.revisions} changed figure(s) sent for approval` : ""}.`);
            if (n.next) toast.message("More months are still being counted in the background; refresh in a few minutes.");
          }}>
            <Download className="h-4 w-4 mr-1" /> Import now
          </Button>
          {s?.configured && (
            <Button type="button" variant="ghost" disabled={busy} onClick={async () => { if (!confirm("Remove the saved GEMI key?")) return; if (await call({ action: "remove" })) toast.success("Key removed"); }}>
              <Trash2 className="h-4 w-4 mr-1" /> Remove
            </Button>
          )}
        </form>
        <p className="text-xs text-muted-foreground">
          The key is stored on the server and is never shown again, not even to admins. A key GEMI rejects is not saved.
          The test makes one read-only call (list of legal forms). "Import now" tests the key again, then counts active businesses and new registrations per month since January 2024 for Greece Business Pulse; it also runs every morning. Changed past figures wait for approval under Eurostat statistics.
        </p>
      </CardContent>
    </Card>
  );
}
