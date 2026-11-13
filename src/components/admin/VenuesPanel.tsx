import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { emailOnVenueDomain, FIELD_LABELS, matchImportRow, mergeImport, missingForPublish, PUBLISH_REQUIRED, UPGRADE_STATUSES, VENUE_TYPES } from "@/lib/venues";
import { DISTRICTS } from "@/lib/explore";

type Row = Record<string, any>;
const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString("en-GB") : "—");
const db = supabase as any;

/** Staff queue: PDF import preview, verification & publishing, owner claims, corrections, media, upgrades, plans. */
export function VenuesPanel() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["venues-admin"], queryFn: async () => {
    const t = ["venue_import_batches", "venue_import_rows", "venue_claims", "venue_representatives", "venue_change_requests", "venue_media", "venue_upgrade_requests", "venue_plans", "venue_request_history"];
    const res = await Promise.all([
      ...t.map((x) => db.from(x).select("*").order(x === "venue_plans" ? "sort_order" : x === "venue_import_batches" ? "imported_at" : x === "venue_representatives" ? "verified_at" : "created_at", { ascending: x === "venue_plans" })),
      db.from("tour_listings").select("id,slug,name_en,aliases,locality,district,address,official_url,status,verified_fields,venue_type,operating_status,plan_code,plan_expires_at,last_verified_at,category").eq("category", "conference-venues").order("name_en"),
      db.from("tour_venue_rooms").select("listing_id"),
    ]);
    for (const r of res) if (r.error) throw r.error;
    const [batches, rows, claims, reps, changes, media, upgrades, plans, history, venues, rooms] = res.map((r) => r.data as Row[]);
    return { batches, rows, claims, reps, changes, media, upgrades, plans, history, venues, rooms };
  } });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["venues-admin"] }); qc.invalidateQueries({ queryKey: ["explore-data"] }); };
  if (q.error) return <p className="text-sm text-destructive">{String((q.error as Error).message)}</p>;
  if (!q.data) return <p className="text-sm text-muted-foreground">Loading venues…</p>;
  const d = q.data;
  const vName = (id: string) => d.venues.find((v) => v.id === id)?.name_en ?? id.slice(0, 8);
  const pending = {
    claims: d.claims.filter((c) => ["received", "under_review"].includes(c.status)).length,
    changes: d.changes.filter((c) => c.status === "pending").length,
    media: d.media.filter((m) => m.status === "pending").length,
    upgrades: d.upgrades.filter((u) => !["active", "declined", "expired"].includes(u.status)).length,
    imports: d.rows.filter((r) => r.decision === "pending").length,
  };
  const hist = (id: string) => d.history.filter((h) => h.entity_id === id);
  return (
    <div>
      <h2 className="font-serif text-2xl font-bold mb-1">Conference & Meeting Venues</h2>
      <p className="text-sm text-muted-foreground mb-4">{d.venues.length} venue profiles · {d.venues.filter((v) => v.status === "published").length} published · {d.reps.length} verified representatives</p>
      <Tabs defaultValue="import">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="import">Import ({pending.imports})</TabsTrigger>
          <TabsTrigger value="verify">Verify & publish</TabsTrigger>
          <TabsTrigger value="claims">Claims ({pending.claims})</TabsTrigger>
          <TabsTrigger value="changes">Corrections ({pending.changes})</TabsTrigger>
          <TabsTrigger value="media">Logos & photos ({pending.media})</TabsTrigger>
          <TabsTrigger value="upgrades">Upgrades ({pending.upgrades})</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
        </TabsList>
        <TabsContent value="import"><ImportTab d={d} refresh={refresh} /></TabsContent>
        <TabsContent value="verify"><VerifyTab d={d} refresh={refresh} /></TabsContent>
        <TabsContent value="claims">
          {d.claims.map((c) => {
            const v = d.venues.find((x) => x.id === c.listing_id);
            const domainOk = emailOnVenueDomain(c.business_email, v?.official_url);
            const setStatus = async (status: string, method?: string) => {
              const r = await db.from("venue_claims").update({ status, verification_method: method ?? c.verification_method, reviewed_at: new Date().toISOString() }).eq("id", c.id);
              if (r.error) return toast.error(r.error.message);
              if (status === "verified" && c.request_type === "claim") {
                const r2 = await db.from("venue_representatives").upsert({ listing_id: c.listing_id, user_id: c.user_id, claim_id: c.id }, { onConflict: "listing_id,user_id" });
                if (r2.error) return toast.error(r2.error.message);
              }
              refresh();
            };
            return (
              <div key={c.id} className="border border-border p-3 mb-2 text-sm">
                <div className="flex flex-wrap justify-between gap-2"><strong>{vName(c.listing_id)}</strong><Badge variant="outline">{c.request_type} · {c.status}</Badge></div>
                <p>{c.rep_name}{c.rep_role ? `, ${c.rep_role}` : ""}{c.organisation ? ` — ${c.organisation}` : ""} · {c.business_email} {domainOk ? <Badge className="ml-1">email on venue domain</Badge> : <Badge variant="destructive" className="ml-1">not on venue domain</Badge>}</p>
                {c.details && <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{c.details}</p>}
                {c.attachments?.length > 0 && <p className="mt-1">{c.attachments.map((p: string) => <SignedLink key={p} path={p} />)}</p>}
                <p className="text-xs text-muted-foreground mt-1">Filed {fmt(c.created_at)} · history: {hist(c.id).map((h) => h.detail?.to ?? h.action).join(" → ") || "—"}</p>
                {["received", "under_review"].includes(c.status) && <div className="flex flex-wrap gap-2 mt-2">
                  <Button size="sm" variant="outline" onClick={() => setStatus("under_review")}>Under review</Button>
                  {c.request_type === "claim" && <Button size="sm" disabled={!domainOk} onClick={() => setStatus("verified", "venue_domain_email")}>Verify (venue-domain email)</Button>}
                  {c.request_type === "claim" && <Button size="sm" variant="secondary" onClick={() => { if (confirm("Verified by another method you approved (e.g. call to the venue's listed number)?")) setStatus("verified", "admin_approved"); }}>Verify (other method)</Button>}
                  {c.request_type !== "claim" && <Button size="sm" onClick={() => setStatus("resolved")}>Mark handled</Button>}
                  <Button size="sm" variant="destructive" onClick={() => setStatus("declined")}>Decline</Button>
                </div>}
              </div>
            );
          })}
          {!d.claims.length && <p className="text-sm text-muted-foreground">No claims yet.</p>}
        </TabsContent>
        <TabsContent value="changes">
          {d.changes.map((c) => {
            const apply = async (ok: boolean) => {
              if (ok) {
                const v = d.venues.find((x) => x.id === c.listing_id);
                const { rooms_note, ...fields } = c.changes ?? {};
                const keys = Object.keys(fields);
                const verified = Array.from(new Set([...(v?.verified_fields ?? []), ...keys, ...(fields.name_en ? ["name"] : []), ...(fields.official_url ? ["official_url"] : []), ...(fields.business_phone ? ["business_contact"] : [])]));
                if (keys.length) { const r = await db.from("tour_listings").update({ ...fields, verified_fields: verified, last_verified_at: new Date().toISOString().slice(0, 10) }).eq("id", c.listing_id); if (r.error) return toast.error(r.error.message); }
                if (rooms_note) toast.info("Room capacity note: update the rooms in the TourismHub tab, then tick “Room capacities” in Verify & publish.");
              }
              const r = await db.from("venue_change_requests").update({ status: ok ? "approved" : "rejected", reviewed_at: new Date().toISOString() }).eq("id", c.id);
              r.error ? toast.error(r.error.message) : refresh();
            };
            return (
              <div key={c.id} className="border border-border p-3 mb-2 text-sm">
                <div className="flex justify-between"><strong>{vName(c.listing_id)}</strong><Badge variant="outline">{c.status}</Badge></div>
                <dl className="mt-1">{Object.entries(c.changes ?? {}).map(([k, v]) => <div key={k} className="grid grid-cols-[160px_1fr] gap-2"><dt className="font-semibold">{k}</dt><dd className="whitespace-pre-wrap">{String(v)}</dd></div>)}</dl>
                <p className="text-xs text-muted-foreground mt-1">Sent {fmt(c.created_at)}</p>
                {c.status === "pending" && <div className="flex gap-2 mt-2"><Button size="sm" onClick={() => apply(true)}>Approve & publish change</Button><Button size="sm" variant="destructive" onClick={() => apply(false)}>Reject</Button></div>}
              </div>
            );
          })}
          {!d.changes.length && <p className="text-sm text-muted-foreground">No corrections yet.</p>}
        </TabsContent>
        <TabsContent value="media"><MediaTab d={d} refresh={refresh} vName={vName} /></TabsContent>
        <TabsContent value="upgrades"><UpgradesTab d={d} refresh={refresh} vName={vName} /></TabsContent>
        <TabsContent value="plans"><PlansTab d={d} refresh={refresh} /></TabsContent>
      </Tabs>
    </div>
  );
}

function SignedLink({ path }: { path: string }) {
  const open = async () => { const { data, error } = await supabase.storage.from("venue-submissions").createSignedUrl(path, 300); error ? toast.error(error.message) : window.open(data.signedUrl, "_blank"); };
  return <button type="button" onClick={open} className="underline mr-2 text-xs">{path.split("/").pop()}</button>;
}

function ImportTab({ d, refresh }: { d: Row; refresh: () => void }) {
  const [busy, setBusy] = useState(false);
  const upload = async (file: File) => {
    if (file.type !== "application/pdf") return toast.error("Upload the source PDF.");
    setBusy(true);
    const { data: s } = await supabase.auth.getSession();
    const path = `${s.session?.user.id}/imports/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const up = await supabase.storage.from("venue-submissions").upload(path, file, { contentType: file.type });
    if (up.error) { setBusy(false); return toast.error(up.error.message); }
    const r = await db.from("venue_import_batches").insert({ source_name: file.name, source_path: path, created_by: s.session?.user.id });
    setBusy(false); r.error ? toast.error(r.error.message) : (toast.success("Stored privately. Rows appear here once the file is parsed."), refresh());
  };
  const createDraft = async (r: Row) => {
    const slug = r.name.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + (r.locality ? `-${r.locality.toLowerCase().replace(/[^a-z0-9]+/g, "-")}` : "");
    const ins = await db.from("tour_listings").insert({ slug, name_en: r.name, category: "conference-venues", district: DISTRICTS.includes(r.district) ? r.district : null, locality: r.locality, address: r.address, official_url: r.website, business_phone: r.phone, venue_type: "hotel", status: "draft", aliases: [], editor_notes: `Imported from PDF page ${r.source_page ?? "?"}` }).select("id").single();
    if (ins.error) return toast.error(ins.error.message);
    await addRooms(ins.data.id, r.rooms);
    const u = await db.from("venue_import_rows").update({ decision: "created", created_listing_id: ins.data.id, decided_at: new Date().toISOString() }).eq("id", r.id);
    u.error ? toast.error(u.error.message) : refresh();
  };
  const addRooms = async (listingId: string, rooms: Row[]) => {
    if (!rooms?.length) return;
    const r = await db.from("tour_venue_rooms").insert(rooms.map((x, i) => ({ listing_id: listingId, name: x.name || (rooms.length === 1 ? "Largest room (2021 figure)" : `Room ${i + 1}`), theatre: x.theatre ?? null, classroom: x.classroom ?? null, banquet: x.banquet ?? null, cocktail: x.cocktail ?? null, boardroom: x.boardroom ?? null, u_shape: x.u_shape ?? null, area_sqm: x.area_sqm ?? null, sort_order: i })));
    if (r.error) toast.error(r.error.message);
  };
  const mergeInto = async (r: Row, listingId: string) => {
    const v = d.venues.find((x: Row) => x.id === listingId);
    if (!v) return;
    const vf: string[] = v.verified_fields ?? [];
    const protectedCols = [...vf, ...(vf.includes("name") ? ["name_en"] : []), ...(vf.includes("business_contact") ? ["business_phone"] : [])];
    const patch = mergeImport(v, { locality: r.locality, address: r.address, official_url: r.website, business_phone: r.phone }, protectedCols);
    if (Object.keys(patch).length) { const u = await db.from("tour_listings").update(patch).eq("id", listingId); if (u.error) return toast.error(u.error.message); }
    const hasRooms = d.rooms.some((x: Row) => x.listing_id === listingId);
    if (!hasRooms && !vf.includes("room_capacities")) await addRooms(listingId, r.rooms);
    if (v.name_en !== r.name && !(v.aliases ?? []).includes(r.name)) await db.from("tour_listings").update({ aliases: [...(v.aliases ?? []), r.name] }).eq("id", listingId);
    const u = await db.from("venue_import_rows").update({ decision: "merged", created_listing_id: listingId, decided_at: new Date().toISOString() }).eq("id", r.id);
    u.error ? toast.error(u.error.message) : refresh();
  };
  const skip = async (r: Row) => { const u = await db.from("venue_import_rows").update({ decision: "skipped", decided_at: new Date().toISOString() }).eq("id", r.id); u.error ? toast.error(u.error.message) : refresh(); };
  const rematch = async () => {
    for (const r of d.rows.filter((x: Row) => x.decision === "pending")) {
      const m = matchImportRow(r, d.venues);
      await db.from("venue_import_rows").update({ match_status: m.status, matched_listing_id: m.listingId, match_note: m.note }).eq("id", r.id);
    }
    refresh();
  };
  return (
    <div className="text-sm">
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <label className="inline-flex items-center gap-2">Source PDF <input type="file" accept="application/pdf" disabled={busy} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} /></label>
        <Button size="sm" variant="outline" onClick={rematch}>Re-run matching</Button>
      </div>
      {d.batches.map((b: Row) => {
        const rows = d.rows.filter((r: Row) => r.batch_id === b.id);
        return (
          <div key={b.id} className="mb-6">
            <p className="font-semibold">{b.source_name} · imported {fmt(b.imported_at)}{b.source_date ? ` · source dated ${fmt(b.source_date)}` : ""} · {rows.length} rows {b.source_path && <SignedLink path={b.source_path} />}</p>
            {b.notes && <p className="text-muted-foreground">{b.notes}</p>}
            <div className="overflow-x-auto"><table className="w-full border border-border mt-2">
              <thead><tr className="bg-muted text-left"><th className="p-2">Page</th><th className="p-2">Source row</th><th className="p-2">Rooms</th><th className="p-2">Proposed match</th><th className="p-2">Needs verification</th><th className="p-2"></th></tr></thead>
              <tbody>{rows.map((r: Row) => (
                <tr key={r.id} className="border-t border-border align-top">
                  <td className="p-2">{r.source_page ?? "—"}</td>
                  <td className="p-2"><strong>{r.name}</strong><br /><span className="text-muted-foreground">{[r.locality, r.district].filter(Boolean).join(", ")}{r.website ? ` · ${r.website}` : ""}</span></td>
                  <td className="p-2">{(r.rooms ?? []).length}</td>
                  <td className="p-2"><Badge variant={r.match_status === "new" ? "outline" : r.match_status === "match" ? "default" : "destructive"}>{r.match_status}</Badge>{r.matched_listing_id && <> → {d.venues.find((v: Row) => v.id === r.matched_listing_id)?.name_en}</>}<br /><span className="text-xs text-muted-foreground">{r.match_note}</span></td>
                  <td className="p-2 text-xs">{(r.needs_verification ?? []).map((f: string) => FIELD_LABELS[f] ?? f).join(", ") || "—"}</td>
                  <td className="p-2 whitespace-nowrap">{r.decision !== "pending" ? <Badge variant="outline">{r.decision}</Badge> : <div className="flex flex-col gap-1">
                    {r.matched_listing_id && <Button size="sm" onClick={() => mergeInto(r, r.matched_listing_id)}>Merge into match</Button>}
                    <Button size="sm" variant={r.matched_listing_id ? "outline" : "default"} onClick={() => createDraft(r)}>Create draft</Button>
                    <Button size="sm" variant="ghost" onClick={() => skip(r)}>Skip</Button>
                  </div>}</td>
                </tr>
              ))}</tbody>
            </table></div>
          </div>
        );
      })}
      {!d.batches.length && <p className="text-muted-foreground">No source files imported yet.</p>}
    </div>
  );
}

function VerifyTab({ d, refresh }: { d: Row; refresh: () => void }) {
  const save = async (v: Row, patch: Row) => { const r = await db.from("tour_listings").update(patch).eq("id", v.id); r.error ? toast.error(r.error.message) : refresh(); };
  return (
    <div className="text-sm space-y-2">
      <p className="text-muted-foreground">Tick each detail only after confirming it with a current source (venue website, phone call, owner). A venue can be published once all five are confirmed. Later imports never overwrite ticked details.</p>
      {d.venues.map((v: Row) => {
        const vf: string[] = v.verified_fields ?? [];
        const miss = missingForPublish(vf);
        const toggle = (f: string) => save(v, { verified_fields: vf.includes(f) ? vf.filter((x) => x !== f) : [...vf, f], last_verified_at: new Date().toISOString().slice(0, 10) });
        return (
          <div key={v.id} className="border border-border p-3">
            <div className="flex flex-wrap justify-between gap-2"><strong>{v.name_en}</strong><span><Badge variant="outline">{v.status}</Badge> <span className="text-xs text-muted-foreground">last verified {fmt(v.last_verified_at)}</span></span></div>
            <div className="flex flex-wrap gap-3 mt-2">{PUBLISH_REQUIRED.map((f) => <label key={f} className="inline-flex items-center gap-1"><input type="checkbox" checked={vf.includes(f)} onChange={() => toggle(f)} />{FIELD_LABELS[f]}</label>)}</div>
            <div className="flex flex-wrap gap-2 mt-2 items-center">
              <select aria-label="Venue type" className="h-8 border border-input bg-background px-2" value={v.venue_type ?? ""} onChange={(e) => save(v, { venue_type: e.target.value || null })}><option value="">Type…</option>{VENUE_TYPES.map((t) => <option key={t.id} value={t.id}>{t.en}</option>)}</select>
              <select aria-label="Operating status" className="h-8 border border-input bg-background px-2" value={v.operating_status ?? ""} onChange={(e) => save(v, { operating_status: e.target.value || null })}><option value="">Operating status…</option><option value="operating">Operating</option><option value="closed">Closed</option><option value="renamed">Renamed</option><option value="unknown">Unknown</option></select>
              {v.status !== "published"
                ? <Button size="sm" disabled={miss.length > 0 || v.operating_status !== "operating" || !v.official_url} title={miss.length ? `Confirm: ${miss.map((m) => FIELD_LABELS[m]).join(", ")}` : ""} onClick={() => save(v, { status: "published", last_verified_at: new Date().toISOString().slice(0, 10) })}>Publish</Button>
                : <Button size="sm" variant="outline" onClick={() => save(v, { status: "draft" })}>Unpublish</Button>}
              {miss.length > 0 && <span className="text-xs text-muted-foreground">Still to confirm: {miss.map((m) => FIELD_LABELS[m]).join(", ")}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MediaTab({ d, refresh, vName }: { d: Row; refresh: () => void; vName: (id: string) => string }) {
  const decide = async (m: Row, ok: boolean) => {
    if (!ok) { const r = await db.from("venue_media").update({ status: "rejected", reviewed_at: new Date().toISOString() }).eq("id", m.id); return r.error ? toast.error(r.error.message) : refresh(); }
    const dl = await supabase.storage.from("venue-submissions").download(m.storage_path);
    if (dl.error) return toast.error(dl.error.message);
    const dest = `venues/${m.listing_id}/${m.storage_path.split("/").pop()}`;
    const up = await supabase.storage.from("banner-images").upload(dest, dl.data, { contentType: dl.data.type, upsert: true });
    if (up.error) return toast.error(up.error.message);
    const url = supabase.storage.from("banner-images").getPublicUrl(dest).data.publicUrl;
    if (m.kind === "logo") await db.from("venue_media").update({ status: "replaced" }).eq("listing_id", m.listing_id).eq("kind", "logo").eq("status", "approved");
    const r = await db.from("venue_media").update({ status: "approved", public_url: url, reviewed_at: new Date().toISOString() }).eq("id", m.id);
    if (r.error) return toast.error(r.error.message);
    const col = m.kind === "logo" ? "logo_url" : m.kind === "cover" ? "cover_url" : m.kind === "brochure" ? "brochure_url" : null;
    if (col) await db.from("tour_listings").update({ [col]: url }).eq("id", m.listing_id);
    refresh();
  };
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
      {d.media.map((m: Row) => (
        <div key={m.id} className="border border-border p-3">
          <div className="flex justify-between"><strong>{vName(m.listing_id)}</strong><Badge variant="outline">{m.kind} · {m.status}</Badge></div>
          <MediaPreview m={m} />
          <p className="text-xs text-muted-foreground">Sent {fmt(m.created_at)} · permission confirmed: {m.permission_confirmed ? "yes" : "no"}</p>
          {m.status === "pending" && <div className="flex gap-2 mt-2"><Button size="sm" onClick={() => decide(m, true)}>Approve</Button><Button size="sm" variant="destructive" onClick={() => decide(m, false)}>Reject</Button></div>}
        </div>
      ))}
      {!d.media.length && <p className="text-muted-foreground">No files yet.</p>}
    </div>
  );
}
function MediaPreview({ m }: { m: Row }) {
  const q = useQuery({ queryKey: ["venue-media-preview", m.id, m.public_url], queryFn: async () => m.public_url ?? (await supabase.storage.from("venue-submissions").createSignedUrl(m.storage_path, 600)).data?.signedUrl ?? null });
  if (!q.data) return null;
  return m.kind === "brochure" ? <a href={q.data} target="_blank" rel="noreferrer" className="underline block my-2">Open PDF</a> : <img src={q.data} alt="" className="my-2 h-32 w-full object-contain bg-muted" />;
}

function UpgradesTab({ d, refresh, vName }: { d: Row; refresh: () => void; vName: (id: string) => string }) {
  const [edit, setEdit] = useState<Record<string, Row>>({});
  const today = new Date().toISOString().slice(0, 10);
  const save = async (u: Row, patch: Row) => { const r = await db.from("venue_upgrade_requests").update(patch).eq("id", u.id); r.error ? toast.error(r.error.message) : (setEdit((e) => ({ ...e, [u.id]: {} })), refresh()); };
  const expireEnded = async () => {
    const ended = d.upgrades.filter((u: Row) => u.status === "active" && u.term_end && u.term_end < today);
    for (const u of ended) await db.from("venue_upgrade_requests").update({ status: "expired" }).eq("id", u.id);
    toast.success(`${ended.length} ended term(s) closed`); refresh();
  };
  return (
    <div className="text-sm">
      <Button size="sm" variant="outline" className="mb-3" onClick={expireEnded}>Close ended terms</Button>
      <p className="text-xs text-muted-foreground mb-3">Card checkout is not set up: send a quote or payment link, then record the payment here. A paid plan shows only until its end date, then the listing returns to the free display automatically; approved photos are kept.</p>
      {d.upgrades.map((u: Row) => {
        const e = edit[u.id] ?? {};
        const val = (k: string) => (e[k] ?? u[k] ?? "") as string;
        const setV = (k: string, v: string) => setEdit((x) => ({ ...x, [u.id]: { ...e, [k]: v } }));
        return (
          <div key={u.id} className="border border-border p-3 mb-2">
            <div className="flex flex-wrap justify-between gap-2"><strong>{vName(u.listing_id)} → {u.plan_code}</strong><span><Badge variant="outline">{u.status}</Badge> <Badge variant={u.payment_status === "paid" ? "default" : "outline"}>{u.payment_status}</Badge></span></div>
            {u.message && <p className="text-muted-foreground">{u.message}</p>}
            <div className="grid sm:grid-cols-3 gap-2 mt-2">
              <select aria-label="Status" className="h-9 border border-input bg-background px-2" value={val("status")} onChange={(ev) => setV("status", ev.target.value)}>{UPGRADE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
              <select aria-label="Payment" className="h-9 border border-input bg-background px-2" value={val("payment_status")} onChange={(ev) => setV("payment_status", ev.target.value)}><option value="unpaid">unpaid</option><option value="paid">paid (verified)</option><option value="refunded">refunded</option></select>
              <Input placeholder="Quoted price €" value={val("quoted_price_eur")} onChange={(ev) => setV("quoted_price_eur", ev.target.value)} />
              <Input placeholder="Payment reference (unique)" value={val("payment_reference")} onChange={(ev) => setV("payment_reference", ev.target.value)} />
              <Input type="date" aria-label="Term start" value={val("term_start")} onChange={(ev) => setV("term_start", ev.target.value)} />
              <Input type="date" aria-label="Term end" value={val("term_end")} onChange={(ev) => setV("term_end", ev.target.value)} />
            </div>
            <Input className="mt-2" placeholder="Staff notes" value={val("admin_notes")} onChange={(ev) => setV("admin_notes", ev.target.value)} />
            <Button size="sm" className="mt-2" disabled={!Object.keys(e).length} onClick={() => {
              const patch: Row = { ...e };
              for (const k of Object.keys(patch)) if (patch[k] === "") patch[k] = null;
              if (patch.payment_status === "paid") patch.payment_method = patch.payment_method ?? "offline_verified";
              save(u, patch);
            }}>Save</Button>
            <p className="text-xs text-muted-foreground mt-1">Requested {fmt(u.created_at)}{u.term_end ? ` · term ends ${fmt(u.term_end)}` : ""} · history: {d.history.filter((h: Row) => h.entity_id === u.id).map((h: Row) => h.detail?.to ?? h.action).join(" → ")}</p>
          </div>
        );
      })}
      {!d.upgrades.length && <p className="text-muted-foreground">No upgrade requests yet.</p>}
    </div>
  );
}

function PlansTab({ d, refresh }: { d: Row; refresh: () => void }) {
  const [edit, setEdit] = useState<Record<string, Row>>({});
  return (
    <div className="space-y-3 text-sm">
      {d.plans.map((p: Row) => {
        const e = edit[p.code] ?? {};
        const v = (k: string) => e[k] ?? (Array.isArray(p[k]) ? p[k].join("\n") : p[k] ?? "");
        const setV = (k: string, x: any) => setEdit((s) => ({ ...s, [p.code]: { ...e, [k]: x } }));
        const save = async () => {
          const patch: Row = { ...e, updated_at: new Date().toISOString() };
          for (const k of ["benefits_en", "benefits_el"]) if (k in patch) patch[k] = String(patch[k]).split("\n").map((s) => s.trim()).filter(Boolean);
          for (const k of ["price_eur", "photo_limit"]) if (k in patch) patch[k] = patch[k] === "" ? null : Number(patch[k]);
          const r = await db.from("venue_plans").update(patch).eq("code", p.code);
          r.error ? toast.error(r.error.message) : (setEdit((s) => ({ ...s, [p.code]: {} })), refresh());
        };
        return (
          <div key={p.code} className="border border-border p-3">
            <p className="font-semibold mb-2">{p.code}</p>
            <div className="grid sm:grid-cols-2 gap-2">
              <Input placeholder="Name (EN)" value={v("name_en")} onChange={(x) => setV("name_en", x.target.value)} />
              <Input placeholder="Name (EL)" value={v("name_el")} onChange={(x) => setV("name_el", x.target.value)} />
              <Input placeholder="Price € (blank = on request)" value={v("price_eur")} onChange={(x) => setV("price_eur", x.target.value)} />
              <Input placeholder="Billing interval (e.g. year)" value={v("billing_interval")} onChange={(x) => setV("billing_interval", x.target.value)} />
              <Input placeholder="Gallery photo limit" value={v("photo_limit")} onChange={(x) => setV("photo_limit", x.target.value)} />
              <div className="flex flex-wrap gap-3 items-center">{["allows_cover", "allows_brochure", "featured", "active"].map((k) => <label key={k} className="inline-flex gap-1 items-center"><input type="checkbox" checked={!!(e[k] ?? p[k])} onChange={(x) => setV(k, x.target.checked)} />{k.replace("allows_", "")}</label>)}</div>
              <textarea className="border border-input p-2 bg-background" rows={4} placeholder="Benefits (EN), one per line" value={v("benefits_en")} onChange={(x) => setV("benefits_en", x.target.value)} />
              <textarea className="border border-input p-2 bg-background" rows={4} placeholder="Benefits (EL), one per line" value={v("benefits_el")} onChange={(x) => setV("benefits_el", x.target.value)} />
            </div>
            <Button size="sm" className="mt-2" disabled={!Object.keys(e).length} onClick={save}>Save plan</Button>
          </div>
        );
      })}
    </div>
  );
}
