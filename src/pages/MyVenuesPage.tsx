import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ExploreShell } from "@/components/explore/ExploreShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FundingGate } from "@/components/funding/FundingGate";
import { UpgradeForm } from "@/components/explore/VenueOwnerActions";
import { useMyVenueIds, useVenuePlans } from "@/hooks/useVenues";
import { useExploreData } from "@/hooks/useExplore";
import { EL, type Listing } from "@/lib/explore";
import type { Lang } from "@/lib/academy";
import { currentPlanCode, planFor, UPGRADE_LABEL, uploadProblem } from "@/lib/venues";

const EDITABLE = [
  ["name_en", "Venue name"], ["summary_en", "Description"], ["official_url", "Website"], ["business_phone", "Business phone"],
  ["address", "Address"], ["facilities", "Facilities"], ["accessibility", "Accessibility"], ["parking", "Parking"],
  ["catering", "Catering"], ["av_equipment", "Audio-visual equipment"], ["rooms_note", "Room capacity corrections"],
] as const;

export default function MyVenuesPage() {
  const { user } = useAuth() as { user: { id: string } | null };
  const ids = useMyVenueIds(user?.id).data ?? [];
  const { data } = useExploreData();
  const mine = (data?.listings ?? []).filter((l) => ids.includes(l.id));
  return (
    <ExploreShell title={(lang) => EL(lang, "My venues", "Οι χώροι μου")}>
      {(lang) => (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <h2 className="font-serif text-3xl font-bold mb-2">{EL(lang, "My venues", "Οι χώροι μου")}</h2>
          {!user ? <FundingGate lang={lang} /> : !mine.length ? (
            <p className="text-sm text-muted-foreground">{EL(lang, "No venues are linked to your account yet. Open your venue's page and choose “Claim or Update This Listing”.", "Δεν υπάρχουν χώροι στον λογαριασμό σας. Ανοίξτε τη σελίδα του χώρου και επιλέξτε «Διεκδίκηση ή ενημέρωση καταχώρισης».")} <Link className="underline" to="/explore/conference-venues">{EL(lang, "Conference venues", "Χώροι συνεδρίων")}</Link></p>
          ) : mine.map((l) => <OwnerVenue key={l.id} l={l} lang={lang} userId={user.id} />)}
        </div>
      )}
    </ExploreShell>
  );
}

function OwnerVenue({ l, lang, userId }: { l: Listing; lang: Lang; userId: string }) {
  const qc = useQueryClient();
  const plans = useVenuePlans().data ?? [];
  const plan = planFor(currentPlanCode(l), plans);
  const [changes, setChanges] = useState<Record<string, string>>({});
  const [kind, setKind] = useState("logo");
  const [file, setFile] = useState<File | null>(null);
  const [perm, setPerm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [upgrade, setUpgrade] = useState(false);
  const mine = useQuery({ queryKey: ["my-upgrades", l.id], queryFn: async () => {
    const [m, c, u] = await Promise.all([
      supabase.from("venue_media").select("id,kind,status,created_at").eq("listing_id", l.id).eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("venue_change_requests").select("id,status,created_at").eq("listing_id", l.id).eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("venue_upgrade_requests").select("id,plan_code,status,payment_status,term_end,created_at").eq("listing_id", l.id).order("created_at", { ascending: false }),
    ]);
    return { media: m.data ?? [], changes: c.data ?? [], upgrades: u.data ?? [] };
  } });
  const sendChanges = async () => {
    const clean = Object.fromEntries(Object.entries(changes).filter(([, v]) => v.trim()));
    if (!Object.keys(clean).length) return;
    setBusy(true);
    const { error } = await supabase.from("venue_change_requests").insert({ listing_id: l.id, user_id: userId, changes: clean });
    setBusy(false);
    if (error) return toast.error(error.message);
    setChanges({}); qc.invalidateQueries({ queryKey: ["my-upgrades", l.id] });
    toast.success(EL(lang, "Sent for review. The public page stays as it is until approved.", "Στάλθηκε για έλεγχο. Η δημόσια σελίδα δεν αλλάζει πριν την έγκριση."));
  };
  const sendFile = async () => {
    if (!file) return;
    const p = uploadProblem(kind, file); if (p) return toast.error(p);
    if (!perm) return toast.error(EL(lang, "Please confirm you have permission to use this file.", "Επιβεβαιώστε ότι έχετε δικαίωμα χρήσης."));
    setBusy(true);
    const path = `${userId}/venues/${l.id}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const up = await supabase.storage.from("venue-submissions").upload(path, file, { contentType: file.type });
    if (up.error) { setBusy(false); return toast.error(up.error.message); }
    const { error } = await supabase.from("venue_media").insert({ listing_id: l.id, user_id: userId, kind, storage_path: path, permission_confirmed: true });
    setBusy(false);
    if (error) return toast.error(error.message);
    setFile(null); setPerm(false); qc.invalidateQueries({ queryKey: ["my-upgrades", l.id] });
    toast.success(EL(lang, "Uploaded privately for review.", "Ανέβηκε ιδιωτικά για έλεγχο."));
  };
  const d = mine.data;
  return (
    <section className="border border-border p-5 mb-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-serif text-xl font-bold"><Link to={`/explore/place/${l.slug}`} className="hover:underline">{l.name_en}</Link></h3>
        <p className="text-sm">{EL(lang, "Plan:", "Πακέτο:")} <strong>{plan?.name_en ?? "Free listing"}</strong>{plan?.code !== "free" && l.plan_expires_at ? ` · until ${new Date(l.plan_expires_at).toLocaleDateString("en-GB")}` : ""}</p>
      </div>
      <p className="text-xs text-muted-foreground mt-1">{EL(lang, `Your plan includes: one logo${plan?.photo_limit ? `, up to ${plan.photo_limit} gallery photos` : ""}${plan?.allows_cover ? ", a cover image" : ""}${plan?.allows_brochure ? ", a brochure" : ""}. Extra files can be submitted and are kept for a future upgrade.`, `Το πακέτο σας περιλαμβάνει: ένα λογότυπο${plan?.photo_limit ? `, έως ${plan.photo_limit} φωτογραφίες` : ""}${plan?.allows_cover ? ", εξώφυλλο" : ""}${plan?.allows_brochure ? ", φυλλάδιο" : ""}.`)}</p>

      <h4 className="section-label mt-5 mb-2">{EL(lang, "Suggest corrections", "Προτείνετε διορθώσεις")}</h4>
      <div className="grid sm:grid-cols-2 gap-2">
        {EDITABLE.map(([k, label]) => k === "summary_en" || k === "rooms_note" || k === "facilities"
          ? <Textarea key={k} className="sm:col-span-2" rows={2} placeholder={`${label}${(l as any)[k] ? ` — now: ${String((l as any)[k]).slice(0, 80)}` : ""}`} value={changes[k] ?? ""} onChange={(e) => setChanges({ ...changes, [k]: e.target.value })} maxLength={3000} />
          : <Input key={k} placeholder={`${label}${(l as any)[k] ? ` — now: ${String((l as any)[k]).slice(0, 60)}` : ""}`} value={changes[k] ?? ""} onChange={(e) => setChanges({ ...changes, [k]: e.target.value })} maxLength={500} />)}
      </div>
      <Button className="mt-2" size="sm" onClick={sendChanges} disabled={busy}>{EL(lang, "Send for review", "Αποστολή για έλεγχο")}</Button>

      <h4 className="section-label mt-6 mb-2">{EL(lang, "Logo, photos and brochure", "Λογότυπο, φωτογραφίες, φυλλάδιο")}</h4>
      <div className="flex flex-wrap items-center gap-2">
        <select aria-label="File type" value={kind} onChange={(e) => setKind(e.target.value)} className="h-9 border border-input bg-background px-2 text-sm">
          <option value="logo">Logo</option><option value="photo">Photo</option><option value="cover">Cover image</option><option value="brochure">Brochure (PDF)</option>
        </select>
        <input type="file" accept={kind === "brochure" ? "application/pdf" : "image/jpeg,image/png,image/webp" + (kind === "logo" ? ",image/svg+xml" : "")} onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
      </div>
      <label className="flex items-start gap-2 text-sm mt-2"><Checkbox checked={perm} onCheckedChange={(v) => setPerm(!!v)} /><span>{EL(lang, "I confirm the venue owns this file or has permission to use it on BusinessHub.cy.", "Επιβεβαιώνω ότι ο χώρος έχει δικαίωμα χρήσης του αρχείου στο BusinessHub.cy.")}</span></label>
      <Button className="mt-2" size="sm" onClick={sendFile} disabled={busy || !file}>{EL(lang, "Upload for review", "Ανέβασμα για έλεγχο")}</Button>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => setUpgrade(true)}>{EL(lang, "Request a Paid Upgrade", "Αίτημα αναβάθμισης")}</Button>
      </div>
      <Dialog open={upgrade} onOpenChange={setUpgrade}><DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">{upgrade && <UpgradeForm l={l} lang={lang} userId={userId} onDone={() => { setUpgrade(false); qc.invalidateQueries({ queryKey: ["my-upgrades", l.id] }); }} />}</DialogContent></Dialog>

      {d && (d.media.length + d.changes.length + d.upgrades.length) > 0 && (
        <div className="mt-6 text-sm">
          <h4 className="section-label mb-2">{EL(lang, "Your requests", "Τα αιτήματά σας")}</h4>
          <ul className="space-y-1">
            {d.upgrades.map((u: any) => <li key={u.id}>Upgrade · {u.plan_code} — <strong>{UPGRADE_LABEL[u.status]?.[lang] ?? u.status}</strong>{u.term_end ? ` · until ${u.term_end}` : ""}</li>)}
            {d.changes.map((c: any) => <li key={c.id}>Correction · {new Date(c.created_at).toLocaleDateString("en-GB")} — <strong>{c.status}</strong></li>)}
            {d.media.map((m: any) => <li key={m.id}>{m.kind} · {new Date(m.created_at).toLocaleDateString("en-GB")} — <strong>{m.status}</strong></li>)}
          </ul>
        </div>
      )}
    </section>
  );
}
