import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EMPTY_STORY, STORY_VERTICALS, storyProblem, storyRow, type ManualStoryInput } from "@/lib/manualStory";

/** Editors write a story or paste a press release for the main news feed. */
export function NewStoryDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const [f, setF] = useState<ManualStoryInput>(EMPTY_STORY);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const set = (k: keyof ManualStoryInput) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const isPr = f.kind === "press_release";

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `articles/manual-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("banner-images").upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      setF((p) => ({ ...p, imageUrl: supabase.storage.from("banner-images").getPublicUrl(path).data.publicUrl }));
    } catch (e) { toast.error(e instanceof Error ? e.message : "Upload failed"); } finally { setUploading(false); }
  };

  const save = async (publishNow: boolean) => {
    const input = { ...f, publishNow };
    const problem = storyProblem(input);
    if (problem) return toast.error(problem);
    setBusy(true);
    try {
      const row = storyRow(input);
      if (row.canonical_url) {
        const { data: same } = await supabase.from("cna_articles").select("id, status").eq("canonical_url", row.canonical_url).maybeSingle();
        if (same) { toast.error(`A story with this original link already exists (${same.status}); edit that one instead.`); return; }
      }
      const { error } = await supabase.from("cna_articles").insert(row);
      if (error) throw error;
      toast.success(publishNow ? "Published — it is now live on the site" : "Saved as a draft in the Articles list");
      qc.invalidateQueries({ queryKey: ["editorial-articles"] });
      setF(EMPTY_STORY);
      onOpenChange(false);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not save"); } finally { setBusy(false); }
  };

  const sel = "w-full border rounded-md h-10 px-2 bg-background text-sm";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>New story or press release</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-1 border border-border rounded-lg p-1 w-fit">
            <Button size="sm" variant={!isPr ? "default" : "ghost"} onClick={() => setF({ ...f, kind: "story" })}>Story</Button>
            <Button size="sm" variant={isPr ? "default" : "ghost"} onClick={() => setF({ ...f, kind: "press_release" })}>Press release</Button>
          </div>
          {isPr && <p className="text-xs text-muted-foreground">Press releases are labelled “Press release” for readers, with the issuing company named at the top.</p>}
          <p className="text-xs text-muted-foreground">Write in English — the site is published in one language.</p>

          <label className="text-xs block">Headline<Input value={f.headline} onChange={set("headline")} /></label>
          <label className="text-xs block">Summary (one or two sentences, shown on cards)<Textarea rows={2} value={f.summary} onChange={set("summary")} /></label>
          <div className="grid md:grid-cols-2 gap-2">
            <label className="text-xs">Section<select className={sel} value={f.vertical} onChange={set("vertical")}>{STORY_VERTICALS.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}</select></label>
            <label className="text-xs">Topics (comma-separated)<Input placeholder="e.g. Banking, Investment" value={f.tags} onChange={set("tags")} /></label>
          </div>
          {isPr && (
            <div className="grid md:grid-cols-2 gap-2">
              <label className="text-xs">Issued by (company or organisation)<Input value={f.issuer} onChange={set("issuer")} /></label>
              <label className="text-xs">Press contact (optional)<Input placeholder="Name, email or phone" value={f.contact} onChange={set("contact")} /></label>
            </div>
          )}
          <label className="text-xs block">Original link (optional)<Input placeholder="https://…" value={f.sourceUrl} onChange={set("sourceUrl")} /></label>

          <label className="text-xs block">Story text (Markdown: **bold**, ## heading, - list)<Textarea rows={8} value={f.body} onChange={set("body")} /></label>

          <details className="border rounded-md p-2">
            <summary className="text-xs font-medium cursor-pointer">BusinessHub analysis (optional): What happened / Why it matters / What to do</summary>
            <div className="space-y-2 mt-2">
              <Textarea rows={2} placeholder="What happened" value={f.whatHappened} onChange={set("whatHappened")} />
              <Textarea rows={2} placeholder="Why it matters" value={f.whyItMatters} onChange={set("whyItMatters")} />
              <Textarea rows={2} placeholder="What to do" value={f.whatToDo} onChange={set("whatToDo")} />
            </div>
          </details>

          <div className="space-y-1">
            <span className="text-xs block">Cover picture (optional)</span>
            <div className="flex gap-2 items-center">
              <Input placeholder="Paste a picture link, or upload →" value={f.imageUrl} onChange={set("imageUrl")} />
              <label className="text-xs border rounded-md px-3 h-10 flex items-center cursor-pointer whitespace-nowrap hover:bg-muted">
                {uploading ? "Uploading…" : "Upload"}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
              </label>
            </div>
            {f.imageUrl && <img src={f.imageUrl} alt="" className="h-24 rounded-md object-cover" />}
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" disabled={busy || uploading} onClick={() => save(false)}>Save as draft</Button>
            <Button disabled={busy || uploading} onClick={() => save(true)}>{busy ? "Saving…" : "Publish now"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
