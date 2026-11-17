import { useState } from "react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EMPTY_STORY, STORY_EDITIONS, STORY_VERTICALS, storyProblem, storyRow, type ManualStoryInput } from "@/lib/manualStory";
import { ANALYSIS_LABELS, GR_SECTIONS } from "@/lib/edition";
import { videoEmbed, videoProblem } from "@/lib/videoEmbed";

/** Editors write a story or paste a press release for the Cyprus and/or Greece edition. */
export function NewStoryDialog({ open, onOpenChange, preset }: {
  open: boolean; onOpenChange: (o: boolean) => void; preset?: Partial<ManualStoryInput>;
}) {
  const qc = useQueryClient();
  const start = { ...EMPTY_STORY, ...preset };
  const [f, setF] = useState<ManualStoryInput>(start);
  const { data: orgs = [] } = useQuery({
    queryKey: ["organisations-gr"],
    enabled: open,
    queryFn: async () => {
      const { data } = await supabase.from("organisations").select("slug,name_el,name_en").order("name_en");
      return (data ?? []) as { slug: string; name_el: string | null; name_en: string | null }[];
    },
  });
  const en = f.edition !== "gr", gr = f.edition !== "cy";
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
      toast.success(publishNow ? (gr && !en ? "Published — it is now live on the Greece edition" : "Published — it is now live on the site") : "Saved as a draft in the Articles list");
      qc.invalidateQueries({ queryKey: ["editorial-articles"] });
      setF(start);
      onOpenChange(false);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not save"); } finally { setBusy(false); }
  };

  const sel = "w-full border rounded-md h-10 px-2 bg-background text-sm";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{gr && !en ? (isPr ? "Νέο δελτίο τύπου — Greece Edition" : "Νέο άρθρο — Greece Edition") : "New story or press release"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex gap-1 border border-border rounded-lg p-1 w-fit">
              <Button size="sm" variant={!isPr ? "default" : "ghost"} onClick={() => setF({ ...f, kind: "story" })}>Story</Button>
              <Button size="sm" variant={isPr ? "default" : "ghost"} onClick={() => setF({ ...f, kind: "press_release" })}>Press release</Button>
            </div>
            <select aria-label="Edition" className={`${sel} w-auto`} value={f.edition} onChange={(e) => setF({ ...f, edition: e.target.value as ManualStoryInput["edition"] })}>
              {STORY_EDITIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {isPr && <p className="text-xs text-muted-foreground">Press releases are labelled “Press release”{gr ? " / “Δελτίο Τύπου”" : ""} for readers, with the issuing company named at the top.</p>}

          {isPr && (
            <div className="grid md:grid-cols-2 gap-2">
              <label className="text-xs">Issued by (company or organisation){gr && " · Εκδότης"}<Input value={f.issuer} onChange={set("issuer")} /></label>
              <label className="text-xs">Press contact (optional){gr && " · Επικοινωνία"}<Input placeholder="Name, email or phone" value={f.contact} onChange={set("contact")} /></label>
            </div>
          )}

          {en && (
            <fieldset className="space-y-3 border rounded-md p-3">
              <legend className="text-xs font-semibold px-1">English — Cyprus Edition</legend>
              <label className="text-xs block">Headline<Input value={f.headline} onChange={set("headline")} /></label>
              <label className="text-xs block">Summary (one or two sentences, shown on cards)<Textarea rows={2} value={f.summary} onChange={set("summary")} /></label>
              <label className="text-xs block">Story text (Markdown: **bold**, ## heading, - list)<Textarea rows={8} value={f.body} onChange={set("body")} /></label>
              <details className="border rounded-md p-2">
                <summary className="text-xs font-medium cursor-pointer">BusinessHub analysis (optional): What happened / Why it matters / What to do</summary>
                <div className="space-y-2 mt-2">
                  <Textarea rows={2} placeholder="What happened" value={f.whatHappened} onChange={set("whatHappened")} />
                  <Textarea rows={2} placeholder="Why it matters" value={f.whyItMatters} onChange={set("whyItMatters")} />
                  <Textarea rows={2} placeholder="What to do" value={f.whatToDo} onChange={set("whatToDo")} />
                </div>
              </details>
            </fieldset>
          )}

          {gr && (
            <fieldset lang="el" className="space-y-3 border rounded-md p-3">
              <legend className="text-xs font-semibold px-1">Ελληνικά — Greece Edition</legend>
              <label className="text-xs block">Τίτλος<Input value={f.headlineEl} onChange={set("headlineEl")} /></label>
              <label className="text-xs block">Περίληψη (μία ή δύο προτάσεις)<Textarea rows={2} value={f.summaryEl} onChange={set("summaryEl")} /></label>
              <label className="text-xs block">Κείμενο (Markdown: **έντονα**, ## επικεφαλίδα, - λίστα)<Textarea rows={8} value={f.bodyEl} onChange={set("bodyEl")} /></label>
              <details className="border rounded-md p-2" open={!en}>
                <summary className="text-xs font-medium cursor-pointer">Ανάλυση BusinessHub (προαιρετικά): {ANALYSIS_LABELS.el.join(" / ")}</summary>
                <div className="space-y-2 mt-2">
                  <Textarea rows={2} placeholder={ANALYSIS_LABELS.el[0]} value={f.whatHappenedEl} onChange={set("whatHappenedEl")} />
                  <Textarea rows={2} placeholder={ANALYSIS_LABELS.el[1]} value={f.whyItMattersEl} onChange={set("whyItMattersEl")} />
                  <Textarea rows={2} placeholder={ANALYSIS_LABELS.el[2]} value={f.whatToDoEl} onChange={set("whatToDoEl")} />
                </div>
              </details>
              <div className="grid md:grid-cols-2 gap-2">
                <label className="text-xs">Ενότητα (Greece Edition section)<select className={sel} value={f.grSection} onChange={set("grSection")}>{GR_SECTIONS.map((s) => <option key={s.slug} value={s.slug}>{s.el}</option>)}</select></label>
                <label className="text-xs">Οργανισμός / τράπεζα (optional)<select className={sel} value={f.organisationSlug} onChange={set("organisationSlug")}>
                  <option value="">—</option>
                  {orgs.map((o) => <option key={o.slug} value={o.slug}>{o.name_el || o.name_en}</option>)}
                </select></label>
              </div>
              <label className="text-xs block">Σχέση Ελλάδας–Κύπρου (optional, one line)<Input value={f.crossBorderNote} onChange={set("crossBorderNote")} /></label>
            </fieldset>
          )}

          <div className="grid md:grid-cols-2 gap-2">
            <label className="text-xs">Section (Cyprus feed){!en && " — not shown in Cyprus"}<select className={sel} value={f.vertical} onChange={set("vertical")}>{STORY_VERTICALS.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}</select></label>
            <label className="text-xs">Topics (comma-separated)<Input placeholder="e.g. Banking, Investment" value={f.tags} onChange={set("tags")} /></label>
          </div>
          <label className="text-xs block">Original link (optional)<Input placeholder="https://…" value={f.sourceUrl} onChange={set("sourceUrl")} /></label>

          <div className="space-y-1">
            <span className="text-xs block">Cover picture / artwork (optional){gr && " · Εικόνα"}</span>
            <div className="flex gap-2 items-center">
              <Input placeholder="Paste a picture link, or upload →" value={f.imageUrl} onChange={set("imageUrl")} />
              <label className="text-xs border rounded-md px-3 h-10 flex items-center cursor-pointer whitespace-nowrap hover:bg-muted">
                {uploading ? "Uploading…" : "Upload"}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
              </label>
            </div>
            {f.imageUrl && <img src={f.imageUrl} alt="" className="h-24 rounded-md object-cover" />}
          </div>

          <label className="text-xs block">Video link (YouTube, optional)<Input placeholder="https://www.youtube.com/watch?v=…" value={f.videoUrl} onChange={set("videoUrl")} /></label>
          {videoProblem(f.videoUrl) && <p className="text-xs text-destructive">{videoProblem(f.videoUrl)}</p>}
          {videoEmbed(f.videoUrl) && <img src={videoEmbed(f.videoUrl)!.thumbUrl} alt="" className="h-24 rounded-md object-cover" />}

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" disabled={busy || uploading} onClick={() => save(false)}>Save as draft</Button>
            <Button disabled={busy || uploading} onClick={() => save(true)}>{busy ? "Saving…" : "Publish now"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
