import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, LifeBuoy, PenLine, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { LoginModal } from "@/components/auth/LoginModal";
import { RETURN_KEY } from "@/lib/funding";
import type { Lang } from "@/lib/academy";
import { EL, type Listing } from "@/lib/explore";
import { useMyVenueIds, useVenuePlans } from "@/hooks/useVenues";
import { currentPlanCode, planFor, uploadProblem } from "@/lib/venues";

type Mode = null | "claim" | "help" | "upgrade";

/** "Claim or Update This Listing", "Contact BusinessHub" and "Request a Paid Upgrade" on a venue page. */
export function VenueOwnerActions({ l, lang }: { l: Listing; lang: Lang }) {
  const { user } = useAuth() as { user: { id: string; email?: string } | null };
  const mine = useMyVenueIds(user?.id).data?.includes(l.id) ?? false;
  const [mode, setMode] = useState<Mode>(null);
  const [login, setLogin] = useState(false);
  const loc = useLocation();
  const open = (m: Mode) => { if (!user) { localStorage.setItem(RETURN_KEY, loc.pathname + loc.search); setLogin(true); return; } setMode(m); };
  return (
    <section className="mt-8 border border-border p-4">
      <h3 className="section-label mb-2">{EL(lang, "For venue representatives", "Για εκπροσώπους του χώρου")}</h3>
      {mine && <p className="text-sm mb-3 inline-flex items-center gap-1.5"><BadgeCheck className="h-4 w-4 text-secondary" />{EL(lang, "You manage this venue.", "Διαχειρίζεστε αυτόν τον χώρο.")} <Link to="/explore/my-venues" className="underline">{EL(lang, "Open My venues", "Οι χώροι μου")}</Link></p>}
      <div className="flex flex-wrap gap-2">
        {!mine && <Button variant="outline" className="gap-2" onClick={() => open("claim")}><PenLine className="h-4 w-4" />{EL(lang, "Claim or Update This Listing", "Διεκδίκηση ή ενημέρωση καταχώρισης")}</Button>}
        <Button variant="outline" className="gap-2" onClick={() => open("help")}><LifeBuoy className="h-4 w-4" />{EL(lang, "Contact BusinessHub", "Επικοινωνία με το BusinessHub")}</Button>
        <Button variant="outline" className="gap-2" onClick={() => mine ? setMode("upgrade") : open("claim")}><Sparkles className="h-4 w-4" />{EL(lang, "Request a Paid Upgrade", "Αίτημα αναβάθμισης")}</Button>
      </div>
      {!mine && <p className="text-xs text-muted-foreground mt-2">{EL(lang, "Paid upgrades are available once your claim is verified.", "Οι αναβαθμίσεις είναι διαθέσιμες μόλις επαληθευτεί η διεκδίκησή σας.")}</p>}
      {login && <LoginModal isOpen onClose={() => setLogin(false)} defaultTab="register" />}
      <Dialog open={mode === "claim" || mode === "help"} onOpenChange={(o) => !o && setMode(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {(mode === "claim" || mode === "help") && user && <ClaimForm l={l} lang={lang} mode={mode} userId={user.id} email={user.email ?? ""} onDone={() => setMode(null)} />}
        </DialogContent>
      </Dialog>
      <Dialog open={mode === "upgrade"} onOpenChange={(o) => !o && setMode(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {mode === "upgrade" && user && <UpgradeForm l={l} lang={lang} userId={user.id} onDone={() => setMode(null)} />}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function ClaimForm({ l, lang, mode, userId, email, onDone }: { l: Listing; lang: Lang; mode: "claim" | "help"; userId: string; email: string; onDone: () => void }) {
  const [f, setF] = useState({ rep_name: "", rep_role: "", organisation: "", business_email: email, details: "", request_type: mode === "help" ? "help" : "claim" });
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.rep_name.trim().length < 2 || !/^\S+@\S+\.\S+$/.test(f.business_email)) { toast.error(EL(lang, "Add your name and a business email.", "Συμπληρώστε όνομα και επαγγελματικό email.")); return; }
    for (const file of files) { const p = uploadProblem("attachment", file); if (p) { toast.error(`${file.name}: ${p}`); return; } }
    setBusy(true);
    const paths: string[] = [];
    for (const file of files.slice(0, 5)) {
      const path = `${userId}/claims/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
      const { error } = await supabase.storage.from("venue-submissions").upload(path, file, { contentType: file.type });
      if (error) { setBusy(false); toast.error(error.message); return; }
      paths.push(path);
    }
    const { error } = await supabase.from("venue_claims").insert({ listing_id: l.id, user_id: userId, ...f, attachments: paths });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(EL(lang, "Thank you — our team will review your request.", "Ευχαριστούμε — η ομάδα μας θα εξετάσει το αίτημά σας."));
    onDone();
  };
  return (
    <form onSubmit={submit} className="space-y-3">
      <DialogHeader>
        <DialogTitle>{mode === "help" ? EL(lang, "Contact BusinessHub", "Επικοινωνία με το BusinessHub") : EL(lang, "Claim or update this listing", "Διεκδίκηση ή ενημέρωση καταχώρισης")}</DialogTitle>
        <DialogDescription>{l.name_en}. {EL(lang, "We verify representatives through an email on the venue's own website domain, or another check our team agrees with you.", "Επαληθεύουμε τους εκπροσώπους μέσω email στο domain του χώρου ή με άλλον τρόπο που θα συμφωνήσουμε.")}</DialogDescription>
      </DialogHeader>
      {mode === "claim" && (
        <select aria-label={EL(lang, "Request", "Αίτημα")} value={f.request_type} onChange={set("request_type")} className="h-10 w-full border border-input bg-background px-3 text-sm">
          <option value="claim">{EL(lang, "I represent this venue and want to manage it", "Εκπροσωπώ τον χώρο και θέλω να τον διαχειρίζομαι")}</option>
          <option value="correction">{EL(lang, "Correct details only", "Μόνο διόρθωση στοιχείων")}</option>
          <option value="help">{EL(lang, "Help me complete the listing", "Βοηθήστε με να ολοκληρώσω την καταχώριση")}</option>
        </select>
      )}
      <Input required placeholder={EL(lang, "Your name", "Ονοματεπώνυμο")} value={f.rep_name} onChange={set("rep_name")} maxLength={120} />
      <div className="grid sm:grid-cols-2 gap-3">
        <Input placeholder={EL(lang, "Your role", "Θέση")} value={f.rep_role} onChange={set("rep_role")} maxLength={120} />
        <Input placeholder={EL(lang, "Organisation", "Οργανισμός")} value={f.organisation} onChange={set("organisation")} maxLength={160} />
      </div>
      <Input required type="email" placeholder={EL(lang, "Business email", "Επαγγελματικό email")} value={f.business_email} onChange={set("business_email")} maxLength={200} />
      <Textarea placeholder={EL(lang, "What should we change or add?", "Τι να αλλάξουμε ή να προσθέσουμε;")} value={f.details} onChange={set("details")} maxLength={3000} rows={4} />
      <label className="block text-xs text-muted-foreground">{EL(lang, "Optional attachments (JPG, PNG, WebP or PDF, up to 5 MB each, max 5)", "Προαιρετικά συνημμένα (JPG, PNG, WebP ή PDF, έως 5 MB, μέχρι 5)")}
        <input type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" className="block mt-1 text-sm" onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
      </label>
      <p className="text-xs text-muted-foreground">{EL(lang, "Nothing changes on the public page until our team approves it.", "Τίποτα δεν αλλάζει στη δημόσια σελίδα πριν την έγκριση της ομάδας μας.")}</p>
      <Button type="submit" disabled={busy}>{busy ? "…" : EL(lang, "Send request", "Αποστολή")}</Button>
    </form>
  );
}

export function UpgradeForm({ l, lang, userId, onDone }: { l: Listing; lang: Lang; userId: string; onDone: () => void }) {
  const plans = useVenuePlans().data ?? [];
  const current = planFor(currentPlanCode(l), plans);
  const [pick, setPick] = useState<string>("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const submit = async () => {
    if (!pick) return;
    setBusy(true);
    const { error } = await supabase.from("venue_upgrade_requests").insert({ listing_id: l.id, user_id: userId, plan_code: pick, message: msg || null });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["my-upgrades"] });
    toast.success(EL(lang, "Request received — our team will send you a quote or payment link.", "Το αίτημα παραλήφθηκε — θα σας στείλουμε προσφορά ή σύνδεσμο πληρωμής."));
    onDone();
  };
  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>{EL(lang, "Request a paid upgrade", "Αίτημα αναβάθμισης")}</DialogTitle>
        <DialogDescription>{EL(lang, "Current plan:", "Τρέχον πακέτο:")} <strong>{current ? (lang === "el" ? current.name_el ?? current.name_en : current.name_en) : "Free listing"}</strong>{l.plan_expires_at && current?.code !== "free" ? ` · ${EL(lang, "until", "έως")} ${new Date(l.plan_expires_at).toLocaleDateString("en-GB")}` : ""}</DialogDescription>
      </DialogHeader>
      <div className="grid sm:grid-cols-2 gap-3">
        {plans.filter((p) => p.code !== "free").map((p) => (
          <button type="button" key={p.code} onClick={() => setPick(p.code)} aria-pressed={pick === p.code}
            className={`text-left border p-3 ${pick === p.code ? "border-foreground ring-1 ring-foreground" : "border-border"}`}>
            <p className="font-semibold">{lang === "el" ? p.name_el ?? p.name_en : p.name_en}{p.featured && <span className="ml-2 text-[10px] uppercase tracking-wider bg-secondary text-secondary-foreground px-1.5 py-0.5">Featured</span>}</p>
            <p className="text-sm text-muted-foreground">{p.price_eur != null ? `€${p.price_eur}${p.billing_interval ? ` / ${p.billing_interval}` : ""}` : EL(lang, "Price on request", "Τιμή κατόπιν αιτήματος")}</p>
            <ul className="mt-2 text-sm list-disc pl-4 space-y-0.5">{(lang === "el" && p.benefits_el.length ? p.benefits_el : p.benefits_en).map((b) => <li key={b}>{b}</li>)}</ul>
          </button>
        ))}
      </div>
      <Textarea placeholder={EL(lang, "Anything we should know (optional)", "Σχόλια (προαιρετικά)")} value={msg} onChange={(e) => setMsg(e.target.value)} maxLength={2000} />
      <p className="text-xs text-muted-foreground">{EL(lang, "Our team will confirm the price and send a quote or payment link. Benefits switch on once payment is confirmed.", "Θα επιβεβαιώσουμε την τιμή και θα στείλουμε προσφορά ή σύνδεσμο πληρωμής. Τα οφέλη ενεργοποιούνται μετά την επιβεβαίωση πληρωμής.")}</p>
      <Button onClick={submit} disabled={!pick || busy}>{busy ? "…" : EL(lang, "Send upgrade request", "Αποστολή αιτήματος")}</Button>
    </div>
  );
}
