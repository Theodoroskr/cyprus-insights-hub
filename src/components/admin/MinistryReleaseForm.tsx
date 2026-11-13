import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { headlineSimilarity, releaseDraft, releaseProblem, TOURISM_SOURCE_SLUG, TOURISM_TOPICS, type MinistryReleaseInput } from "@/lib/ministryRelease";

const EMPTY: MinistryReleaseInput = { url: "", sourceHeadline: "", sourceDate: "", topic: TOURISM_TOPICS[0], language: "en", headline: "", summary: "", whatChanged: "", whoAffected: "", action: "" };

/** Editors add a Ministry release by hand; it goes to the news queue as a draft for approval. */
export function MinistryReleaseForm() {
  const [f, setF] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof MinistryReleaseInput) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const submit = async () => {
    const problem = releaseProblem(f);
    if (problem) return toast.error(problem);
    setBusy(true);
    try {
      let { data: src } = await supabase.from("content_sources").select("id").eq("slug", TOURISM_SOURCE_SLUG).maybeSingle();
      if (!src) {
        const ins = await supabase.from("content_sources").insert({
          slug: TOURISM_SOURCE_SLUG, name: "Deputy Ministry of Tourism", url: "https://www.gov.cy", scrape_path: "/tourism/en/news/",
          category: "cyprus", target_vertical: "sme", trust_level: "trusted", access_status: "blocked", active: false, auto_publish: false,
          last_error: "Crawler test 13 Nov 2026: site returns a firewall JavaScript check instead of news. Scheduled import off; add releases manually.",
          last_error_at: new Date().toISOString(),
        }).select("id").single();
        src = ins.data;
      }
      const draft = releaseDraft(f, src?.id ?? null);
      const { data: same } = await supabase.from("cna_articles").select("id, status").eq("canonical_url", draft.canonical_url).maybeSingle();
      if (same) { toast.error(`This release is already in the queue (${same.status}); edit that story instead.`); return; }
      const { data: recent } = await supabase.from("cna_articles").select("title").eq("source_id", src?.id ?? "").order("created_at", { ascending: false }).limit(50);
      const near = (recent || []).find((r) => headlineSimilarity(r.title, f.headline) >= 0.6 || headlineSimilarity(r.title, f.sourceHeadline) >= 0.6);
      const { error } = await supabase.from("cna_articles").insert(near ? { ...draft, tags: [...draft.tags, "Possible duplicate"] } : draft);
      if (error) throw error;
      toast.success(near ? `Draft saved — flagged as a possible repeat of “${near.title}”` : "Draft saved to the news queue for approval");
      setF(EMPTY);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not save"); } finally { setBusy(false); }
  };

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
      <div>
        <h3 className="font-semibold">Add a Deputy Ministry of Tourism release</h3>
        <p className="text-xs text-muted-foreground">The Ministry's site blocks automatic collection, so add releases here. Copy names, figures, dates and eligibility terms exactly. Saved as a draft — publish it from the news queue.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-2">
        <Input placeholder="Original release link (gov.cy/tourism/…)" value={f.url} onChange={set("url")} />
        <Input placeholder="Ministry's headline" value={f.sourceHeadline} onChange={set("sourceHeadline")} />
        <label className="text-xs">Ministry announcement date<Input type="date" value={f.sourceDate} onChange={set("sourceDate")} /></label>
        <label className="text-xs">Topic<select className="w-full border rounded-md h-10 px-2 bg-background text-sm" value={f.topic} onChange={set("topic")}>{TOURISM_TOPICS.map((t) => <option key={t}>{t}</option>)}</select></label>
        <label className="text-xs">Release language<select className="w-full border rounded-md h-10 px-2 bg-background text-sm" value={f.language} onChange={set("language")}><option value="en">English</option><option value="el">Greek</option></select></label>
      </div>
      <Input placeholder="Our headline (in English)" value={f.headline} onChange={set("headline")} />
      <Textarea placeholder="Summary" value={f.summary} onChange={set("summary")} />
      <Textarea placeholder="What changed" value={f.whatChanged} onChange={set("whatChanged")} />
      <Textarea placeholder="Who is affected" value={f.whoAffected} onChange={set("whoAffected")} />
      <Textarea placeholder="Confirmed deadline or action" value={f.action} onChange={set("action")} />
      <Button onClick={submit} disabled={busy}>{busy ? "Saving…" : "Save as draft"}</Button>
    </div>
  );
}
