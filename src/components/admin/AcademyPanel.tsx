import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, History, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ACADEMY_SEED } from "@/lib/academySeed";
import type { AcademyStatus, Lesson, Programme } from "@/lib/academy";

const STATUSES: AcademyStatus[] = ["draft", "review", "published", "archived"];
const CALCS = ["none", "budget", "goal", "compound", "loan", "inflation", "emergency"];
const statusVariant = (s: string) => (s === "published" ? "default" : s === "review" ? "secondary" : "outline") as "default" | "secondary" | "outline";

export function AcademyPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [showRev, setShowRev] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const q = useQuery({
    queryKey: ["admin-academy"],
    queryFn: async () => {
      const [p, l] = await Promise.all([
        supabase.from("academy_programmes").select("*").order("sort_order"),
        supabase.from("academy_lessons").select("*").order("sort_order"),
      ]);
      if (p.error) throw p.error; if (l.error) throw l.error;
      return { programmes: (p.data ?? []) as Programme[], lessons: (l.data ?? []) as Lesson[] };
    },
  });
  const revs = useQuery({
    queryKey: ["admin-academy-rev", showRev], enabled: !!showRev,
    queryFn: async () => {
      const { data, error } = await supabase.from("academy_lesson_revisions").select("id, created_at, snapshot").eq("lesson_id", showRev!).order("created_at", { ascending: false }).limit(20);
      if (error) throw error; return data ?? [];
    },
  });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-academy"] }); qc.invalidateQueries({ queryKey: ["academy-public"] }); };

  const importSeed = async () => {
    setBusy(true);
    try {
      for (const [pi, sp] of ACADEMY_SEED.entries()) {
        const { lessons, ...prog } = sp;
        const { data: p, error } = await supabase.from("academy_programmes").upsert({ ...prog, sort_order: pi, status: "draft" }, { onConflict: "slug", ignoreDuplicates: true }).select("id").maybeSingle();
        if (error) throw error;
        const pid = p?.id ?? (await supabase.from("academy_programmes").select("id").eq("slug", sp.slug).single()).data?.id;
        if (!pid) continue;
        const rows = lessons.map((l, i) => ({ programme_id: pid, slug: l.slug, title_en: l.title_en, title_el: l.title_el, summary_en: l.summary_en, summary_el: l.summary_el, body_en: l.body_en,
          minutes: l.minutes, level: l.level ?? sp.level, calculator: l.calculator ?? null, stat_codes: l.stat_codes ?? [], sort_order: i, status: "draft", updated_by: user?.id }));
        const { error: e } = await supabase.from("academy_lessons").upsert(rows, { onConflict: "programme_id,slug", ignoreDuplicates: true });
        if (e) throw e;
      }
      toast({ title: "Starter drafts loaded", description: "Existing lessons were left untouched." });
      refresh();
    } catch (e) { toast({ title: "Could not load drafts", description: String((e as Error).message), variant: "destructive" }); }
    setBusy(false);
  };

  const setProgStatus = async (id: string, status: AcademyStatus) => {
    const { error } = await supabase.from("academy_programmes").update({ status }).eq("id", id);
    if (error) toast({ title: "Not saved", description: error.message, variant: "destructive" }); refresh();
  };
  const setLessonStatus = async (id: string, status: AcademyStatus) => {
    const { error } = await supabase.from("academy_lessons").update({ status, updated_by: user?.id }).eq("id", id);
    if (error) toast({ title: "Not saved", description: error.message, variant: "destructive" }); refresh();
  };
  const publishAllReviewed = async (pid: string) => {
    const { error } = await supabase.from("academy_lessons").update({ status: "published", updated_by: user?.id }).eq("programme_id", pid).eq("status", "review");
    if (error) toast({ title: "Not saved", description: error.message, variant: "destructive" }); refresh();
  };
  const saveLesson = async () => {
    if (!editing) return;
    const { id, programme_id: _p, updated_at: _u, ...rest } = editing;
    const { error } = await supabase.from("academy_lessons").update({ ...rest, calculator: rest.calculator === "none" ? null : rest.calculator, publish_at: rest.publish_at || null, updated_by: user?.id }).eq("id", id);
    if (error) { toast({ title: "Not saved", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Lesson saved" }); setEditing(null); refresh();
  };
  const set = <K extends keyof Lesson>(k: K, v: Lesson[K]) => setEditing((e) => (e ? { ...e, [k]: v } : e));

  const programmes = q.data?.programmes ?? [];
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <div><CardTitle className="text-lg">Financial Literacy Academy</CardTitle>
            <p className="text-sm text-muted-foreground">Visitors only see programmes and lessons marked Published (and past their publish date). Move each lesson Draft → Review → Published once checked.</p></div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild><a href="/financial-literacy/academy" target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4 mr-1" />View Academy</a></Button>
            <Button size="sm" onClick={importSeed} disabled={busy}><Upload className="h-4 w-4 mr-1" />{busy ? "Loading…" : "Load starter drafts"}</Button>
          </div>
        </CardHeader>
        {!programmes.length && !q.isLoading && <CardContent className="text-sm text-muted-foreground">No programmes yet. "Load starter drafts" adds 5 programmes and 37 lessons written by BusinessHub, all as drafts.</CardContent>}
      </Card>

      {programmes.map((p) => {
        const ls = (q.data?.lessons ?? []).filter((l) => l.programme_id === p.id);
        const counts = STATUSES.map((s) => [s, ls.filter((l) => l.status === s).length] as const).filter(([, n]) => n);
        return (
          <Card key={p.id}>
            <CardHeader className="pb-2 flex flex-row flex-wrap items-center gap-3">
              <span className="h-8 w-8 rounded bg-primary text-primary-foreground grid place-items-center font-bold">{p.code}</span>
              <div className="flex-1 min-w-[200px]"><p className="font-semibold">{p.title_en}</p><p className="text-xs text-muted-foreground">{p.title_el} · {counts.map(([s, n]) => `${n} ${s}`).join(" · ")}</p></div>
              <Select value={p.status} onValueChange={(v) => setProgStatus(p.id, v as AcademyStatus)}><SelectTrigger className="w-52 h-8"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>Programme: {s}</SelectItem>)}</SelectContent></Select>
              <Button size="sm" variant="outline" onClick={() => publishAllReviewed(p.id)} disabled={!ls.some((l) => l.status === "review")}>Publish reviewed lessons</Button>
              <Button size="sm" variant="ghost" asChild><a href={`/financial-literacy/academy/${p.slug}`} target="_blank" rel="noreferrer">Preview</a></Button>
            </CardHeader>
            <CardContent className="divide-y">
              {ls.map((l) => (
                <div key={l.id} className="py-2 space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge variant={statusVariant(l.status)}>{l.status}</Badge>
                    {!l.body_el.trim() && <Badge variant="outline">Greek text missing</Badge>}
                    {l.publish_at && new Date(l.publish_at) > new Date() && <Badge variant="secondary">Scheduled {new Date(l.publish_at).toLocaleDateString("en-GB")}</Badge>}
                    <span className="flex-1">{l.title_en}</span>
                    <Select value={l.status} onValueChange={(v) => setLessonStatus(l.id, v as AcademyStatus)}><SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                    <Button size="sm" variant="outline" onClick={() => setEditing(editing?.id === l.id ? null : { ...l, calculator: l.calculator ?? "none", publish_at: l.publish_at ? l.publish_at.slice(0, 16) : null })}>{editing?.id === l.id ? "Close" : "Edit"}</Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowRev(showRev === l.id ? null : l.id)} aria-label="Revision history"><History className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" asChild><a href={`/financial-literacy/academy/${p.slug}/${l.slug}`} target="_blank" rel="noreferrer">Preview</a></Button>
                  </div>
                  {showRev === l.id && (
                    <div className="rounded bg-muted/50 p-2 text-xs space-y-1">
                      {(revs.data ?? []).length ? (revs.data ?? []).map((r) => {
                        const s = r.snapshot as Partial<Lesson>;
                        return <div key={r.id} className="flex gap-2"><span className="text-muted-foreground">{new Date(r.created_at).toLocaleString("en-GB")}</span><span>previous version: {s.status} · {(s.body_en ?? "").length} chars EN / {(s.body_el ?? "").length} chars EL</span>
                          <Button size="sm" variant="link" className="h-auto p-0 text-xs" onClick={() => setEditing({ ...l, title_en: s.title_en ?? l.title_en, title_el: s.title_el ?? l.title_el, body_en: s.body_en ?? l.body_en, body_el: s.body_el ?? l.body_el, calculator: l.calculator ?? "none" })}>Restore into editor</Button></div>;
                      }) : <p className="text-muted-foreground">No earlier versions yet.</p>}
                    </div>
                  )}
                  {editing?.id === l.id && (
                    <div className="grid md:grid-cols-2 gap-3 rounded-md border p-3">
                      <div className="space-y-1"><Label>Title (English)</Label><Input value={editing.title_en} onChange={(e) => set("title_en", e.target.value)} /></div>
                      <div className="space-y-1"><Label>Title (Greek)</Label><Input value={editing.title_el} onChange={(e) => set("title_el", e.target.value)} /></div>
                      <div className="space-y-1"><Label>Summary (English)</Label><Input value={editing.summary_en} onChange={(e) => set("summary_en", e.target.value)} /></div>
                      <div className="space-y-1"><Label>Summary (Greek)</Label><Input value={editing.summary_el} onChange={(e) => set("summary_el", e.target.value)} /></div>
                      <div className="space-y-1"><Label>Lesson text (English, Markdown)</Label><Textarea rows={14} value={editing.body_en} onChange={(e) => set("body_en", e.target.value)} /></div>
                      <div className="space-y-1"><Label>Lesson text (Greek, Markdown)</Label><Textarea rows={14} value={editing.body_el} placeholder="Leave empty to show the English text with a notice." onChange={(e) => set("body_el", e.target.value)} /></div>
                      <div className="grid grid-cols-3 gap-3 md:col-span-2">
                        <div className="space-y-1"><Label>Minutes</Label><Input type="number" min={1} value={editing.minutes} onChange={(e) => set("minutes", Math.max(1, Number(e.target.value) || 1))} /></div>
                        <div className="space-y-1"><Label>Calculator</Label><Select value={editing.calculator ?? "none"} onValueChange={(v) => set("calculator", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CALCS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                        <div className="space-y-1"><Label>Publish on (optional)</Label><Input type="datetime-local" value={editing.publish_at ?? ""} onChange={(e) => set("publish_at", e.target.value || null)} /></div>
                        <div className="space-y-1 col-span-2"><Label>Official figures (Eurostat codes, comma separated)</Label><Input value={editing.stat_codes.join(", ")} onChange={(e) => set("stat_codes", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} /></div>
                        <div className="space-y-1"><Label>Supporting resource link</Label><Input value={editing.resource_url ?? ""} onChange={(e) => set("resource_url", e.target.value || null)} /></div>
                      </div>
                      <div className="md:col-span-2 flex gap-2"><Button onClick={saveLesson}>Save</Button><Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button></div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
