import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDeadline } from "@/lib/funding";

type Tab = "review" | "changes" | "preview" | "sources" | "submit";

async function invoke(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("ingest-funding", { body });
  if (error) throw error;
  return data;
}

/** Editors' Funding tab: verify imported calls, approve changes, pick the 3 public previews, run sources, add a call by URL, link stories. */
export function FundingPanel() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("review");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState({ article: "", call: "" });

  const review = useQuery({ queryKey: ["fa-review"], enabled: tab === "review", queryFn: async () =>
    (await supabase.from("funding_calls").select("id,slug,title_en,issuer,call_reference,deadline_date,deadline_time,official_url,origin,summary_en,eligibility_summary").eq("status", "review").order("created_at", { ascending: false }).limit(100)).data ?? [] });
  const changes = useQuery({ queryKey: ["fa-changes"], enabled: tab === "changes", queryFn: async () =>
    (await supabase.from("funding_call_changes").select("*, funding_calls(title_en,call_reference,round)").eq("status", "pending").order("created_at", { ascending: false }).limit(100)).data ?? [] });
  const prev = useQuery({ queryKey: ["fa-preview"], enabled: tab === "preview", queryFn: async () =>
    (await supabase.from("funding_calls").select("id,title_en,issuer,deadline_date,deadline_time,is_preview").eq("status", "verified").eq("call_state", "open").order("is_preview", { ascending: false }).order("deadline_date").limit(200)).data ?? [] });
  const sources = useQuery({ queryKey: ["fa-sources"], enabled: tab === "sources", queryFn: async () =>
    (await supabase.from("funding_sources").select("*").order("status").order("name")).data ?? [] });

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("funding_calls").update({ status, ...(status === "verified" ? { last_verified_at: new Date().toISOString() } : {}) }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success(status === "verified" ? "Published to the catalogue" : "Updated"); qc.invalidateQueries({ queryKey: ["fa-review"] }); }
  };
  const togglePreview = async (id: string, on: boolean) => {
    const picked = (prev.data ?? []).filter((c) => c.is_preview).length;
    if (on && picked >= 3) return toast.error("Three previews already chosen: remove one first");
    await supabase.from("funding_calls").update({ is_preview: on }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["fa-preview"] });
  };
  const run = async (body: Record<string, unknown>, ok: string) => {
    setBusy(true);
    try { const d = await invoke(body); toast.success(ok); return d; } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };
  const linkStory = async () => {
    const { data: call } = await supabase.from("funding_calls").select("id").eq("slug", link.call.replace(/^.*\/funding\//, "").trim()).maybeSingle();
    const articleId = link.article.replace(/^.*\/article\//, "").trim();
    if (!call) return toast.error("Call not found: paste its /funding/… link");
    const { error } = await supabase.from("article_funding_links").insert({ article_id: articleId, call_id: call.id });
    if (error) toast.error(error.message); else { toast.success("Story linked to the call"); setLink({ article: "", call: "" }); }
  };

  const tabs: [Tab, string][] = [["review", "Review queue"], ["changes", "Changes to approve"], ["preview", "Public previews"], ["sources", "Sources"], ["submit", "Add call / link story"]];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">{tabs.map(([k, l]) => <Button key={k} size="sm" variant={tab === k ? "default" : "outline"} onClick={() => setTab(k)}>{l}</Button>)}</div>

      {tab === "review" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Nothing here is public. Check each call against its official documents, then publish, reject, or mark it not open to Cyprus applicants.</p>
          {(review.data ?? []).map((c) => (
            <div key={c.id} className="border border-border rounded-lg p-4 bg-card">
              <div className="flex flex-wrap gap-2 mb-1"><Badge variant="outline">{c.origin}</Badge>{c.call_reference && <Badge variant="outline">{c.call_reference}</Badge>}</div>
              <p className="font-semibold">{c.title_en}</p>
              <p className="text-sm text-muted-foreground">{c.issuer} · {formatDeadline(c.deadline_date, c.deadline_time, "en")}</p>
              {c.eligibility_summary && <p className="text-sm mt-1">{c.eligibility_summary}</p>}
              <a href={c.official_url} target="_blank" rel="noopener noreferrer" className="text-sm text-secondary hover:underline break-all">{c.official_url}</a>
              <div className="flex flex-wrap gap-2 mt-3">
                <Button size="sm" onClick={() => setStatus(c.id, "verified")}>Verify & publish</Button>
                <Button size="sm" variant="outline" onClick={() => setStatus(c.id, "ineligible")}>Not open to Cyprus</Button>
                <Button size="sm" variant="ghost" onClick={() => setStatus(c.id, "rejected")}>Reject</Button>
              </div>
            </div>
          ))}
          {review.data?.length === 0 && <p className="text-sm text-muted-foreground">The queue is empty.</p>}
        </div>
      )}

      {tab === "changes" && (
        <div className="space-y-3">
          {(changes.data ?? []).map((ch) => (
            <div key={ch.id} className="border border-border rounded-lg p-4 bg-card">
              <Badge>{ch.change_kind.replace(/_/g, " ")}</Badge>
              <p className="font-semibold mt-1">{ch.funding_calls?.title_en} {ch.funding_calls?.call_reference ? `(${ch.funding_calls.call_reference})` : ""}</p>
              <p className="text-sm">{ch.field ?? "notice"}: <span className="line-through text-muted-foreground">{ch.old_value ?? "—"}</span> → <strong>{ch.new_value ?? "—"}</strong></p>
              {ch.source_url && <a href={ch.source_url} target="_blank" rel="noopener noreferrer" className="text-sm text-secondary hover:underline break-all">{ch.source_url}</a>}
              <div className="flex gap-2 mt-3">
                <Button size="sm" disabled={busy} onClick={async () => { await run({ action: "apply_change", id: ch.id, accept: true }, "Change applied"); qc.invalidateQueries({ queryKey: ["fa-changes"] }); }}>Apply</Button>
                <Button size="sm" variant="ghost" disabled={busy} onClick={async () => { await run({ action: "apply_change", id: ch.id, accept: false }, "Dismissed"); qc.invalidateQueries({ queryKey: ["fa-changes"] }); }}>Dismiss</Button>
              </div>
            </div>
          ))}
          {changes.data?.length === 0 && <p className="text-sm text-muted-foreground">No changes waiting.</p>}
        </div>
      )}

      {tab === "preview" && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Signed-out visitors see these three. If fewer are picked, the soonest-closing verified calls fill the gaps.</p>
          {(prev.data ?? []).map((c) => (
            <label key={c.id} className="flex items-start gap-3 border border-border rounded p-3 bg-card">
              <input type="checkbox" checked={c.is_preview} onChange={(e) => togglePreview(c.id, e.target.checked)} className="mt-1" />
              <span><span className="font-medium">{c.title_en}</span><span className="block text-xs text-muted-foreground">{c.issuer} · {formatDeadline(c.deadline_date, c.deadline_time, "en")}</span></span>
            </label>
          ))}
        </div>
      )}

      {tab === "sources" && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left border-b border-border"><th className="py-2">Source</th><th>Method</th><th>Status</th><th>Last attempt</th><th>Last success</th><th>Found</th><th>Last error</th><th /></tr></thead>
            <tbody>
              {(sources.data ?? []).map((s) => (
                <tr key={s.id} className="border-b border-border align-top">
                  <td className="py-2"><a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{s.name}</a>{s.reused_from && <span className="block text-xs text-muted-foreground">reuses {s.reused_from}</span>}</td>
                  <td>{s.method}</td><td>{s.status}</td>
                  <td>{s.last_attempt_at ? new Date(s.last_attempt_at).toLocaleString("en-GB") : "—"}</td>
                  <td>{s.last_success_at ? new Date(s.last_success_at).toLocaleString("en-GB") : "—"}</td>
                  <td>{s.items_found}</td>
                  <td className="max-w-[260px] text-xs text-destructive">{s.last_error}</td>
                  <td>{s.method !== "manual" && <Button size="sm" variant="outline" disabled={busy} onClick={async () => { await run({ slug: s.slug, force: true }, "Run finished"); qc.invalidateQueries({ queryKey: ["fa-sources"] }); }}>Run now</Button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "submit" && (
        <div className="space-y-6 max-w-2xl">
          <div className="space-y-2">
            <p className="font-semibold">Add a call from its official page</p>
            <p className="text-sm text-muted-foreground">For sources that can't be collected automatically. The call is read from the page and lands in the review queue.</p>
            <div className="flex gap-2"><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://… official call page" />
              <Button disabled={busy || !url} onClick={async () => { const d = await run({ action: "submit_url", url }, "Read the page"); if (d) { toast.message(`Result: ${d.result ?? d.error}`); setUrl(""); } }}>Add</Button></div>
          </div>
          <div className="space-y-2">
            <p className="font-semibold">Link a story to a call</p>
            <Input value={link.article} onChange={(e) => setLink({ ...link, article: e.target.value })} placeholder="Story link (…/article/…)" />
            <Input value={link.call} onChange={(e) => setLink({ ...link, call: e.target.value })} placeholder="Funding call link (…/funding/…)" />
            <Button onClick={linkStory} disabled={!link.article || !link.call}>Link</Button>
          </div>
        </div>
      )}
    </div>
  );
}
