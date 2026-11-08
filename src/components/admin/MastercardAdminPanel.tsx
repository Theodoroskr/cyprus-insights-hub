import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Save, Trash2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LEAD_STATUSES, RESEARCH_CATEGORIES, conversionRate } from "@/lib/mastercard";
import type { Database } from "@/integrations/supabase/types";

type Resource = Database["public"]["Tables"]["mastercard_resources"]["Row"];
type Enquiry = Database["public"]["Tables"]["commercial_enquiries"]["Row"];
type Connector = Database["public"]["Tables"]["data_connectors"]["Row"];

const fmt = (d: string) => new Date(d).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
const countBy = <T,>(rows: T[], key: (r: T) => string | null | undefined) => {
  const m = new Map<string, number>();
  for (const r of rows) { const k = key(r) || "—"; m.set(k, (m.get(k) ?? 0) + 1); }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};

export function MastercardAdminPanel() {
  const [tab, setTab] = useState<"enquiries" | "content" | "connectors">("enquiries");
  return (
    <div className="space-y-4">
      <div className="flex gap-1 border rounded-lg p-1 w-fit">
        {(["enquiries", "content", "connectors"] as const).map((t) => (
          <Button key={t} size="sm" variant={tab === t ? "default" : "ghost"} onClick={() => setTab(t)}>
            {t === "enquiries" ? "Sales enquiries" : t === "content" ? "Research & products" : "Data connectors"}
          </Button>
        ))}
      </div>
      {tab === "enquiries" ? <EnquiriesTab /> : tab === "content" ? <ContentTab /> : <ConnectorsTab />}
    </div>
  );
}

function EnquiriesTab() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("open");
  const enquiries = useQuery({ queryKey: ["mc-enquiries"], queryFn: async () => (await supabase.from("commercial_enquiries").select("*").order("created_at", { ascending: false }).limit(1000)).data ?? [] });
  const events = useQuery({
    queryKey: ["mc-cta-events"],
    queryFn: async () => (await supabase.from("cta_events").select("event, placement, interest, created_at").gte("created_at", new Date(Date.now() - 90 * 86_400_000).toISOString()).limit(20000)).data ?? [],
  });
  const staff = useQuery({
    queryKey: ["mc-staff"],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
      const ids = (roles ?? []).map((r) => r.user_id);
      const { data: profs } = ids.length ? await supabase.from("profiles").select("user_id, display_name").in("user_id", ids) : { data: [] };
      return ids.map((id) => ({ id, name: profs?.find((p) => p.user_id === id)?.display_name ?? id.slice(0, 8) }));
    },
  });

  const rows = enquiries.data ?? [];
  const shown = rows.filter((r) => status === "all" || (status === "open" ? !["converted", "closed"].includes(r.status) : r.status === status));
  const ev = events.data ?? [];
  const funnel = useMemo(() => {
    const byPlacement = new Map<string, { view: number; open: number; submit: number; outbound: number }>();
    for (const e of ev) {
      const p = byPlacement.get(e.placement) ?? { view: 0, open: 0, submit: 0, outbound: 0 };
      p[e.event as keyof typeof p]++; byPlacement.set(e.placement, p);
    }
    return [...byPlacement.entries()].sort((a, b) => b[1].view - a[1].view);
  }, [ev]);
  const totals = funnel.reduce((t, [, p]) => ({ view: t.view + p.view, open: t.open + p.open, submit: t.submit + p.submit, outbound: t.outbound + p.outbound }), { view: 0, open: 0, submit: 0, outbound: 0 });

  const update = async (id: string, patch: Partial<Enquiry>) => {
    const { error } = await supabase.from("commercial_enquiries").update(patch).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["mc-enquiries"] }); }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          ["CTA views (90d)", totals.view], ["Form opens", totals.open], ["Submissions", totals.submit],
          ["Conversion", conversionRate(totals.open, totals.submit) == null ? "—" : `${conversionRate(totals.open, totals.submit)}%`],
          ["Qualified+", rows.filter((r) => ["qualified", "proposal_requested", "converted"].includes(r.status)).length],
          ["Converted", rows.filter((r) => r.status === "converted").length],
        ].map(([l, v]) => <Card key={l as string}><CardContent className="p-3"><p className="text-xs text-muted-foreground">{l}</p><p className="text-xl font-semibold">{v}</p></CardContent></Card>)}
      </div>

      <div className="grid md:grid-cols-4 gap-3 text-xs">
        <Card><CardHeader className="pb-1"><CardTitle className="text-sm">By placement</CardTitle></CardHeader><CardContent>
          <table className="w-full"><thead className="text-muted-foreground"><tr><th className="text-left">Page</th><th>Views</th><th>Opens</th><th>Sent</th></tr></thead>
            <tbody>{funnel.map(([p, c]) => <tr key={p}><td>{p}</td><td className="text-center">{c.view}</td><td className="text-center">{c.open}</td><td className="text-center">{c.submit}</td></tr>)}</tbody></table>
        </CardContent></Card>
        {([["By interest", (r: Enquiry) => r.interest], ["By industry", (r: Enquiry) => r.industry], ["By country", (r: Enquiry) => r.country]] as const).map(([title, fn]) => (
          <Card key={title}><CardHeader className="pb-1"><CardTitle className="text-sm">{title}</CardTitle></CardHeader><CardContent className="space-y-0.5">
            {countBy(rows, fn).slice(0, 8).map(([k, n]) => <div key={k} className="flex justify-between"><span className="truncate">{k}</span><span>{n}</span></div>)}
            {rows.length === 0 && <p className="text-muted-foreground">No enquiries yet</p>}
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">Enquiries ({shown.length})</CardTitle>
          <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-44 h-8"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="open">Open</SelectItem><SelectItem value="all">All</SelectItem>{LEAD_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select>
        </CardHeader>
        <CardContent className="space-y-3">
          {shown.length === 0 && <p className="text-sm text-muted-foreground">No enquiries in this view.</p>}
          {shown.map((r) => <EnquiryRow key={r.id} r={r} staff={staff.data ?? []} onSave={update} />)}
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">Enquiries contain personal data. Only admins can see them. Infocredit Group is notified in the app (bell) only; email notifications need an email domain first.</p>
    </div>
  );
}

function EnquiryRow({ r, staff, onSave }: { r: Enquiry; staff: { id: string; name: string }[]; onSave: (id: string, p: Partial<Enquiry>) => void }) {
  const [notes, setNotes] = useState(r.admin_notes ?? "");
  return (
    <div className="border rounded-lg p-3 text-sm space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold">{r.company} <span className="font-normal text-muted-foreground">· {r.full_name}</span></p>
          <p className="text-xs text-muted-foreground">{fmt(r.created_at)} · from {r.origin_path ?? "?"} ({r.placement ?? "?"}) · {r.language.toUpperCase()}{r.marketing_consent ? " · marketing OK" : ""}</p>
        </div>
        <Badge>{r.interest}</Badge>
      </div>
      <p className="text-xs"><a className="underline" href={`mailto:${r.email}`}>{r.email}</a>{r.phone ? ` · ${r.phone}` : ""} · {r.industry} · {r.country}</p>
      {r.message && <p className="text-sm whitespace-pre-wrap bg-muted/40 rounded p-2">{r.message}</p>}
      <div className="flex flex-wrap gap-2 items-center">
        <Select value={r.status} onValueChange={(v) => onSave(r.id, { status: v })}><SelectTrigger className="w-44 h-8" aria-label="Status"><SelectValue /></SelectTrigger>
          <SelectContent>{LEAD_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select>
        <Select value={r.assigned_to ?? "none"} onValueChange={(v) => onSave(r.id, { assigned_to: v === "none" ? null : v })}><SelectTrigger className="w-44 h-8" aria-label="Assigned to"><SelectValue placeholder="Assign" /></SelectTrigger>
          <SelectContent><SelectItem value="none">Unassigned</SelectItem>{staff.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
        <Input className="flex-1 min-w-[12rem] h-8" placeholder="Internal notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <Button size="sm" variant="outline" disabled={notes === (r.admin_notes ?? "")} onClick={() => onSave(r.id, { admin_notes: notes })}><Save className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}

const blank = (): Partial<Resource> => ({ kind: "research", title: "", publisher: "Mastercard Economics Institute", category: "Economic Outlook", source_url: "", status: "draft", industries: [], applications: [], sort_order: 100 });

function ContentTab() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Resource> | null>(null);
  const items = useQuery({ queryKey: ["mc-resources-admin"], queryFn: async () => (await supabase.from("mastercard_resources").select("*").order("kind").order("sort_order")).data ?? [] });
  const refresh = () => ["mc-resources-admin", "mastercard-resources-public"].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));

  const save = async () => {
    if (!editing?.title?.trim() || !/^https:\/\//.test(editing.source_url ?? "")) { toast.error("Title and an https source link are required"); return; }
    const { id, created_at, updated_at, ...rest } = editing as Resource;
    const { error } = id ? await supabase.from("mastercard_resources").update(rest).eq("id", id) : await supabase.from("mastercard_resources").insert(rest as Resource);
    if (error) toast.error(error.message); else { toast.success("Saved"); setEditing(null); refresh(); }
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    const { error } = await supabase.from("mastercard_resources").delete().eq("id", id);
    if (error) toast.error(error.message); else refresh();
  };
  const set = (k: keyof Resource, v: unknown) => setEditing((e) => ({ ...e, [k]: v }));
  const list = (v: string) => v.split(",").map((s) => s.trim()).filter(Boolean);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Sources, research references and product descriptions. Write original summaries only — never paste report text, charts or data.</p>
        <Button size="sm" onClick={() => setEditing(blank())}><Plus className="h-4 w-4 mr-1" /> Add</Button>
      </div>
      {editing && (
        <Card><CardContent className="p-4 grid md:grid-cols-2 gap-3 text-sm">
          <Select value={editing.kind} onValueChange={(v) => set("kind", v)}><SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="research">Research publication</SelectItem><SelectItem value="product">Product information</SelectItem><SelectItem value="source">Source</SelectItem></SelectContent></Select>
          <Select value={editing.status} onValueChange={(v) => set("status", v)}><SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent></Select>
          <Input placeholder="Title (English)" value={editing.title ?? ""} onChange={(e) => set("title", e.target.value)} />
          <Input placeholder="Title (Greek)" value={editing.title_el ?? ""} onChange={(e) => set("title_el", e.target.value)} />
          <Input placeholder="Publisher" value={editing.publisher ?? ""} onChange={(e) => set("publisher", e.target.value)} />
          <Input type="date" value={editing.published_on ?? ""} onChange={(e) => set("published_on", e.target.value || null)} aria-label="Publication date" />
          <Input placeholder="Geography (e.g. Global, Europe)" value={editing.geography ?? ""} onChange={(e) => set("geography", e.target.value)} />
          <Select value={editing.category} onValueChange={(v) => set("category", v)}><SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{RESEARCH_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
          <Input className="md:col-span-2" placeholder="Source URL (https://…)" value={editing.source_url ?? ""} onChange={(e) => set("source_url", e.target.value)} />
          <Textarea className="md:col-span-2" rows={3} placeholder="Original BusinessHub summary (English)" value={editing.summary ?? ""} onChange={(e) => set("summary", e.target.value)} />
          <Textarea className="md:col-span-2" rows={2} placeholder="Summary (Greek)" value={editing.summary_el ?? ""} onChange={(e) => set("summary_el", e.target.value)} />
          <Input placeholder="Industries, comma separated" value={(editing.industries ?? []).join(", ")} onChange={(e) => set("industries", list(e.target.value))} />
          <Input placeholder="Applications (products), comma separated" value={(editing.applications ?? []).join(", ")} onChange={(e) => set("applications", list(e.target.value))} />
          <Input placeholder="Attribution" value={editing.attribution ?? ""} onChange={(e) => set("attribution", e.target.value)} />
          <Input placeholder="Licensing / usage note" value={editing.licence_note ?? ""} onChange={(e) => set("licence_note", e.target.value)} />
          <Input type="number" placeholder="Order" value={editing.sort_order ?? 100} onChange={(e) => set("sort_order", Number(e.target.value))} />
          <div className="flex gap-2 justify-end"><Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={save}>Save</Button></div>
        </CardContent></Card>
      )}
      <Card><CardContent className="p-0">
        <table className="w-full text-xs">
          <thead className="text-left text-muted-foreground"><tr><th className="p-2">Type</th><th>Title</th><th>Category</th><th>Status</th><th /></tr></thead>
          <tbody>{(items.data ?? []).map((r) => (
            <tr key={r.id} className="border-t">
              <td className="p-2">{r.kind}</td>
              <td><button className="text-left underline" onClick={() => setEditing(r)}>{r.title}</button>{!r.summary && r.kind === "research" && <span className="text-destructive ml-1">· needs summary</span>}</td>
              <td>{r.category}</td>
              <td><Badge variant={r.status === "published" ? "default" : "secondary"}>{r.status}</Badge></td>
              <td className="whitespace-nowrap"><a href={r.source_url} target="_blank" rel="noopener noreferrer" className="inline-block p-1"><ExternalLink className="h-3.5 w-3.5" /></a><button onClick={() => remove(r.id)} className="p-1" aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></button></td>
            </tr>
          ))}</tbody>
        </table>
      </CardContent></Card>
    </div>
  );
}

function ConnectorsTab() {
  const qc = useQueryClient();
  const items = useQuery({ queryKey: ["mc-connectors"], queryFn: async () => (await supabase.from("data_connectors").select("*").order("name")).data ?? [] });
  const audit = useQuery({ queryKey: ["mc-connector-audit"], queryFn: async () => (await supabase.from("data_connector_audit").select("*").order("created_at", { ascending: false }).limit(20)).data ?? [] });
  const update = async (id: string, patch: Partial<Connector>) => {
    const { error } = await supabase.from("data_connectors").update(patch).eq("id", id);
    if (error) toast.error(error.message); else { qc.invalidateQueries({ queryKey: ["mc-connectors"] }); qc.invalidateQueries({ queryKey: ["mc-connector-audit"] }); }
  };
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Prepared connections for future licensed data. A connector cannot be switched on until its licence is confirmed and a licence reference is recorded. Nothing is fetched automatically yet.</p>
      {(items.data ?? []).map((c) => <ConnectorCard key={c.id} c={c} onSave={update} />)}
      <Card><CardHeader className="pb-1"><CardTitle className="text-sm">Audit log</CardTitle></CardHeader><CardContent className="text-xs space-y-1">
        {(audit.data ?? []).map((a) => <p key={a.id}>{fmt(a.created_at)} · {JSON.stringify(a.change)}</p>)}
      </CardContent></Card>
    </div>
  );
}

function ConnectorCard({ c, onSave }: { c: Connector; onSave: (id: string, p: Partial<Connector>) => void }) {
  const [ref, setRef] = useState(c.licence_reference ?? "");
  return (
    <Card><CardContent className="p-4 space-y-2 text-sm">
      <div className="flex justify-between items-start gap-2">
        <div><p className="font-semibold">{c.name}</p><p className="text-xs text-muted-foreground">{c.provider} · auth: {c.auth_type} · schedule: {c.schedule ?? "—"} · limit: {c.usage_limit ?? "—"} · access: {c.access_scope}</p></div>
        <Badge variant={c.enabled ? "default" : "secondary"}>{c.enabled ? "On" : "Off"}</Badge>
      </div>
      {c.description && <p className="text-muted-foreground">{c.description}</p>}
      <div className="flex flex-wrap gap-3 items-center">
        <label className="flex items-center gap-2"><Switch checked={c.licence_confirmed} onCheckedChange={(v) => onSave(c.id, { licence_confirmed: v, ...(v ? {} : { enabled: false }) })} /> Licence confirmed</label>
        <Input className="w-64 h-8" placeholder="Licence / contract reference" value={ref} onChange={(e) => setRef(e.target.value)} />
        <Button size="sm" variant="outline" disabled={ref === (c.licence_reference ?? "")} onClick={() => onSave(c.id, { licence_reference: ref || null })}>Save reference</Button>
        <label className="flex items-center gap-2"><Switch checked={c.enabled} onCheckedChange={(v) => onSave(c.id, { enabled: v })} /> Enabled</label>
      </div>
    </CardContent></Card>
  );
}
