import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, ExternalLink, Merge, Play, Plus, RefreshCw, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Announcement, type AnnouncementLink, type TimelineEntry, CY_TAG_LABEL, DEAL_TYPE_KEYS, LISTED_TYPE_KEYS, STAGE_LABEL, TYPE_LABEL, formatDealAmount } from "@/lib/announcements";

const ASSOCIATION_SLUGS = ["ccci", "oeb", "citea", "icpac", "cybar"];
const fmt = (d: string | null | undefined) => (d ? new Date(d).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

type Source = { id: string; slug: string; name: string; kind: string; section: string; method: string; url: string; status: string; auto_publish: boolean; last_run_at: string | null; last_success_at: string | null; last_found_items: number; last_new_items: number; last_error: string | null; notes: string | null };

export function AnnouncementsPanel() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [status, setStatus] = useState("review");
  const [section, setSection] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const sources = useQuery({ queryKey: ["ann-sources"], queryFn: async () => ((await db.from("announcement_sources").select("*").order("section").order("kind").order("name")).data ?? []) as Source[] });
  const assoc = useQuery({ queryKey: ["ann-assoc"], queryFn: async () => (await supabase.from("content_sources").select("id, slug, name, url, scrape_path, active, access_status, routing_profile, last_scraped_at, last_error, records_imported").in("slug", ASSOCIATION_SLUGS)).data ?? [] });
  const items = useQuery({
    queryKey: ["ann-items", status, section],
    queryFn: async () => {
      let q = db.from("company_announcements").select("*").order("source_published_at", { ascending: false, nullsFirst: false }).limit(300);
      if (status !== "all") q = q.eq("status", status);
      if (section !== "all") q = q.eq("section", section);
      return ((await q).data ?? []) as Announcement[];
    },
  });
  const refresh = () => ["ann-sources", "ann-assoc", "ann-items"].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));

  const run = async (body: Record<string, unknown>, key: string) => {
    setBusy(key);
    const { data, error } = await supabase.functions.invoke("ingest-announcements", { body: { force: true, ...body } });
    setBusy(null);
    if (error || data?.error) { toast.error(data?.error ?? error?.message ?? "Run failed"); return; }
    const ex = data.exchange, sm = data.summaries;
    toast.success(["Run finished", ex && `${ex.fresh} new exchange filings`, sm && `${sm.summarised} summarised`, data.deals && `${data.deals.reduce((s: number, d: { fresh?: number }) => s + (d.fresh ?? 0), 0)} new deal drafts`].filter(Boolean).join(" · "));
    refresh();
  };
  const runAssoc = async (slug: string) => {
    setBusy(slug);
    const { data, error } = await supabase.functions.invoke("scrape-sources", { body: { slug } });
    setBusy(null);
    if (error || data?.error) toast.error(data?.error ?? error?.message ?? "Run failed"); else toast.success("Source checked");
    refresh();
  };
  const setSourceStatus = async (id: string, value: string) => { await db.from("announcement_sources").update({ status: value }).eq("id", id); refresh(); };

  const counts = useMemo(() => ({ review: (items.data ?? []).filter((i) => i.status === "review").length }), [items.data]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex flex-wrap items-center justify-between gap-2">
            Announcement sources
            <span className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" disabled={!!busy} onClick={() => run({ phase: "listed", days: 10 }, "listed")}><Play className="h-3.5 w-3.5 mr-1" />Run listed now</Button>
              <Button size="sm" variant="outline" disabled={!!busy} onClick={() => run({ phase: "deals" }, "deals")}><Play className="h-3.5 w-3.5 mr-1" />Run deals now</Button>
              <Button size="sm" variant="outline" disabled={!!busy} onClick={() => run({ phase: "summarise", limit: 15 }, "sum")}><RefreshCw className="h-3.5 w-3.5 mr-1" />Write pending summaries</Button>
            </span>
          </CardTitle>
          {busy && <p className="text-xs text-muted-foreground">Running… this can take up to two minutes.</p>}
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-left text-muted-foreground"><tr><th className="py-1">Source</th><th>Section</th><th>Status</th><th>Last run</th><th>Last success</th><th>Found / new</th><th>Auto-publish</th><th /></tr></thead>
            <tbody>
              {(sources.data ?? []).map((s) => (
                <tr key={s.id} className="border-t align-top">
                  <td className="py-1.5 max-w-xs"><a href={s.url} target="_blank" rel="noopener noreferrer" className="font-medium underline">{s.name}</a>
                    <p className="text-muted-foreground">{s.kind} · {s.method}</p>
                    {s.notes && <p className="text-muted-foreground">{s.notes}</p>}
                    {s.last_error && <p className="text-destructive break-words">{s.last_error}</p>}
                  </td>
                  <td>{s.section}</td>
                  <td>
                    <Select value={s.status} onValueChange={(v) => setSourceStatus(s.id, v)}>
                      <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{["active", "pending_setup", "unavailable", "disabled"].map((v) => <SelectItem key={v} value={v}>{v === "pending_setup" ? "Setup pending" : v}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                  <td className="whitespace-nowrap">{fmt(s.last_run_at)}</td>
                  <td className="whitespace-nowrap">{fmt(s.last_success_at)}</td>
                  <td>{s.last_found_items} / {s.last_new_items}</td>
                  <td>{s.auto_publish ? "Yes" : "No — review"}</td>
                  <td>{s.method !== "manual" && <Button size="sm" variant="ghost" className="h-7" disabled={!!busy || s.status === "disabled"} onClick={() => run({ phase: s.section === "deals" ? "deals" : "listed", source_slug: s.slug, days: 10 }, s.slug)}>Run now</Button>}</td>
                </tr>
              ))}
              {(assoc.data ?? []).map((s) => (
                <tr key={s.id} className="border-t align-top bg-muted/30">
                  <td className="py-1.5 max-w-xs"><a href={`${s.url}${s.scrape_path}`} target="_blank" rel="noopener noreferrer" className="font-medium underline">{s.name}</a>
                    <p className="text-muted-foreground">association news · routing “{s.routing_profile}” · path {s.scrape_path}</p>
                    {s.last_error && <p className="text-destructive break-words">{s.last_error}</p>}
                  </td>
                  <td>news</td><td>{s.active ? s.access_status : "off"}</td><td className="whitespace-nowrap">{fmt(s.last_scraped_at)}</td><td>—</td><td>{s.records_imported ?? 0} total</td><td>news queue</td>
                  <td><Button size="sm" variant="ghost" className="h-7" disabled={!!busy} onClick={() => runAssoc(s.slug)}>Run now</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-muted-foreground mt-2">Association items go to the news queue on their own hub; items confirming a specific investment or transaction are also added below as deal drafts. Change ICPAC's archive year in Content sources (the path uses {"{year}"} for the current year).</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex flex-wrap items-center justify-between gap-2">
            Announcements {status === "review" && <Badge variant="secondary">{counts.review} to review</Badge>}
            <span className="flex flex-wrap gap-2">
              <Select value={status} onValueChange={setStatus}><SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{["review", "published", "rejected", "merged", "all"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select>
              <Select value={section} onValueChange={setSection}><SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">Both tabs</SelectItem><SelectItem value="listed">Listed disclosures</SelectItem><SelectItem value="deals">Deals</SelectItem></SelectContent></Select>
              <Button size="sm" onClick={() => setShowNew((v) => !v)}><Plus className="h-3.5 w-3.5 mr-1" />Enter a release</Button>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {showNew && <NewRelease onDone={() => { setShowNew(false); refresh(); }} sources={sources.data ?? []} />}
          {(items.data ?? []).length === 0 && <p className="text-sm text-muted-foreground">Nothing here.</p>}
          {(items.data ?? []).map((a) => (
            <div key={a.id} className="border border-border rounded-lg">
              <button className="w-full text-left p-3 flex flex-wrap items-center gap-2" onClick={() => setOpenId(openId === a.id ? null : a.id)}>
                <Badge variant={a.status === "published" ? "default" : a.status === "review" ? "secondary" : "outline"}>{a.status}</Badge>
                <Badge variant="outline">{a.section === "deals" ? "Deal" : "Listed"}</Badge>
                <Badge variant="outline">{TYPE_LABEL[a.announcement_type]?.en ?? a.announcement_type}</Badge>
                <span className="text-xs text-muted-foreground">{a.source_published_at?.slice(0, 10)}</span>
                <span className="font-medium text-sm">{a.company_name}</span>
                <span className="text-sm text-muted-foreground flex-1 min-w-[12rem] truncate">{a.title}</span>
                {!a.summary && <Badge variant="outline" className="text-[10px]">no summary yet</Badge>}
                {a.company_match_status !== "confirmed" && <Badge variant="outline" className="text-[10px]">match {a.company_match_status}</Badge>}
                {!a.primary_verified && <Badge variant="outline" className="text-[10px]">primary not verified</Badge>}
              </button>
              {openId === a.id && <Editor a={a} onChange={refresh} />}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function CompanyPicker({ onPick }: { onPick: (c: { id: string; company_name: string }) => void }) {
  const [q, setQ] = useState("");
  const res = useQuery({
    queryKey: ["ann-company-search", q], enabled: q.trim().length >= 3,
    queryFn: async () => (await supabase.from("directory_companies").select("id, company_name, registration_no, city").ilike("company_name", `%${q.trim()}%`).limit(8)).data ?? [],
  });
  return (
    <div className="space-y-1">
      <Input className="h-8 text-xs" placeholder="Search the directory (3+ letters)…" value={q} onChange={(e) => setQ(e.target.value)} />
      {(res.data ?? []).map((c) => <button key={c.id} type="button" className="block text-left text-xs hover:text-secondary" onClick={() => { onPick(c); setQ(""); }}>{c.company_name} {c.registration_no && `· HE ${c.registration_no}`} {c.city && `· ${c.city}`}</button>)}
    </div>
  );
}

function AnnouncementPicker({ exclude, onPick, placeholder }: { exclude: string; onPick: (a: Announcement) => void; placeholder: string }) {
  const [q, setQ] = useState("");
  const res = useQuery({
    queryKey: ["ann-pick", q], enabled: q.trim().length >= 3,
    queryFn: async () => ((await db.from("company_announcements").select("*").neq("id", exclude).not("status", "in", "(merged,rejected)").or(`company_name.ilike.%${q.trim()}%,title.ilike.%${q.trim()}%`).limit(8)).data ?? []) as Announcement[],
  });
  return (
    <div className="space-y-1">
      <Input className="h-8 text-xs" placeholder={placeholder} value={q} onChange={(e) => setQ(e.target.value)} />
      {(res.data ?? []).map((x) => <button key={x.id} type="button" className="block text-left text-xs hover:text-secondary" onClick={() => onPick(x)}>{x.source_published_at?.slice(0, 10)} · {x.company_name} — {x.title} ({x.status})</button>)}
    </div>
  );
}

function Editor({ a, onChange }: { a: Announcement; onChange: () => void }) {
  const [f, setF] = useState<Announcement>(a);
  const [linkUrl, setLinkUrl] = useState(""); const [linkRole, setLinkRole] = useState("supporting");
  const [tl, setTl] = useState({ entry_date: "", stage: "", title: "", summary: "", source_url: "" });
  const extra = useQuery({
    queryKey: ["ann-extra", a.id],
    queryFn: async () => {
      const [l, t, sug, conf] = await Promise.all([
        db.from("company_announcement_sources").select("*").eq("announcement_id", a.id).order("published_at"),
        db.from("company_announcement_timeline").select("*").eq("announcement_id", a.id).order("entry_date"),
        a.suggested_company_id ? supabase.from("directory_companies").select("id, company_name, slug").eq("id", a.suggested_company_id).maybeSingle() : Promise.resolve({ data: null }),
        a.directory_company_id ? supabase.from("directory_companies").select("id, company_name, slug").eq("id", a.directory_company_id).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      return { links: (l.data ?? []) as AnnouncementLink[], timeline: (t.data ?? []) as TimelineEntry[], suggested: sug.data, confirmed: conf.data };
    },
  });
  const set = <K extends keyof Announcement>(k: K, v: Announcement[K]) => setF((p) => ({ ...p, [k]: v }));
  const isDeal = f.section === "deals";

  const save = async (patch: Partial<Announcement> = {}) => {
    const row = { ...f, ...patch };
    const { error } = await db.from("company_announcements").update({
      section: row.section, announcement_type: row.announcement_type, status: row.status, company_name: row.company_name,
      directory_company_id: row.directory_company_id, company_match_status: row.directory_company_id ? "confirmed" : row.suggested_company_id ? "suggested" : "unmatched",
      title: row.title, summary: row.summary, sector: row.sector || null, event_date: row.event_date || null,
      primary_source_url: row.primary_source_url || null, primary_verified: row.primary_verified,
      amount: row.amount, currency: row.currency || null, investors: row.investors, buyer: row.buyer || null, deal_stage: row.deal_stage || null,
      cyprus_location: row.cyprus_location || null, cyprus_tags: row.cyprus_tags, reviewed_at: new Date().toISOString(),
    }).eq("id", a.id);
    if (error) { toast.error(error.message); return false; }
    toast.success("Saved"); onChange(); return true;
  };
  const publish = async () => {
    if (!f.summary?.trim()) { toast.error("Add a short BusinessHub summary first"); return; }
    if (!f.primary_source_url && !(extra.data?.links ?? []).length) { toast.error("Attach at least one source link"); return; }
    await save({ status: "published" });
  };
  const addLink = async () => {
    if (!/^https?:\/\//.test(linkUrl)) { toast.error("Enter a full link"); return; }
    const { error } = await db.from("company_announcement_sources").insert({ announcement_id: a.id, url: linkUrl.trim(), role: linkRole, source_name: new URL(linkUrl).hostname.replace(/^www\./, ""), published_at: new Date().toISOString() });
    if (error) { toast.error(error.message.includes("duplicate") ? "That link is already attached to an announcement" : error.message); return; }
    if (linkRole === "primary") { set("primary_source_url", linkUrl.trim()); await db.from("company_announcements").update({ primary_source_url: linkUrl.trim() }).eq("id", a.id); }
    setLinkUrl(""); extra.refetch();
  };
  const addTimeline = async () => {
    if (!tl.title.trim()) { toast.error("Timeline entries need a title"); return; }
    const { error } = await db.from("company_announcement_timeline").insert({ announcement_id: a.id, entry_date: tl.entry_date || null, stage: tl.stage || null, title: tl.title, summary: tl.summary || null, source_url: tl.source_url || null });
    if (error) toast.error(error.message); else { setTl({ entry_date: "", stage: "", title: "", summary: "", source_url: "" }); extra.refetch(); }
  };
  const mergeInto = async (target: Announcement, asTimeline: boolean) => {
    await db.from("company_announcement_sources").update({ announcement_id: target.id, role: "supporting" }).eq("announcement_id", a.id);
    await db.from("company_announcement_timeline").update({ announcement_id: target.id }).eq("announcement_id", a.id);
    if (asTimeline) await db.from("company_announcement_timeline").insert({ announcement_id: target.id, entry_date: (a.event_date ?? a.source_published_at)?.slice(0, 10) ?? null, stage: a.deal_stage, title: f.title, summary: f.summary, source_url: f.primary_source_url ?? a.discovery_url });
    await db.from("company_announcements").update({ external_ids: [...new Set([...(target.external_ids ?? []), ...(a.external_ids ?? [])])] }).eq("id", target.id);
    const { error } = await db.from("company_announcements").update({ status: "merged", merged_into: target.id }).eq("id", a.id);
    if (error) toast.error(error.message); else { toast.success(asTimeline ? "Added as a timeline entry" : "Merged"); onChange(); }
  };

  return (
    <div className="border-t border-border p-3 space-y-3 text-sm">
      {a.routing_note && <p className="text-xs text-muted-foreground">Note: {a.routing_note}</p>}
      <div className="grid md:grid-cols-2 gap-3">
        <label className="space-y-1"><span className="text-xs text-muted-foreground">Company name</span><Input value={f.company_name} onChange={(e) => set("company_name", e.target.value)} /></label>
        <div className="space-y-1"><span className="text-xs text-muted-foreground">Company profile match</span>
          {extra.data?.confirmed ? (
            <p className="text-xs">Confirmed: <a className="underline" href={`/directory/company/${extra.data.confirmed.slug}`} target="_blank" rel="noreferrer">{extra.data.confirmed.company_name}</a> <button className="text-destructive ml-2" onClick={() => set("directory_company_id", null)}>remove</button></p>
          ) : extra.data?.suggested ? (
            <p className="text-xs">Suggested: {extra.data.suggested.company_name} <Button size="sm" variant="outline" className="h-6 ml-2" onClick={() => set("directory_company_id", extra.data!.suggested!.id)}>Confirm</Button></p>
          ) : <p className="text-xs text-muted-foreground">No profile linked.</p>}
          {f.directory_company_id && f.directory_company_id !== a.directory_company_id && <p className="text-xs text-secondary">Will link on save.</p>}
          <CompanyPicker onPick={(c) => { set("directory_company_id", c.id); toast.message(`Selected ${c.company_name} — save to confirm`); }} />
        </div>
        <label className="space-y-1 md:col-span-2"><span className="text-xs text-muted-foreground">Headline</span><Input value={f.title} onChange={(e) => set("title", e.target.value)} /></label>
        <label className="space-y-1 md:col-span-2"><span className="text-xs text-muted-foreground">BusinessHub summary (own words, 2–3 sentences)</span><Textarea rows={3} value={f.summary ?? ""} onChange={(e) => set("summary", e.target.value)} /></label>
        <label className="space-y-1"><span className="text-xs text-muted-foreground">Tab (routing)</span>
          <Select value={f.section} onValueChange={(v) => setF((p) => ({ ...p, section: v as Announcement["section"], announcement_type: (v === "deals" ? DEAL_TYPE_KEYS : LISTED_TYPE_KEYS).includes(p.announcement_type) ? p.announcement_type : v === "deals" ? "funding_round" : "financial_results" }))}>
            <SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="listed">Listed Company Disclosures</SelectItem><SelectItem value="deals">Funding & Investment Deals</SelectItem></SelectContent></Select></label>
        <label className="space-y-1"><span className="text-xs text-muted-foreground">Type</span>
          <Select value={f.announcement_type} onValueChange={(v) => set("announcement_type", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(isDeal ? DEAL_TYPE_KEYS : LISTED_TYPE_KEYS).map((k) => <SelectItem key={k} value={k}>{TYPE_LABEL[k].en}</SelectItem>)}</SelectContent></Select></label>
        <label className="space-y-1"><span className="text-xs text-muted-foreground">Sector</span><Input value={f.sector ?? ""} onChange={(e) => set("sector", e.target.value)} /></label>
        <label className="space-y-1"><span className="text-xs text-muted-foreground">Event date (if disclosed)</span><Input type="date" value={f.event_date ?? ""} onChange={(e) => set("event_date", e.target.value || null)} /></label>
        <label className="space-y-1 md:col-span-2"><span className="text-xs text-muted-foreground">Primary source link (company, investor, exchange or official announcement)</span><Input value={f.primary_source_url ?? ""} onChange={(e) => set("primary_source_url", e.target.value)} /></label>
        <label className="flex items-center gap-2 text-xs"><Checkbox checked={f.primary_verified} onCheckedChange={(v) => set("primary_verified", !!v)} />I checked the primary source</label>
      </div>

      {isDeal && (
        <div className="grid md:grid-cols-3 gap-3 border-t border-border pt-3">
          <label className="space-y-1"><span className="text-xs text-muted-foreground">Amount (blank = not disclosed)</span><Input type="number" value={f.amount ?? ""} onChange={(e) => set("amount", e.target.value === "" ? null : Number(e.target.value))} /></label>
          <label className="space-y-1"><span className="text-xs text-muted-foreground">Currency (original)</span><Input value={f.currency ?? ""} placeholder="EUR" onChange={(e) => set("currency", e.target.value.toUpperCase().slice(0, 3))} /></label>
          <div className="space-y-1"><span className="text-xs text-muted-foreground">Shown as</span><p className="text-sm font-medium">{formatDealAmount(f.amount, f.currency)}</p></div>
          <label className="space-y-1"><span className="text-xs text-muted-foreground">Investors (comma separated)</span><Input value={f.investors.join(", ")} onChange={(e) => set("investors", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} /></label>
          <label className="space-y-1"><span className="text-xs text-muted-foreground">Buyer</span><Input value={f.buyer ?? ""} onChange={(e) => set("buyer", e.target.value)} /></label>
          <label className="space-y-1"><span className="text-xs text-muted-foreground">Stage</span>
            <Select value={f.deal_stage ?? "announced"} onValueChange={(v) => set("deal_stage", v)}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.keys(STAGE_LABEL).map((k) => <SelectItem key={k} value={k}>{STAGE_LABEL[k].en}</SelectItem>)}</SelectContent></Select></label>
          <label className="space-y-1"><span className="text-xs text-muted-foreground">Cyprus location</span><Input value={f.cyprus_location ?? ""} onChange={(e) => set("cyprus_location", e.target.value)} /></label>
          <div className="md:col-span-2 flex flex-wrap gap-3 items-end">
            {Object.keys(CY_TAG_LABEL).map((k) => (
              <label key={k} className="flex items-center gap-1.5 text-xs"><Checkbox checked={f.cyprus_tags.includes(k)} onCheckedChange={(v) => set("cyprus_tags", v ? [...f.cyprus_tags, k] : f.cyprus_tags.filter((x) => x !== k))} />{CY_TAG_LABEL[k].en}</label>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-border pt-3 space-y-1">
        <p className="text-xs font-semibold">Sources</p>
        {(extra.data?.links ?? []).map((l) => (
          <p key={l.id} className="text-xs flex items-center gap-1.5"><Badge variant="outline" className="text-[10px]">{l.role}</Badge>{l.language && <span>{l.language}</span>}
            <a href={l.url} target="_blank" rel="noopener noreferrer" className="underline truncate max-w-[32rem]">{l.title || l.url}</a><ExternalLink className="h-3 w-3" /> <span className="text-muted-foreground">{l.source_name}</span></p>
        ))}
        <div className="flex flex-wrap gap-2">
          <Input className="h-8 text-xs max-w-md" placeholder="https://… add a source link" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
          <Select value={linkRole} onValueChange={setLinkRole}><SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger><SelectContent>{["primary", "supporting", "discovery"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
          <Button size="sm" variant="outline" className="h-8" onClick={addLink}>Add link</Button>
        </div>
      </div>

      {isDeal && (
        <div className="border-t border-border pt-3 space-y-1">
          <p className="text-xs font-semibold">Timeline</p>
          {(extra.data?.timeline ?? []).map((e) => <p key={e.id} className="text-xs">{e.entry_date} · {e.stage ?? ""} · {e.title}</p>)}
          <div className="grid md:grid-cols-5 gap-2">
            <Input type="date" className="h-8 text-xs" value={tl.entry_date} onChange={(e) => setTl({ ...tl, entry_date: e.target.value })} />
            <Select value={tl.stage || "none"} onValueChange={(v) => setTl({ ...tl, stage: v === "none" ? "" : v })}><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Stage" /></SelectTrigger>
              <SelectContent><SelectItem value="none">Milestone</SelectItem>{Object.keys(STAGE_LABEL).map((k) => <SelectItem key={k} value={k}>{STAGE_LABEL[k].en}</SelectItem>)}</SelectContent></Select>
            <Input className="h-8 text-xs md:col-span-2" placeholder="What happened (e.g. systems integration completed)" value={tl.title} onChange={(e) => setTl({ ...tl, title: e.target.value })} />
            <Input className="h-8 text-xs" placeholder="Source link" value={tl.source_url} onChange={(e) => setTl({ ...tl, source_url: e.target.value })} />
          </div>
          <Button size="sm" variant="outline" className="h-8" onClick={addTimeline}>Add timeline entry</Button>
        </div>
      )}

      <div className="border-t border-border pt-3 grid md:grid-cols-2 gap-3">
        <div><p className="text-xs font-semibold mb-1 flex items-center gap-1"><Merge className="h-3 w-3" />Duplicate of another announcement? Merge its sources into it</p>
          <AnnouncementPicker exclude={a.id} placeholder="Find the announcement to keep…" onPick={(t) => mergeInto(t, false)} /></div>
        {isDeal && <div><p className="text-xs font-semibold mb-1">Later development of an existing deal? Add it to that deal's timeline</p>
          <AnnouncementPicker exclude={a.id} placeholder="Find the original deal…" onPick={(t) => mergeInto(t, true)} /></div>}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border pt-3">
        <Button size="sm" variant="outline" onClick={() => save()}>Save</Button>
        <Button size="sm" onClick={publish}><Check className="h-3.5 w-3.5 mr-1" />{a.status === "published" ? "Save & keep published" : "Publish"}</Button>
        {a.status === "published" && <Button size="sm" variant="outline" onClick={() => save({ status: "review" })}>Unpublish</Button>}
        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => save({ status: "rejected" })}><X className="h-3.5 w-3.5 mr-1" />Reject</Button>
        {a.status === "published" && <a href={`/company-announcements/${a.slug}`} target="_blank" rel="noreferrer" className="text-xs underline self-center">Open public page</a>}
      </div>
    </div>
  );
}

function NewRelease({ onDone, sources }: { onDone: () => void; sources: Source[] }) {
  const [f, setF] = useState({ section: "deals", company_name: "", title: "", summary: "", url: "", date: new Date().toISOString().slice(0, 10), type: "funding_round" });
  const submit = async () => {
    if (!f.company_name || !f.title || !/^https?:\/\//.test(f.url)) { toast.error("Company, headline and the release link are required"); return; }
    const manual = sources.find((s) => s.slug === "manual");
    const { data, error } = await db.from("company_announcements").insert({
      section: f.section, announcement_type: f.type, status: "review", company_name: f.company_name, title: f.title, original_title: f.title,
      summary: f.summary || null, source_language: "en", source_published_at: new Date(`${f.date}T09:00:00Z`).toISOString(),
      canonical_url: f.url, primary_source_url: f.url, primary_verified: true, source_id: manual?.id ?? null, routing_note: "Entered manually by an editor",
      deal_stage: f.section === "deals" ? "announced" : null,
    }).select("id").single();
    if (error) { toast.error(error.message); return; }
    await db.from("company_announcement_sources").insert({ announcement_id: data.id, url: f.url, role: "primary", source_name: new URL(f.url).hostname.replace(/^www\./, ""), title: f.title, published_at: new Date(`${f.date}T09:00:00Z`).toISOString() });
    toast.success("Added to the review list"); onDone();
  };
  return (
    <div className="border border-dashed border-border rounded-lg p-3 grid md:grid-cols-2 gap-2">
      <Select value={f.section} onValueChange={(v) => setF({ ...f, section: v, type: v === "deals" ? "funding_round" : "financial_results" })}><SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="listed">Listed disclosure</SelectItem><SelectItem value="deals">Deal</SelectItem></SelectContent></Select>
      <Select value={f.type} onValueChange={(v) => setF({ ...f, type: v })}><SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>{(f.section === "deals" ? DEAL_TYPE_KEYS : LISTED_TYPE_KEYS).map((k) => <SelectItem key={k} value={k}>{TYPE_LABEL[k].en}</SelectItem>)}</SelectContent></Select>
      <Input placeholder="Company" value={f.company_name} onChange={(e) => setF({ ...f, company_name: e.target.value })} />
      <Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
      <Input className="md:col-span-2" placeholder="Headline" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      <Input className="md:col-span-2" placeholder="Link to the release (company site, PDF, exchange filing)" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} />
      <Textarea className="md:col-span-2" rows={2} placeholder="Short BusinessHub summary (optional now)" value={f.summary} onChange={(e) => setF({ ...f, summary: e.target.value })} />
      <Button size="sm" onClick={submit} className="w-fit">Add for review</Button>
    </div>
  );
}
