import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DISTRICTS, EXPLORE_CATEGORIES } from "@/lib/explore";
import { MinistryReleaseForm } from "./MinistryReleaseForm";
import { FIELD_LABELS, missingForPublish } from "@/lib/venues";
import { EditionsEditor, LinksEditor, QuoteRequestsPanel, VenueEditor } from "./TourismExtras";

type Row = Record<string, any>;
const today = () => new Date().toISOString().slice(0, 10);
const FIELDS: [string, string, "text" | "area"][] = [
  ["name_en", "Name (EN)", "text"], ["name_el", "Name (EL)", "text"], ["slug", "Slug", "text"],
  ["summary_en", "Short description (EN)", "area"], ["summary_el", "Short description (EL)", "area"],
  ["locality", "Locality (EN)", "text"], ["locality_el", "Locality (EL)", "text"], ["address", "Address (EN)", "text"], ["address_el", "Address (EL)", "text"],
  ["opening_hours", "Opening hours (EN, confirmed only)", "area"], ["opening_hours_el", "Opening hours (EL)", "area"],
  ["admission", "Admission (EN, confirmed only)", "text"], ["admission_el", "Admission (EL)", "text"],
  ["booking_url", "Booking link", "text"], ["accessibility", "Accessibility (EN)", "text"], ["accessibility_el", "Accessibility (EL)", "text"],
  ["parking", "Parking (EN)", "text"], ["parking_el", "Parking (EL)", "text"],
  ["facilities", "Facilities (EN, venues)", "area"], ["facilities_el", "Facilities (EL)", "area"], ["catering", "Catering (EN, venues)", "text"], ["catering_el", "Catering (EL)", "text"],
  ["directory_company_id", "Linked business-directory record ID (optional)", "text"],
  ["official_url", "Official website / organiser", "text"], ["source_url", "Source page used", "text"], ["editor_notes", "Editor notes", "area"],
];

function useAdminData() {
  return useQuery({
    queryKey: ["admin-tourism"],
    queryFn: async () => {
      const [l, d, links, s, p] = await Promise.all([
        supabase.from("tour_listings").select("*").order("updated_at", { ascending: false }),
        supabase.from("tour_destinations").select("*").order("sort_order"),
        supabase.from("tour_listing_destinations").select("*"),
        supabase.from("tour_sources").select("*").order("name"),
        supabase.from("tour_photos").select("*").order("sort_order"),
      ]);
      return { listings: l.data ?? [], destinations: d.data ?? [], links: links.data ?? [], sources: s.data ?? [], photos: p.data ?? [] };
    },
  });
}

function ListingEditor({ row, data, onDone }: { row: Row; data: any; onDone: () => void }) {
  const [f, setF] = useState<Row>(row);
  const [dests, setDests] = useState<string[]>(data.links.filter((x: Row) => x.listing_id === row.id).map((x: Row) => x.destination_id));
  const [photo, setPhoto] = useState({ url: "", credit: "", rights: "" });
  useEffect(() => setF(row), [row]);
  const set = (k: string, v: any) => setF((p) => ({ ...p, [k]: v }));
  const save = async (status?: string) => {
    const payload: Row = { ...f, status: status ?? f.status };
    delete payload.id; delete payload.created_at; delete payload.updated_at; delete payload.quote_enabled; delete payload.destination_ids;
    for (const k of Object.keys(payload)) if (payload[k] === "") payload[k] = null;
    payload.lat = payload.lat == null ? null : Number(payload.lat); payload.lng = payload.lng == null ? null : Number(payload.lng);
    if (!payload.slug) payload.slug = String(payload.name_en ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (payload.status === "published" && (!payload.last_verified_at || !(payload.source_url || payload.official_url))) {
      toast.error("To publish, add a source or official link and a last-verified date."); return;
    }
    if (payload.status === "published" && row.status !== "published" && payload.category === "conference-venues") {
      const miss = missingForPublish(payload.verified_fields ?? []);
      if (miss.length) { toast.error(`Confirm first (Venues tab): ${miss.map((m) => FIELD_LABELS[m]).join(", ")}.`); return; }
    }
    const res = row.id ? await supabase.from("tour_listings").update(payload as any).eq("id", row.id).select().single() : await supabase.from("tour_listings").insert(payload as any).select().single();
    if (res.error) { toast.error(res.error.message); return; }
    const id = res.data.id;
    await supabase.from("tour_listing_destinations").delete().eq("listing_id", id);
    if (dests.length) await supabase.from("tour_listing_destinations").insert(dests.map((destination_id) => ({ listing_id: id, destination_id })));
    if (photo.url) {
      if (!photo.credit || !photo.rights) { toast.error("Photos need a credit and usage rights."); return; }
      await supabase.from("tour_photos").insert({ listing_id: id, ...photo });
    }
    toast.success("Saved"); onDone();
  };
  const sel = "h-9 border border-input bg-background px-2 text-sm w-full";
  return (
    <div className="border border-border p-4 space-y-3 bg-card">
      <div className="grid md:grid-cols-2 gap-3">
        {FIELDS.map(([k, label, t]) => (
          <label key={k} className={`text-xs font-semibold ${t === "area" ? "md:col-span-2" : ""}`}>{label}
            {t === "area" ? <Textarea value={f[k] ?? ""} onChange={(e) => set(k, e.target.value)} rows={2} /> : <Input value={f[k] ?? ""} onChange={(e) => set(k, e.target.value)} />}
          </label>
        ))}
        <label className="text-xs font-semibold">Category<select className={sel} value={f.category ?? ""} onChange={(e) => set("category", e.target.value)}>
          <option value="">—</option>{EXPLORE_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.en}</option>)}</select></label>
        <label className="text-xs font-semibold">District<select className={sel} value={f.district ?? ""} onChange={(e) => set("district", e.target.value)}>
          <option value="">—</option>{DISTRICTS.map((d) => <option key={d}>{d}</option>)}</select></label>
        <label className="text-xs font-semibold">Latitude<Input value={f.lat ?? ""} onChange={(e) => set("lat", e.target.value)} /></label>
        <label className="text-xs font-semibold">Longitude<Input value={f.lng ?? ""} onChange={(e) => set("lng", e.target.value)} /></label>
        <label className="text-xs flex items-center gap-2"><input type="checkbox" checked={!!f.coords_verified} onChange={(e) => set("coords_verified", e.target.checked)} />Coordinates verified from an official source</label>
        <label className="text-xs font-semibold">Last verified<div className="flex gap-2"><Input type="date" value={f.last_verified_at ?? ""} onChange={(e) => set("last_verified_at", e.target.value)} /><Button size="sm" variant="outline" type="button" onClick={() => set("last_verified_at", today())}>Verified today</Button></div></label>
        <label className="text-xs font-semibold">Source<select className={sel} value={f.source_id ?? ""} onChange={(e) => set("source_id", e.target.value)}>
          <option value="">—</option>{data.sources.map((s: Row) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
      </div>
      <div>
        <p className="text-xs font-semibold mb-1">Destinations (a place can belong to several)</p>
        <div className="flex flex-wrap gap-3">{data.destinations.map((d: Row) => (
          <label key={d.id} className="text-xs flex items-center gap-1"><input type="checkbox" checked={dests.includes(d.id)} onChange={(e) => setDests((p) => e.target.checked ? [...p, d.id] : p.filter((x) => x !== d.id))} />{d.name_en}</label>
        ))}</div>
      </div>
      <div>
        <p className="text-xs font-semibold mb-1">Photos ({data.photos.filter((p: Row) => p.listing_id === row.id).length}) — add one with recorded rights</p>
        <div className="grid md:grid-cols-3 gap-2">
          <Input placeholder="Image URL" value={photo.url} onChange={(e) => setPhoto({ ...photo, url: e.target.value })} />
          <Input placeholder="Credit / photographer" value={photo.credit} onChange={(e) => setPhoto({ ...photo, credit: e.target.value })} />
          <Input placeholder="Usage rights (e.g. licence, permission)" value={photo.rights} onChange={(e) => setPhoto({ ...photo, rights: e.target.value })} />
        </div>
      </div>
      {row.id ? (
        <div className="space-y-4 border-t border-border pt-3">
          <LinksEditor listingId={row.id} listings={data.listings} />
          {f.category === "events" && <EditionsEditor listingId={row.id} />}
          {f.category === "conference-venues" && <VenueEditor listingId={row.id} />}
        </div>
      ) : <p className="text-xs text-muted-foreground">Save the listing first to add linked listings, event editions or venue rooms.</p>}
      <div className="flex gap-2">
        <Button size="sm" onClick={() => save()}>Save</Button>
        <Button size="sm" variant="outline" onClick={() => save("published")}>Save & publish</Button>
        <Button size="sm" variant="ghost" onClick={() => save("draft")}>Move to draft</Button>
        <Button size="sm" variant="ghost" onClick={onDone}>Close</Button>
      </div>
    </div>
  );
}

export function TourismPanel() {
  const qc = useQueryClient();
  const { data } = useAdminData();
  const [editing, setEditing] = useState<Row | null>(null);
  const [tab, setTab] = useState<"listings" | "destinations" | "sources" | "quotes">("listings");
  const [onlyMissing, setOnlyMissing] = useState(false);
  if (!data) return <p className="text-sm text-muted-foreground">Loading…</p>;
  const refresh = () => { setEditing(null); qc.invalidateQueries({ queryKey: ["admin-tourism"] }); qc.invalidateQueries({ queryKey: ["explore-data"] }); };
  const counts = data.destinations.map((d: Row) => ({ d, n: data.links.filter((x: Row) => x.destination_id === d.id && data.listings.find((l: Row) => l.id === x.listing_id)?.status === "published").length }));
  const setDestStatus = async (id: string, status: string) => { const r = await supabase.from("tour_destinations").update({ status }).eq("id", id); r.error ? toast.error(r.error.message) : refresh(); };
  const saveDest = async (d: Row, k: string, v: string) => { const r = await supabase.from("tour_destinations").update({ [k]: v || null } as any).eq("id", d.id); r.error ? toast.error(r.error.message) : toast.success("Saved"); };
  return (
    <div className="space-y-4">
      <MinistryReleaseForm />
      <div className="flex gap-2">
        {(["listings", "destinations", "sources", "quotes"] as const).map((t) => <Button key={t} size="sm" variant={tab === t ? "default" : "outline"} onClick={() => setTab(t)} className="capitalize">{t === "quotes" ? "Quote requests" : t}</Button>)}
        {tab === "listings" && <label className="text-xs flex items-center gap-1 ml-2"><input type="checkbox" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} />Needs coordinates ({data.listings.filter((l: Row) => !l.coords_verified || l.lat == null).length})</label>}
        {tab === "listings" && <Button size="sm" variant="secondary" onClick={() => setEditing({ status: "draft", category: "museums-heritage" })}>Add listing</Button>}
      </div>
      {editing && <ListingEditor row={editing} data={data} onDone={refresh} />}
      {tab === "listings" && (
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-muted-foreground"><th>Name</th><th>Category</th><th>Locality</th><th>Map</th><th>Verified</th><th>Status</th><th /></tr></thead>
          <tbody>{data.listings.filter((l: Row) => !onlyMissing || !l.coords_verified || l.lat == null).map((l: Row) => (
            <tr key={l.id} className="border-t border-border">
              <td className="py-1.5">{l.name_en}</td><td>{l.category}</td><td>{l.locality}</td>
              <td>{l.coords_verified && l.lat != null ? "✓" : <span className="text-destructive text-xs font-semibold">needs coords</span>}</td><td>{l.last_verified_at ?? "—"}</td>
              <td><Badge variant={l.status === "published" ? "default" : "outline"}>{l.status}</Badge></td>
              <td><Button size="sm" variant="ghost" onClick={() => setEditing(l)}>Edit</Button></td>
            </tr>))}</tbody>
        </table>
      )}
      {tab === "quotes" && <QuoteRequestsPanel />}
      {tab === "destinations" && (
        <div className="space-y-3">{counts.map(({ d, n }: Row) => (
          <div key={d.id} className="border border-border p-3 space-y-2">
            <div className="flex items-center gap-2">
              <strong>{d.name_en}</strong><span className="text-xs text-muted-foreground">{d.kind} · {n} published places{n < 3 ? " · below target of 3" : ""}</span>
              <Badge variant={d.status === "published" ? "default" : "outline"}>{d.status}</Badge>
              <Button size="sm" variant="ghost" onClick={() => setDestStatus(d.id, d.status === "published" ? "draft" : "published")}>{d.status === "published" ? "Unpublish" : "Publish"}</Button>
            </div>
            <div className="grid md:grid-cols-2 gap-2">
              <Textarea defaultValue={d.intro_en ?? ""} rows={2} onBlur={(e) => saveDest(d, "intro_en", e.target.value)} placeholder="Intro (EN)" />
              <Textarea defaultValue={d.intro_el ?? ""} rows={2} onBlur={(e) => saveDest(d, "intro_el", e.target.value)} placeholder="Intro (EL)" />
              <Input defaultValue={d.image_url ?? ""} onBlur={(e) => saveDest(d, "image_url", e.target.value)} placeholder="Image URL (only with confirmed rights)" />
              <Input defaultValue={d.image_credit ?? ""} onBlur={(e) => saveDest(d, "image_credit", e.target.value)} placeholder="Image credit" />
              <Input defaultValue={d.image_rights ?? ""} onBlur={(e) => saveDest(d, "image_rights", e.target.value)} placeholder="Image usage rights" />
            </div>
          </div>))}</div>
      )}
      {tab === "sources" && (
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-muted-foreground"><th>Source</th><th>Scope</th><th>Status</th><th /></tr></thead>
          <tbody>{data.sources.map((s: Row) => (
            <tr key={s.id} className="border-t border-border">
              <td className="py-1.5"><a href={s.url} target="_blank" rel="noopener noreferrer" className="underline">{s.name}</a></td><td>{s.scope}</td>
              <td><Badge variant={s.status === "active" ? "default" : "outline"}>{s.status}</Badge></td>
              <td><Button size="sm" variant="ghost" onClick={async () => { await supabase.from("tour_sources").update({ status: s.status === "active" ? "pending_validation" : "active", last_checked_at: new Date().toISOString() }).eq("id", s.id); refresh(); }}>{s.status === "active" ? "Mark pending" : "Mark checked"}</Button></td>
            </tr>))}</tbody>
        </table>
      )}
    </div>
  );
}
