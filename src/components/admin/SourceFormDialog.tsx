import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  SOURCE_CATEGORIES, SOURCE_EDITIONS, SOURCE_INTERVALS, emptySourceForm, formFromSource,
  sourceFormProblem, sourceRow, sourceSlug, splitPageUrl, type SourceEdition, type SourceFormInput,
} from "@/lib/contentSource";
import { STORY_VERTICALS } from "@/lib/manualStory";
import { GR_SECTIONS } from "@/lib/edition";
import type { Database } from "@/integrations/supabase/types";

type Source = Database["public"]["Tables"]["content_sources"]["Row"];

const intervalLabel = (h: number) => (h === 168 ? "Once a week" : h === 24 ? "Once a day" : h === 48 ? "Every 2 days" : `Every ${h} hours`);

export function SourceFormDialog({
  open, onOpenChange, source, allSources, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  source: Source | null;          // null = new source
  allSources: Source[];
  onSaved?: (slug: string, collect: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<SourceFormInput>(emptySourceForm());
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof SourceFormInput>(k: K, v: SourceFormInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (open) setForm(source ? formFromSource(source) : emptySourceForm());
  }, [open, source]);

  const problem = sourceFormProblem(form, allSources, source?.id);
  const parts = splitPageUrl(form.pageUrl);

  const save = async () => {
    if (problem) { toast.error(problem); return; }
    setSaving(true);
    try {
      const row = sourceRow(form);
      if (source) {
        const { error } = await supabase.from("content_sources").update(row).eq("id", source.id);
        if (error) throw error;
        toast.success("Source updated");
        onSaved?.(source.slug, false);
      } else {
        const slug = sourceSlug(form.name, allSources.map((s) => s.slug), parts?.url.replace(/^https?:\/\//, ""));
        const { error } = await supabase.from("content_sources").insert({ ...row, slug });
        if (error) throw error;
        toast.success(row.access_status === "active" ? "Source added — it will be checked on the next run" : "Source saved — collection starts once reuse permission is confirmed");
        onSaved?.(slug, row.access_status === "active" && !!row.active);
      }
      queryClient.invalidateQueries({ queryKey: ["content-sources"] });
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">{source ? "Edit source" : "Add a news source"}</DialogTitle>
          <DialogDescription>
            Paste the page that lists the site's news or press releases. New stories found there are collected on each check.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="src-name">Name</Label>
            <Input id="src-name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Hellenic Bank — Press releases" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="src-url">News page address</Label>
            <Input id="src-url" value={form.pageUrl} onChange={(e) => set("pageUrl", e.target.value)} placeholder="https://www.example.com/en/news" />
            <p className="text-xs text-muted-foreground">Use the list page, not a single story. Write <code>{"{year}"}</code> where the address contains the current year.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Edition</Label>
              <Select value={form.edition} onValueChange={(v) => set("edition", v as SourceEdition)}>
                <SelectTrigger aria-label="Edition"><SelectValue /></SelectTrigger>
                <SelectContent>{SOURCE_EDITIONS.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {form.edition === "GR" ? (
              <div className="space-y-1.5">
                <Label>Greece section</Label>
                <Select value={form.grSection} onValueChange={(v) => set("grSection", v)}>
                  <SelectTrigger aria-label="Greece section"><SelectValue /></SelectTrigger>
                  <SelectContent>{GR_SECTIONS.map((s) => <SelectItem key={s.slug} value={s.slug}>{s.en}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>Type of source</Label>
                <Select value={form.category} onValueChange={(v) => set("category", v)}>
                  <SelectTrigger aria-label="Type of source"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SOURCE_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    {!SOURCE_CATEGORIES.some((c) => c.value === form.category) && <SelectItem value={form.category}>{form.category}</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {form.edition === "GR" && (
            <div className="space-y-1.5">
              <Label>Type of source</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger aria-label="Type of source (Greece)"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SOURCE_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  {!SOURCE_CATEGORIES.some((c) => c.value === form.category) && <SelectItem value={form.category}>{form.category}</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Main section for its stories</Label>
              <Select value={form.vertical} onValueChange={(v) => set("vertical", v as SourceFormInput["vertical"])}>
                <SelectTrigger aria-label="Main section"><SelectValue /></SelectTrigger>
                <SelectContent>{STORY_VERTICALS.map((v) => <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Check the page</Label>
              <Select value={String(form.intervalHours)} onValueChange={(v) => set("intervalHours", Number(v))}>
                <SelectTrigger aria-label="Check the page"><SelectValue /></SelectTrigger>
                <SelectContent>{SOURCE_INTERVALS.map((h) => <SelectItem key={h} value={String(h)}>{intervalLabel(h)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border border-border p-3 space-y-3 bg-muted/30">
            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <Checkbox checked={form.rightsConfirmed} onCheckedChange={(c) => { set("rightsConfirmed", !!c); if (!c) set("autoPublish", false); }} className="mt-0.5" aria-label="Reuse permission confirmed" />
              <span>
                <span className="font-medium">We may reuse this site's content</span>
                <span className="block text-xs text-muted-foreground">Official press releases, or written permission from the publisher. Without this the source is saved but nothing is collected.</span>
              </span>
            </label>
            <label className={`flex items-start gap-2 text-sm ${form.rightsConfirmed ? "cursor-pointer" : "opacity-50"}`}>
              <Checkbox checked={form.autoPublish} disabled={!form.rightsConfirmed} onCheckedChange={(c) => set("autoPublish", !!c)} className="mt-0.5" aria-label="Publish without review" />
              <span>
                <span className="font-medium">Publish stories without editor review</span>
                <span className="block text-xs text-muted-foreground">Off: new stories wait as drafts in the Articles tab.</span>
              </span>
            </label>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Collecting</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{form.active ? "On" : "Paused"}</span>
                <Switch checked={form.active} onCheckedChange={(c) => set("active", c)} aria-label="Collecting" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="src-notes">Notes (optional)</Label>
            <Textarea id="src-notes" rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Who gave permission, contact, anything editors should know" />
          </div>

          {problem && form.name && form.pageUrl && <p className="text-xs text-destructive">{problem}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving || !!problem} className="gap-1.5">
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {source ? "Save changes" : "Add source"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
