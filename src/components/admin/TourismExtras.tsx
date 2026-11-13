import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ROOM_LAYOUTS } from "@/lib/explore";
import { VENUE_QUOTE_EMAIL_READY } from "@/lib/featureFlags";

type Row = Record<string, any>;
const today = () => new Date().toISOString().slice(0, 10);
const blankToNull = (o: Row) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v === "" ? null : v]));
const RELATIONS = [["heritage", "Heritage site"], ["stay", "Nearby stay"], ["event", "Event"], ["route", "Route"], ["related", "Related"]] as const;

function useRows(table: string, listingId: string, col = "listing_id") {
  return useQuery({ queryKey: ["tour-extra", table, listingId], queryFn: async () => (await (supabase.from(table as any) as any).select("*").eq(col, listingId)).data ?? [] as Row[] });
}

/** Links from this listing to other listings (village → heritage, stays, events, routes). */
export function LinksEditor({ listingId, listings }: { listingId: string; listings: Row[] }) {
  const qc = useQueryClient();
  const { data = [] } = useRows("tour_listing_links", listingId, "from_listing_id");
  const [to, setTo] = useState(""); const [rel, setRel] = useState("heritage");
  const refresh = () => { qc.invalidateQueries({ queryKey: ["tour-extra", "tour_listing_links", listingId] }); qc.invalidateQueries({ queryKey: ["explore-data"] }); };
  const add = async () => {
    if (!to) return;
    const r = await supabase.from("tour_listing_links").upsert({ from_listing_id: listingId, to_listing_id: to, relation: rel as any, sort_order: data.length });
    r.error ? toast.error(r.error.message) : (setTo(""), refresh());
  };
  const byId = new Map(listings.map((l) => [l.id, l]));
  return (
    <div>
      <p className="text-xs font-semibold mb-1">Linked listings (shown as sections on village pages; drafts stay hidden until published)</p>
      <ul className="text-xs space-y-1 mb-2">{(data as Row[]).map((k) => (
        <li key={k.to_listing_id} className="flex items-center gap-2"><Badge variant="outline">{k.relation}</Badge>{byId.get(k.to_listing_id)?.name_en ?? k.to_listing_id}
          <span className="text-muted-foreground">({byId.get(k.to_listing_id)?.status})</span>
          <button className="text-destructive" onClick={async () => { await supabase.from("tour_listing_links").delete().eq("from_listing_id", listingId).eq("to_listing_id", k.to_listing_id); refresh(); }}>remove</button></li>
      ))}</ul>
      <div className="flex gap-2">
        <select className="h-8 border border-input bg-background px-2 text-xs" value={rel} onChange={(e) => setRel(e.target.value)}>{RELATIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        <select className="h-8 border border-input bg-background px-2 text-xs flex-1" value={to} onChange={(e) => setTo(e.target.value)}>
          <option value="">Choose listing…</option>{listings.filter((l) => l.id !== listingId).map((l) => <option key={l.id} value={l.id}>{l.name_en} · {l.category} · {l.status}</option>)}
        </select>
        <Button size="sm" variant="outline" onClick={add}>Link</Button>
      </div>
    </div>
  );
}

const ED_FIELDS: [string, string, "text" | "area" | "date"][] = [
  ["label", "Edition name (EN), e.g. 2026–27", "text"], ["label_el", "Edition name (EL)", "text"], ["start_date", "Start date (confirmed only)", "date"], ["end_date", "End date", "date"],
  ["opening_hours", "Opening hours (EN)", "area"], ["opening_hours_el", "Opening hours (EL)", "area"], ["programme", "Programme (EN)", "area"], ["programme_el", "Programme (EL)", "area"],
  ["visitor_info", "Visitor information (EN)", "area"], ["visitor_info_el", "Visitor information (EL)", "area"], ["source_url", "Official source link", "text"], ["editor_notes", "Editor notes", "area"],
];
/** Event editions: published only with a start date, source link and last-verified date. */
export function EditionsEditor({ listingId }: { listingId: string }) {
  const qc = useQueryClient();
  const { data = [] } = useRows("tour_event_editions", listingId);
  const [f, setF] = useState<Row | null>(null);
  const save = async (status?: string) => {
    const p: Row = blankToNull({ ...f, listing_id: listingId, status: status ?? f!.status ?? "draft" });
    delete p.created_at; delete p.updated_at;
    if (p.status === "published" && (!p.start_date || !p.source_url || !p.last_verified_at)) { toast.error("To publish an edition, add confirmed dates, the official source and a last-verified date."); return; }
    const r = p.id ? await supabase.from("tour_event_editions").update(p as any).eq("id", p.id) : await supabase.from("tour_event_editions").insert(p as any);
    if (r.error) { toast.error(r.error.message); return; }
    toast.success("Edition saved"); setF(null); qc.invalidateQueries({ queryKey: ["tour-extra", "tour_event_editions", listingId] }); qc.invalidateQueries({ queryKey: ["explore-data"] });
  };
  return (
    <div>
      <p className="text-xs font-semibold mb-1">Event editions</p>
      <ul className="text-xs space-y-1 mb-2">{(data as Row[]).map((e) => (
        <li key={e.id} className="flex items-center gap-2"><Badge variant={e.status === "published" ? "default" : "outline"}>{e.status}</Badge>{e.label} · {e.start_date ?? "dates TBC"}{e.end_date ? ` → ${e.end_date}` : ""}
          <button className="underline" onClick={() => setF(e)}>edit</button></li>
      ))}</ul>
      {f ? (
        <div className="border border-border p-3 grid md:grid-cols-2 gap-2">
          {ED_FIELDS.map(([k, label, t]) => (
            <label key={k} className={`text-xs font-semibold ${t === "area" ? "md:col-span-2" : ""}`}>{label}
              {t === "area" ? <Textarea rows={2} value={f[k] ?? ""} onChange={(e) => setF({ ...f, [k]: e.target.value })} /> : <Input type={t === "date" ? "date" : "text"} value={f[k] ?? ""} onChange={(e) => setF({ ...f, [k]: e.target.value })} />}
            </label>
          ))}
          <label className="text-xs font-semibold">Last verified<div className="flex gap-2"><Input type="date" value={f.last_verified_at ?? ""} onChange={(e) => setF({ ...f, last_verified_at: e.target.value })} /><Button size="sm" variant="outline" type="button" onClick={() => setF({ ...f, last_verified_at: today() })}>Today</Button></div></label>
          <div className="md:col-span-2 flex gap-2"><Button size="sm" onClick={() => save()}>Save</Button><Button size="sm" variant="outline" onClick={() => save("published")}>Save & publish</Button><Button size="sm" variant="ghost" onClick={() => save("draft")}>Draft</Button><Button size="sm" variant="ghost" onClick={() => setF(null)}>Cancel</Button></div>
        </div>
      ) : <Button size="sm" variant="outline" onClick={() => setF({ label: "", status: "draft" })}>Add edition</Button>}
    </div>
  );
}

/** Venue rooms (capacity by layout) and the verified business email that unlocks "Request a Quote". */
export function VenueEditor({ listingId }: { listingId: string }) {
  const qc = useQueryClient();
  const { data: rooms = [] } = useRows("tour_venue_rooms", listingId);
  const { data: contact = [] } = useRows("tour_venue_contacts", listingId);
  const c = (contact as Row[])[0];
  const [email, setEmail] = useState<string>(c?.email ?? "");
  const [room, setRoom] = useState<Row>({ name: "" });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["tour-extra"] }); qc.invalidateQueries({ queryKey: ["explore-data"] }); qc.invalidateQueries({ queryKey: ["admin-tourism"] }); };
  const saveContact = async (verify: boolean | null) => {
    const { data: s } = await supabase.auth.getSession();
    const e = (email || c?.email || "").trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(e)) { toast.error("Enter a valid business email"); return; }
    const verified = verify === null ? (c?.email === e ? c?.verified_at ?? null : null) : verify ? new Date().toISOString() : null;
    const r = await supabase.from("tour_venue_contacts").upsert({ listing_id: listingId, email: e, verified_at: verified, verified_by: verified ? s.session?.user.id : null });
    r.error ? toast.error(r.error.message) : (toast.success(verify ? "Email confirmed — quotes can open for this venue" : "Saved"), refresh());
  };
  const addRoom = async () => {
    if (!room.name) return;
    const p = blankToNull({ ...room, listing_id: listingId, sort_order: rooms.length });
    for (const x of ROOM_LAYOUTS) if (p[x.id] != null) p[x.id] = Number(p[x.id]);
    const r = await supabase.from("tour_venue_rooms").insert(p as any);
    r.error ? toast.error(r.error.message) : (setRoom({ name: "" }), refresh());
  };
  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold mb-1">Venue business email (staff only — never shown to visitors)</p>
        <div className="flex flex-wrap gap-2 items-center">
          <Input className="max-w-xs h-8" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="events@venue.com" />
          <Button size="sm" variant="outline" onClick={() => saveContact(null)}>Save</Button>
          <Button size="sm" onClick={() => saveContact(true)}>Confirm verified</Button>
          {c?.verified_at && <Button size="sm" variant="ghost" onClick={() => saveContact(false)}>Revoke</Button>}
          <Badge variant={c?.verified_at ? "default" : "outline"}>{c?.verified_at ? `verified ${String(c.verified_at).slice(0, 10)}` : "not verified"}</Badge>
          {!VENUE_QUOTE_EMAIL_READY && <span className="text-[11px] text-muted-foreground">Quote button stays disabled until email sending is set up.</span>}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold mb-1">Rooms — capacity by layout, exactly as the venue publishes it</p>
        <table className="text-xs w-full mb-2"><thead><tr className="text-left text-muted-foreground"><th>Room</th>{ROOM_LAYOUTS.map((x) => <th key={x.id}>{x.en}</th>)}<th /></tr></thead>
          <tbody>{(rooms as Row[]).map((r) => <tr key={r.id} className="border-t border-border"><td>{r.name}</td>{ROOM_LAYOUTS.map((x) => <td key={x.id}>{r[x.id] ?? "—"}</td>)}
            <td><button className="text-destructive" onClick={async () => { await supabase.from("tour_venue_rooms").delete().eq("id", r.id); refresh(); }}>remove</button></td></tr>)}</tbody></table>
        <div className="flex flex-wrap gap-1">
          <Input className="h-8 w-32" placeholder="Room name" value={room.name} onChange={(e) => setRoom({ ...room, name: e.target.value })} />
          <Input className="h-8 w-28" placeholder="Name (EL)" value={room.name_el ?? ""} onChange={(e) => setRoom({ ...room, name_el: e.target.value })} />
          {ROOM_LAYOUTS.map((x) => <Input key={x.id} className="h-8 w-20" type="number" min={1} placeholder={x.en} value={room[x.id] ?? ""} onChange={(e) => setRoom({ ...room, [x.id]: e.target.value })} />)}
          <Button size="sm" variant="outline" onClick={addRoom}>Add room</Button>
        </div>
      </div>
    </div>
  );
}

/** Staff view of quote requests and their email delivery status. */
export function QuoteRequestsPanel() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["venue-quotes"],
    queryFn: async () => {
      const [q, d] = await Promise.all([
        supabase.from("venue_quote_requests").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("venue_quote_deliveries").select("*"),
      ]);
      const del = new Map((d.data ?? []).map((x) => [x.request_id, x]));
      return (q.data ?? []).map((r) => ({ ...r, delivery: del.get(r.id) }));
    },
  });
  const retry = async (id: string) => {
    const { data: r, error } = await supabase.functions.invoke("submit-venue-quote", { body: { action: "retry", request_id: id } });
    error ? toast.error(error.message) : toast.message(`Delivery: ${r?.status}`);
    qc.invalidateQueries({ queryKey: ["venue-quotes"] });
  };
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!data?.length) return <p className="text-sm text-muted-foreground">No quote requests yet.{!VENUE_QUOTE_EMAIL_READY && " Quote requests open once an email sender domain is set up and a venue's email is confirmed."}</p>;
  return (
    <table className="w-full text-sm">
      <thead><tr className="text-left text-xs text-muted-foreground"><th>Received</th><th>Venue</th><th>From</th><th>Event</th><th>Delivery</th><th /></tr></thead>
      <tbody>{data.map((r: Row) => (
        <tr key={r.id} className="border-t border-border align-top">
          <td className="py-1.5 text-xs">{new Date(r.created_at).toLocaleString("en-GB")}</td>
          <td>{r.venue_name}</td>
          <td className="text-xs">{r.full_name}<br />{r.organisation}<br /><a className="underline" href={`mailto:${r.email}`}>{r.email}</a></td>
          <td className="text-xs">{r.event_type} · {r.delegate_count} · {r.room_layout}<br />{r.preferred_dates}{r.details && <><br /><span className="text-muted-foreground">{r.details}</span></>}</td>
          <td className="text-xs"><Badge variant={r.delivery?.status === "sent" ? "default" : r.delivery?.status === "failed" ? "destructive" : "outline"}>{r.delivery?.status ?? "—"}</Badge>
            <div className="text-muted-foreground">{r.delivery?.attempts ?? 0} attempt(s){r.delivery?.last_error ? ` · ${r.delivery.last_error}` : ""}</div></td>
          <td>{r.delivery && r.delivery.status !== "sent" && r.delivery.status !== "sending" && <Button size="sm" variant="outline" onClick={() => retry(r.id)}>Retry</Button>}</td>
        </tr>))}</tbody>
    </table>
  );
}
