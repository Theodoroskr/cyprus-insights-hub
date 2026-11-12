import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, ExternalLink, Link2, Play, Plus, RefreshCw, Sparkles, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DEADLINE_LABELS, diffFatf, DOC_TYPE_LABELS, FATF_LABELS, MEASURE_LABELS, SECTOR_LABELS, TOPIC_LABELS, type FatfListing } from "@/lib/compliance";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;
const fmt = (d: string | null | undefined) => (d ? new Date(d).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—");
const SECTIONS = [["updates", "Regulatory Updates"], ["eu_sanctions", "EU Sanctions"], ["cy_sanctions", "Cyprus Sanctions"], ["deadlines", "Deadlines"]];
const sel = "h-9 border border-input bg-background px-2 text-sm";

async function invoke(body: Row) {
  const { data, error } = await supabase.functions.invoke("ingest-compliance", { body });
  if (error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ctx = (error as any).context; let details = error.message;
    try { details = (await ctx?.json())?.error ?? details; } catch { /* keep message */ }
    throw new Error(details);
  }
  return data;
}

function Checks({ options, value, onChange }: { options: [string, string][]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(([k, l]) => {
        const on = value.includes(k);
        return <button type="button" key={k} onClick={() => onChange(on ? value.filter((x) => x !== k) : [...value, k])}
          className={`text-xs px-2 py-1 border ${on ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground"}`}>{l}</button>;
      })}
    </div>
  );
}
const F = ({ label, children }: { label: string; children: React.ReactNode }) => <label className="block space-y-1"><span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>{children}</label>;
const opts = (m: Record<string, { en: string }>) => Object.entries(m).map(([k, v]) => [k, v.en] as [string, string]);

// ---------------- item editor ----------------
function ItemEditor({ id, onClose, onSaved }: { id: string; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);
  const [mergeQ, setMergeQ] = useState("");
  const [newRef, setNewRef] = useState({ url: "", title: "", authority: "", language: "en" });
  const detail = useQuery({
    queryKey: ["cmp-item", id],
    queryFn: async () => {
      const [item, refs, hist] = await Promise.all([
        db.from("compliance_items").select("*").eq("id", id).single(),
        db.from("compliance_item_refs").select("*").eq("item_id", id).order("published_at"),
        db.from("compliance_item_history").select("*").eq("item_id", id).order("changed_at", { ascending: false }).limit(50),
      ]);
      return { item: item.data as Row, refs: (refs.data ?? []) as Row[], history: (hist.data ?? []) as Row[] };
    },
  });
  useEffect(() => { if (detail.data) setF({ ...detail.data.item, countries_txt: (detail.data.item.countries ?? []).join(", "), related_txt: (detail.data.item.related_acts ?? []).join(", ") }); }, [detail.data]);
  const merges = useQuery({
    queryKey: ["cmp-merge", mergeQ], enabled: mergeQ.trim().length > 2,
    queryFn: async () => ((await db.from("compliance_items").select("id, authority, official_title, status").neq("id", id).neq("status", "merged").ilike("official_title", `%${mergeQ.trim()}%`).limit(8)).data ?? []) as Row[],
  });
  if (!f || !detail.data) return <p className="text-sm text-muted-foreground p-4">Loading…</p>;
  const set = (k: string, v: unknown) => setF({ ...f, [k]: v });
  const sug = f.ai_suggestions ?? {};
  const pending = sug.pending_source_values;

  const save = async (status?: string) => {
    if (status === "published") {
      if (!f.sections?.length) return toast.error("Choose at least one section");
      if (!f.title_en && !f.title_el) return toast.error("Add an editorial title (English or Greek)");
      if (!f.summary_en && !f.summary_el) return toast.error("Add a summary (English or Greek)");
    }
    setBusy(true);
    const nul = (v: unknown) => (v === "" || v === undefined ? null : v);
    const list = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
    const patch: Row = {
      sections: f.sections, authority: f.authority, jurisdiction: f.jurisdiction, document_type: f.document_type, official_title: f.official_title, canonical_url: f.canonical_url, official_id: nul(f.official_id),
      title_en: nul(f.title_en), title_el: nul(f.title_el), summary_en: nul(f.summary_en), summary_el: nul(f.summary_el),
      what_changed_en: nul(f.what_changed_en), what_changed_el: nul(f.what_changed_el), action_en: nul(f.action_en), action_el: nul(f.action_el),
      topics: f.topics, sectors: f.sectors, publication_date: nul(f.publication_date), application_date: nul(f.application_date), effective_date: nul(f.effective_date),
      deadline_date: nul(f.deadline_date), deadline_type: f.deadline_date ? nul(f.deadline_type) ?? "other" : null, deadline_note: nul(f.deadline_note),
      legal_act_ref: nul(f.legal_act_ref), regime: nul(f.regime), measure_type: nul(f.measure_type), countries: list(f.countries_txt ?? ""), audience: nul(f.audience), related_acts: list(f.related_txt ?? ""),
      reviewed_at: new Date().toISOString(), ...(status ? { status } : {}),
    };
    const { data: u } = await supabase.auth.getUser();
    patch.reviewed_by = u.user?.id ?? null;
    const { error } = await db.from("compliance_items").update(patch).eq("id", id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(status === "published" ? "Published" : status === "rejected" ? "Rejected" : status === "review" ? "Moved back to review" : "Saved");
    detail.refetch(); onSaved();
  };
  const applyPending = async () => {
    const p: Row = { change_pending: false, change_note: null, ai_suggestions: { ...sug, pending_source_values: null } };
    if (pending) { p.official_title = pending.official_title ?? f.official_title; if (pending.deadline_date !== undefined) { p.deadline_date = pending.deadline_date; p.deadline_note = pending.deadline_note; } }
    const { error } = await db.from("compliance_items").update(p).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Official values applied"); detail.refetch(); onSaved(); }
  };
  const dismissPending = async () => { await db.from("compliance_items").update({ change_pending: false, change_note: null, ai_suggestions: { ...sug, pending_source_values: null } }).eq("id", id); detail.refetch(); onSaved(); };
  const redraft = async () => { setBusy(true); try { await invoke({ action: "draft", item_id: id }); toast.success("New draft ready — check it before publishing"); detail.refetch(); } catch (e) { toast.error((e as Error).message); } setBusy(false); };
  const mergeIn = async (dup: string) => { const { error } = await db.rpc("merge_compliance_items", { _dup: dup, _keep: id }); if (error) toast.error(error.message); else { toast.success("Linked: the other record's references now point here"); setMergeQ(""); detail.refetch(); onSaved(); } };
  const addRef = async () => {
    if (!/^https:\/\//.test(newRef.url) || !newRef.authority) return toast.error("Official https link and authority are required");
    const { error } = await db.from("compliance_item_refs").insert({ item_id: id, url: newRef.url, title: newRef.title || null, authority: newRef.authority, language: newRef.language, role: "related" });
    if (error) toast.error(error.message); else { setNewRef({ url: "", title: "", authority: "", language: "en" }); detail.refetch(); }
  };
  const removeRef = async (refId: string) => { await db.from("compliance_item_refs").delete().eq("id", refId); detail.refetch(); };

  return (
    <div className="border-2 border-foreground p-4 space-y-4 bg-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Badge variant="outline">{f.status}</Badge> <span className="text-xs text-muted-foreground">{f.authority} · {f.official_id ?? "no official ID"} · found {fmt(f.created_at)}</span>
          <a href={f.canonical_url} target="_blank" rel="noopener noreferrer" className="block text-sm text-secondary hover:underline mt-1 break-all">{f.canonical_url} <ExternalLink className="inline h-3 w-3" /></a>
        </div>
        <Button size="sm" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>

      {f.change_pending && (
        <div className="border-l-4 border-warning bg-muted/50 p-3 text-sm space-y-2">
          <p><strong>Source changed:</strong> {f.change_note}</p>
          {pending && <p className="text-xs">New official title: {pending.official_title}{pending.deadline_date !== undefined && <> · new deadline: {pending.deadline_date ?? "none"}</>}</p>}
          <div className="flex gap-2"><Button size="sm" onClick={applyPending}>Apply official values</Button><Button size="sm" variant="outline" onClick={dismissPending}>No public change needed</Button></div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-3">
        <F label="Official title (as published)"><Textarea rows={2} value={f.official_title ?? ""} onChange={(e) => set("official_title", e.target.value)} /></F>
        <div className="grid grid-cols-2 gap-2">
          <F label="Authority"><Input value={f.authority ?? ""} onChange={(e) => set("authority", e.target.value)} /></F>
          <F label="Jurisdiction"><select className={sel + " w-full"} value={f.jurisdiction} onChange={(e) => set("jurisdiction", e.target.value)}><option value="CY">Cyprus</option><option value="EU">EU</option><option value="INT">International</option></select></F>
          <F label="Document type"><select className={sel + " w-full"} value={f.document_type} onChange={(e) => set("document_type", e.target.value)}>{opts(DOC_TYPE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></F>
          <F label="Official ID"><Input value={f.official_id ?? ""} onChange={(e) => set("official_id", e.target.value)} /></F>
        </div>
      </div>
      <F label="Sections (one record can appear in several)"><Checks options={SECTIONS as [string, string][]} value={f.sections ?? []} onChange={(v) => set("sections", v)} /></F>

      <div className="grid md:grid-cols-2 gap-3">
        {(["en", "el"] as const).map((l) => (
          <div key={l} className="space-y-2 border border-border p-3">
            <p className="text-xs font-bold uppercase">{l === "en" ? "English" : "Greek"}</p>
            <F label="Editorial title"><Input value={f[`title_${l}`] ?? ""} onChange={(e) => set(`title_${l}`, e.target.value)} /></F>
            <F label="Summary"><Textarea rows={4} value={f[`summary_${l}`] ?? ""} onChange={(e) => set(`summary_${l}`, e.target.value)} /></F>
            <F label="What changed"><Textarea rows={2} value={f[`what_changed_${l}`] ?? ""} onChange={(e) => set(`what_changed_${l}`, e.target.value)} /></F>
            <F label="Action or deadline stated by the source"><Textarea rows={2} value={f[`action_${l}`] ?? ""} onChange={(e) => set(`action_${l}`, e.target.value)} /></F>
          </div>
        ))}
      </div>
      {sug.drafted_at && <p className="text-xs text-muted-foreground">Draft written {fmt(sug.drafted_at)} from the {sug.read_from === "pdf" ? "official PDF" : sug.read_from === "text" ? "official page text" : "title only — check carefully"}. Leave anything you cannot verify empty.</p>}
      {sug.last_error && <p className="text-xs text-destructive">Last drafting error: {sug.last_error}</p>}

      <div className="grid md:grid-cols-4 gap-2">
        <F label="Source publication date"><Input type="date" value={f.publication_date ?? ""} onChange={(e) => set("publication_date", e.target.value)} /></F>
        <F label="Application date"><Input type="date" value={f.application_date ?? ""} onChange={(e) => set("application_date", e.target.value)} /></F>
        <F label="Effective date"><Input type="date" value={f.effective_date ?? ""} onChange={(e) => set("effective_date", e.target.value)} /></F>
        <F label="Deadline"><Input type="date" value={f.deadline_date ?? ""} onChange={(e) => set("deadline_date", e.target.value)} /></F>
        <F label="Deadline type"><select className={sel + " w-full"} value={f.deadline_type ?? ""} onChange={(e) => set("deadline_type", e.target.value)}><option value="">—</option>{opts(DEADLINE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></F>
        <div className="md:col-span-3"><F label="Deadline note"><Input value={f.deadline_note ?? ""} onChange={(e) => set("deadline_note", e.target.value)} /></F></div>
      </div>
      {Array.isArray(sug.dates) && sug.dates.length > 0 && (
        <div className="text-xs border border-dashed border-border p-2 space-y-1">
          <p className="font-semibold">Dates suggested from the source (check the quote before using):</p>
          {sug.dates.map((d: Row, i: number) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{d.kind}</Badge><span className="font-mono">{d.date}</span><span className="italic text-muted-foreground">“{d.quote}”</span>
              {!d.quote_found && <Badge variant="destructive">quote not found in source</Badge>}
              <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => {
                const field = d.kind === "deadline" ? "deadline_date" : d.kind === "application" ? "application_date" : d.kind === "effective" ? "effective_date" : null;
                if (!field) return;
                setF({ ...f, [field]: d.date, ...(field === "deadline_date" ? { deadline_type: d.deadline_type ?? "other", deadline_note: d.quote } : {}) });
              }}>Use</Button>
            </div>
          ))}
        </div>
      )}

      <F label="Topics"><Checks options={opts(TOPIC_LABELS)} value={f.topics ?? []} onChange={(v) => set("topics", v)} /></F>
      <F label="Affected sectors"><Checks options={opts(SECTOR_LABELS)} value={f.sectors ?? []} onChange={(v) => set("sectors", v)} /></F>

      <div className="grid md:grid-cols-3 gap-2">
        <F label="Legal act reference"><Input value={f.legal_act_ref ?? ""} onChange={(e) => set("legal_act_ref", e.target.value)} /></F>
        <F label="Sanctions regime"><Input value={f.regime ?? ""} onChange={(e) => set("regime", e.target.value)} /></F>
        <F label="Measure type"><select className={sel + " w-full"} value={f.measure_type ?? ""} onChange={(e) => set("measure_type", e.target.value)}><option value="">—</option>{opts(MEASURE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></F>
        <F label="Countries / territories (comma separated)"><Input value={f.countries_txt ?? ""} onChange={(e) => set("countries_txt", e.target.value)} /></F>
        <F label="Audience"><Input value={f.audience ?? ""} onChange={(e) => set("audience", e.target.value)} /></F>
        <F label="Related EU acts (comma separated)"><Input value={f.related_txt ?? ""} onChange={(e) => set("related_txt", e.target.value)} /></F>
      </div>

      <div className="border border-border p-3 space-y-2">
        <p className="text-xs font-bold uppercase">Official references</p>
        {detail.data.refs.map((r) => (
          <div key={r.id} className="flex items-center gap-2 text-xs">
            <Badge variant="outline">{r.role}</Badge><span>{r.authority}</span>
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-secondary truncate hover:underline">{r.title ?? r.url}</a>
            {r.role !== "primary" && <Button size="sm" variant="ghost" className="h-6 ml-auto" onClick={() => removeRef(r.id)}><X className="h-3 w-3" /></Button>}
          </div>
        ))}
        <div className="grid md:grid-cols-[1fr_1fr_8rem_5rem_auto] gap-2">
          <Input placeholder="https://official link" value={newRef.url} onChange={(e) => setNewRef({ ...newRef, url: e.target.value })} />
          <Input placeholder="Title" value={newRef.title} onChange={(e) => setNewRef({ ...newRef, title: e.target.value })} />
          <Input placeholder="Authority" value={newRef.authority} onChange={(e) => setNewRef({ ...newRef, authority: e.target.value })} />
          <select className={sel} value={newRef.language} onChange={(e) => setNewRef({ ...newRef, language: e.target.value })}><option value="en">EN</option><option value="el">EL</option></select>
          <Button size="sm" variant="outline" onClick={addRef}><Plus className="h-3 w-3" /></Button>
        </div>
        <div className="pt-2">
          <p className="text-xs text-muted-foreground mb-1"><Link2 className="inline h-3 w-3" /> Same matter covered by another record (e.g. CySEC and AMLA on one consultation)? Find it and link it here — its references move to this record and it stops appearing separately.</p>
          <Input placeholder="Search other records by title" value={mergeQ} onChange={(e) => setMergeQ(e.target.value)} />
          {(merges.data ?? []).map((m) => (
            <div key={m.id} className="flex items-center gap-2 text-xs py-1 border-b border-border">
              <span className="font-semibold">{m.authority}</span><span className="truncate">{m.official_title}</span><Badge variant="outline">{m.status}</Badge>
              <Button size="sm" variant="outline" className="h-6 ml-auto" onClick={() => mergeIn(m.id)}>Link into this record</Button>
            </div>
          ))}
        </div>
      </div>

      {detail.data.history.length > 0 && (
        <details className="text-xs border border-border p-3">
          <summary className="font-bold uppercase cursor-pointer">History ({detail.data.history.length})</summary>
          <ul className="mt-2 space-y-1">{detail.data.history.map((h) => <li key={h.id}>{fmt(h.changed_at)} · <strong>{h.change_kind}</strong>{h.field && ` ${h.field}`}: {h.old_value ?? "—"} → {h.new_value ?? "—"}</li>)}</ul>
        </details>
      )}

      <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
        <Button disabled={busy} onClick={() => save("published")} className="gap-1"><Check className="h-4 w-4" />{f.status === "published" ? "Save published record" : "Verify & publish"}</Button>
        <Button disabled={busy} variant="outline" onClick={() => save()}>Save draft</Button>
        <Button disabled={busy} variant="outline" onClick={redraft} className="gap-1"><Sparkles className="h-4 w-4" />Redraft summary</Button>
        {f.status === "published" && <Button disabled={busy} variant="outline" onClick={() => save("review")}>Unpublish</Button>}
        {f.status !== "rejected" && <Button disabled={busy} variant="ghost" className="text-destructive" onClick={() => save("rejected")}>Reject</Button>}
      </div>
    </div>
  );
}

// ---------------- lists ----------------
function ItemsTab({ openId, setOpenId }: { openId: string | null; setOpenId: (v: string | null) => void }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState("review");
  const [section, setSection] = useState("all");
  const [q, setQ] = useState("");
  const items = useQuery({
    queryKey: ["cmp-items", status, section],
    queryFn: async () => {
      let query = db.from("compliance_items").select("id, status, authority, official_title, title_en, publication_date, deadline_date, sections, change_pending, summary_en, document_type, is_test").order("publication_date", { ascending: false, nullsFirst: false }).limit(400);
      if (status === "changed") query = query.eq("change_pending", true); else if (status !== "all") query = query.eq("status", status);
      if (section !== "all") query = query.contains("sections", [section]);
      return ((await query).data ?? []) as Row[];
    },
  });
  const shown = (items.data ?? []).filter((i) => !q || `${i.official_title} ${i.title_en ?? ""} ${i.authority}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <select className={sel} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="review">Awaiting review</option><option value="changed">Source changed</option><option value="published">Published</option><option value="rejected">Rejected</option><option value="merged">Linked into another</option><option value="all">All</option>
        </select>
        <select className={sel} value={section} onChange={(e) => setSection(e.target.value)}><option value="all">All sections</option>{SECTIONS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        <Input className="w-64" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="text-xs text-muted-foreground self-center">{shown.length} records</span>
      </div>
      <div className="divide-y divide-border border border-border">
        {shown.map((i) => (
          <div key={i.id}>
            {openId === i.id ? <ItemEditor id={i.id} onClose={() => setOpenId(null)} onSaved={() => qc.invalidateQueries({ queryKey: ["cmp-items"] })} /> : (
              <button className="w-full text-left p-3 hover:bg-muted/40 flex gap-3 items-start" onClick={() => setOpenId(i.id)}>
                <span className="text-xs w-24 shrink-0 text-muted-foreground">{i.publication_date ?? "—"}</span>
                <span className="min-w-0 flex-1">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-secondary">{i.authority} · {DOC_TYPE_LABELS[i.document_type]?.en}</span>
                  <span className="block text-sm font-semibold truncate">{i.title_en ?? i.official_title}</span>
                  <span className="flex gap-1 mt-1">{(i.sections ?? []).map((s: string) => <Badge key={s} variant="outline" className="text-[9px]">{s}</Badge>)}
                    {!i.summary_en && <Badge variant="secondary" className="text-[9px]">no summary yet</Badge>}
                    {i.change_pending && <Badge variant="destructive" className="text-[9px]">source changed</Badge>}
                    {i.deadline_date && <Badge variant="secondary" className="text-[9px]">deadline {i.deadline_date}</Badge>}
                    {i.is_test && <Badge variant="secondary" className="text-[9px]">test</Badge>}</span>
                </span>
              </button>
            )}
          </div>
        ))}
        {!shown.length && <p className="p-4 text-sm text-muted-foreground">Nothing here.</p>}
      </div>
    </div>
  );
}

function SourcesTab() {
  const [busy, setBusy] = useState<string | null>(null);
  const sources = useQuery({ queryKey: ["cmp-sources"], queryFn: async () => ((await db.from("compliance_sources").select("*").order("status").order("name")).data ?? []) as Row[] });
  const run = async (slug: string, action?: string) => {
    setBusy(slug + (action ?? ""));
    try {
      const r = await invoke(action ? { action, source_slug: slug } : { phase: "collect", source_slug: slug, force: true });
      const c = r.collect?.[0];
      if (action) toast[r.validation?.ok ? "success" : "error"](r.validation?.ok ? `Readable via ${r.validation.method}` : `Not readable: ${r.validation?.error ?? r.validation?.direct_error ?? r.validation?.status}`);
      else if (c?.skipped) toast.message(c.skipped);
      else toast[c?.errors?.length ? "error" : "success"](`${c?.found ?? 0} found · ${c?.fresh ?? 0} new · ${c?.changed ?? 0} changed${c?.errors?.length ? ` · ${c.errors.length} errors` : ""}`);
    } catch (e) { toast.error((e as Error).message); }
    setBusy(null); sources.refetch();
  };
  const update = async (id: string, patch: Row) => { const { error } = await db.from("compliance_sources").update(patch).eq("id", id); if (error) toast.error(error.message); sources.refetch(); };
  return (
    <div className="overflow-x-auto border border-border">
      <table className="w-full text-xs">
        <thead className="bg-muted/50 text-left uppercase tracking-wider text-muted-foreground"><tr>
          <th className="p-2">Source</th><th className="p-2">Method</th><th className="p-2">Status</th><th className="p-2">Every (h)</th><th className="p-2">Last attempt</th><th className="p-2">Last success</th><th className="p-2">Found / new / changed</th><th className="p-2">Latest error</th><th className="p-2"></th></tr></thead>
        <tbody className="divide-y divide-border">
          {(sources.data ?? []).map((s) => (
            <tr key={s.id} className="align-top">
              <td className="p-2 min-w-[14rem]"><a href={s.homepage_url} target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-secondary">{s.name}</a>
                <p className="text-muted-foreground">{s.manual_reason ?? s.notes}</p></td>
              <td className="p-2">{s.collection_method}</td>
              <td className="p-2"><select className={sel + " h-7 text-xs"} value={s.status} onChange={(e) => update(s.id, { status: e.target.value })}>
                <option value="active">active</option><option value="pending_validation">pending validation</option><option value="manual">manual</option><option value="disabled">disabled</option></select></td>
              <td className="p-2"><Input type="number" min={1} className="h-7 w-16 text-xs" defaultValue={s.check_interval_hours} onBlur={(e) => Number(e.target.value) !== s.check_interval_hours && update(s.id, { check_interval_hours: Number(e.target.value) })} /></td>
              <td className="p-2 whitespace-nowrap">{fmt(s.last_attempt_at)}</td>
              <td className="p-2 whitespace-nowrap">{fmt(s.last_success_at)}</td>
              <td className="p-2">{s.last_items_found ?? 0} / {s.last_new_items ?? 0} / {s.last_changed_items ?? 0}</td>
              <td className={`p-2 max-w-[16rem] ${s.last_error ? "text-destructive" : "text-muted-foreground"}`}>{s.last_error ? <>{s.last_error}<br /><span className="text-muted-foreground">{fmt(s.last_error_at)}</span></> : "—"}</td>
              <td className="p-2 whitespace-nowrap space-x-1">
                <Button size="sm" variant="outline" className="h-7" disabled={!!busy} onClick={() => run(s.slug)}><Play className="h-3 w-3" /></Button>
                <Button size="sm" variant="ghost" className="h-7" disabled={!!busy} onClick={() => run(s.slug, "validate")} title="Check the source can be read"><RefreshCw className={`h-3 w-3 ${busy === s.slug + "validate" ? "animate-spin" : ""}`} /></Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FatfTab() {
  const rel = useQuery({ queryKey: ["cmp-fatf"], queryFn: async () => ((await db.from("fatf_releases").select("*, fatf_listings(id, country_name, country_code, category)").order("release_date", { ascending: false })).data ?? []) as Row[] });
  const [add, setAdd] = useState<Record<string, { name: string; code: string; category: string }>>({});
  const list = rel.data ?? [];
  const setStatus = async (r: Row, status: string) => {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await db.from("fatf_releases").update({ status, ...(status === "published" ? { verified_by: u.user?.id, verified_at: new Date().toISOString() } : {}) }).eq("id", r.id);
    if (error) toast.error(error.message); else toast.success(status === "published" ? "Release published" : "Updated");
    rel.refetch();
  };
  const removeListing = async (id: string) => { await db.from("fatf_listings").delete().eq("id", id); rel.refetch(); };
  const addListing = async (releaseId: string) => {
    const a = add[releaseId]; if (!a?.name) return;
    const { error } = await db.from("fatf_listings").insert({ release_id: releaseId, country_name: a.name, country_code: a.code || null, category: a.category || "increased_monitoring" });
    if (error) toast.error(error.message); else { setAdd({ ...add, [releaseId]: { name: "", code: "", category: a.category } }); rel.refetch(); }
  };
  return (
    <div className="space-y-4">
      {list.map((r) => {
        const prev = list.find((x) => x.status === "published" && x.release_date < r.release_date);
        const changes = prev ? diffFatf(r.fatf_listings as FatfListing[], prev.fatf_listings as FatfListing[]) : [];
        return (
          <Card key={r.id} className="rounded-none">
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2">{r.label} <Badge variant="outline">{r.status}</Badge>
              <span className="text-xs font-normal text-muted-foreground">fetched {fmt(r.fetched_at)}{r.verified_at && ` · verified ${fmt(r.verified_at)}`}</span></CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex gap-3 text-xs">{r.call_for_action_url && <a className="text-secondary" href={r.call_for_action_url} target="_blank" rel="noopener noreferrer">Call for action ↗</a>}{r.increased_monitoring_url && <a className="text-secondary" href={r.increased_monitoring_url} target="_blank" rel="noopener noreferrer">Increased monitoring ↗</a>}</div>
              {r.notes && <p className="text-xs text-destructive">{r.notes}</p>}
              <div className="grid md:grid-cols-3 gap-3">
                {Object.keys(FATF_LABELS).map((cat) => (
                  <div key={cat} className="border border-border p-2"><p className="text-[11px] font-bold uppercase mb-1">{FATF_LABELS[cat].en}</p>
                    {(r.fatf_listings as Row[]).filter((l) => l.category === cat).sort((a, b) => a.country_name.localeCompare(b.country_name)).map((l) => (
                      <div key={l.id} className="flex items-center justify-between text-xs">{l.country_name} <span className="text-muted-foreground">{l.country_code}</span>
                        {r.status !== "published" && <button onClick={() => removeListing(l.id)} className="text-destructive"><X className="h-3 w-3" /></button>}</div>
                    ))}
                  </div>
                ))}
              </div>
              {r.stated_removals?.length > 0 && <p className="text-xs">FATF states these were removed from monitoring: {r.stated_removals.join(", ")}</p>}
              <p className="text-xs">{prev ? `Compared with ${prev.label}: ` : "No earlier verified release to compare."}{changes.map((c) => `${c.kind} ${c.name}`).join(" · ") || (prev ? "no change" : "")}</p>
              {r.status !== "published" && (
                <div className="flex flex-wrap gap-2 items-center">
                  <Input className="w-40 h-8" placeholder="Country" value={add[r.id]?.name ?? ""} onChange={(e) => setAdd({ ...add, [r.id]: { ...(add[r.id] ?? { code: "", category: "increased_monitoring" }), name: e.target.value } })} />
                  <Input className="w-16 h-8" placeholder="ISO" value={add[r.id]?.code ?? ""} onChange={(e) => setAdd({ ...add, [r.id]: { ...(add[r.id] ?? { name: "", category: "increased_monitoring" }), code: e.target.value.toUpperCase() } })} />
                  <select className={sel + " h-8"} value={add[r.id]?.category ?? "increased_monitoring"} onChange={(e) => setAdd({ ...add, [r.id]: { ...(add[r.id] ?? { name: "", code: "" }), category: e.target.value } })}>{Object.entries(FATF_LABELS).map(([k, v]) => <option key={k} value={k}>{v.en}</option>)}</select>
                  <Button size="sm" variant="outline" onClick={() => addListing(r.id)}><Plus className="h-3 w-3" /></Button>
                </div>
              )}
              <div className="flex gap-2">
                {r.status !== "published" && <Button size="sm" onClick={() => setStatus(r, "published")}><Check className="h-3 w-3 mr-1" />Verified against FATF — publish</Button>}
                {r.status === "published" && <Button size="sm" variant="outline" onClick={() => setStatus(r, "review")}>Unpublish</Button>}
                {r.status === "review" && <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setStatus(r, "rejected")}>Reject</Button>}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function ManualTab({ onCreated }: { onCreated: (id: string) => void }) {
  const [f, setF] = useState({ authority: "", jurisdiction: "CY", official_title: "", canonical_url: "", official_id: "", document_type: "announcement", publication_date: "", sections: ["updates"] as string[], source_language: "en" });
  const create = async () => {
    if (!f.authority || !f.official_title || !/^https:\/\//.test(f.canonical_url)) return toast.error("Authority, official title and an https official link are required");
    const { data, error } = await db.from("compliance_items").insert({ ...f, official_id: f.official_id || null, publication_date: f.publication_date || null, status: "review" }).select("id").single();
    if (error) return toast.error(error.message);
    await db.from("compliance_item_refs").insert({ item_id: data.id, url: f.canonical_url, title: f.official_title, authority: f.authority, language: f.source_language, published_at: f.publication_date || null, role: "primary" });
    toast.success("Record created — complete and verify it"); onCreated(data.id);
  };
  return (
    <div className="max-w-2xl space-y-3">
      <p className="text-sm text-muted-foreground">For sources that need manual handling (e.g. ICPAC, MOKAS, the Bar Association). Every record needs the official link.</p>
      <div className="grid grid-cols-2 gap-2">
        <F label="Authority"><Input value={f.authority} onChange={(e) => setF({ ...f, authority: e.target.value })} /></F>
        <F label="Jurisdiction"><select className={sel + " w-full"} value={f.jurisdiction} onChange={(e) => setF({ ...f, jurisdiction: e.target.value })}><option value="CY">Cyprus</option><option value="EU">EU</option><option value="INT">International</option></select></F>
      </div>
      <F label="Official title"><Input value={f.official_title} onChange={(e) => setF({ ...f, official_title: e.target.value })} /></F>
      <F label="Official link"><Input value={f.canonical_url} onChange={(e) => setF({ ...f, canonical_url: e.target.value })} placeholder="https://" /></F>
      <div className="grid grid-cols-4 gap-2">
        <F label="Official ID"><Input value={f.official_id} onChange={(e) => setF({ ...f, official_id: e.target.value })} /></F>
        <F label="Type"><select className={sel + " w-full"} value={f.document_type} onChange={(e) => setF({ ...f, document_type: e.target.value })}>{opts(DOC_TYPE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></F>
        <F label="Published"><Input type="date" value={f.publication_date} onChange={(e) => setF({ ...f, publication_date: e.target.value })} /></F>
        <F label="Language"><select className={sel + " w-full"} value={f.source_language} onChange={(e) => setF({ ...f, source_language: e.target.value })}><option value="en">English</option><option value="el">Greek</option></select></F>
      </div>
      <F label="Sections"><Checks options={SECTIONS as [string, string][]} value={f.sections} onChange={(v) => setF({ ...f, sections: v })} /></F>
      <Button onClick={create}><Plus className="h-4 w-4 mr-1" />Create record for review</Button>
    </div>
  );
}

export function CompliancePanel() {
  const [tab, setTab] = useState<"items" | "sources" | "fatf" | "manual">("items");
  const [openId, setOpenId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const runAll = async () => {
    setRunning(true);
    try { const r = await invoke({ phase: "all" }); toast.success(`Checked ${r.collect?.length ?? 0} due sources · ${r.summaries?.drafted ?? 0} summaries drafted${r.summaries?.blocked ? ` · drafting paused: ${r.summaries.blocked}` : ""}`); }
    catch (e) { toast.error((e as Error).message); }
    setRunning(false);
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold mr-4">ComplianceHub monitoring</h2>
        {([["items", "Review & records"], ["sources", "Sources"], ["fatf", "FATF releases"], ["manual", "Add manually"]] as const).map(([k, l]) => (
          <Button key={k} size="sm" variant={tab === k ? "default" : "outline"} onClick={() => setTab(k)}>{l}</Button>
        ))}
        <Button size="sm" variant="ghost" className="ml-auto gap-1" disabled={running} onClick={runAll}><RefreshCw className={`h-3.5 w-3.5 ${running ? "animate-spin" : ""}`} />Check due sources now</Button>
      </div>
      <p className="text-xs text-muted-foreground">New records and source changes wait here. Nothing appears on ComplianceHub until an editor verifies and publishes it.</p>
      {tab === "items" ? <ItemsTab openId={openId} setOpenId={setOpenId} /> : tab === "sources" ? <SourcesTab /> : tab === "fatf" ? <FatfTab /> : <ManualTab onCreated={(id) => { setOpenId(id); setTab("items"); }} />}
    </div>
  );
}
