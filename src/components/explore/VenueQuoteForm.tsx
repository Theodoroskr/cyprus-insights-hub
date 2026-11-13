import { useRef, useState } from "react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { CheckCircle2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Lang } from "@/lib/academy";
import { EL, ROOM_LAYOUTS, type Listing } from "@/lib/explore";
import { VENUE_QUOTE_EMAIL_READY } from "@/lib/featureFlags";

/** "Request a Quote": enabled only when the venue's business email is confirmed and email sending is set up. */
export function VenueQuoteForm({ l, lang }: { l: Listing; lang: Lang }) {
  const enabled = VENUE_QUOTE_EMAIL_READY && !!l.quote_enabled;
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [fieldErr, setFieldErr] = useState<Record<string, string>>({});
  const key = useRef<string>(crypto.randomUUID()); // same key on every retry of this form, so it is saved once
  const started = useRef(Date.now());

  if (!enabled) return (
    <div className="mt-8 border border-border p-4">
      <Button disabled className="gap-2"><Mail className="h-4 w-4" />{EL(lang, "Request a Quote", "Ζητήστε προσφορά")}</Button>
      <p className="text-xs text-muted-foreground mt-2">{EL(lang, "Quote requests open once we have confirmed this venue's business email. Meanwhile, use the venue's official page.", "Τα αιτήματα προσφοράς θα ανοίξουν μόλις επιβεβαιώσουμε το επαγγελματικό email του χώρου. Μέχρι τότε, χρησιμοποιήστε την επίσημη σελίδα του χώρου.")}</p>
    </div>
  );
  if (done) return (
    <div className="mt-8 border border-foreground p-4 flex gap-3" role="status">
      <CheckCircle2 className="h-5 w-5 shrink-0" />
      <p className="text-sm">{EL(lang, "Thank you — your request is saved and is being sent to the venue. They will reply to you directly by email.", "Ευχαριστούμε — το αίτημά σας αποθηκεύτηκε και αποστέλλεται στον χώρο. Θα σας απαντήσουν απευθείας με email.")}</p>
    </div>
  );
  if (!open) return <div className="mt-8"><Button onClick={() => setOpen(true)} className="gap-2"><Mail className="h-4 w-4" />{EL(lang, "Request a Quote", "Ζητήστε προσφορά")}</Button></div>;

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = Object.fromEntries([...f.entries()].map(([k, v]) => [k, String(v)]));
    setBusy(true); setErr(null); setFieldErr({});
    const { data, error } = await supabase.functions.invoke("submit-venue-quote", {
      body: { ...body, delegate_count: Number(body.delegate_count), venue_id: l.id, request_key: key.current, language: lang, started_at: started.current },
    });
    setBusy(false);
    if (error) {
      let msg = EL(lang, "Something went wrong. Please try again.", "Κάτι πήγε στραβά. Δοκιμάστε ξανά.");
      if (error instanceof FunctionsHttpError) { try { const j = await error.context.json(); if (j.fields) setFieldErr(j.fields); if (j.error) msg = j.error; } catch { /* keep default */ } }
      setErr(msg); return;
    }
    if (data?.ok) setDone(true);
  };
  const fld = (name: string, label: string, props: Record<string, unknown> = {}) => (
    <label className="text-xs font-semibold block">{label}<Input name={name} {...props} className="mt-1 rounded-none" />{fieldErr[name] && <span className="text-destructive font-normal">{fieldErr[name]}</span>}</label>
  );
  return (
    <form onSubmit={submit} className="mt-8 border border-border p-4 space-y-3" noValidate={false}>
      <h3 className="font-serif text-xl font-bold">{EL(lang, "Request a Quote", "Ζητήστε προσφορά")}</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        {fld("full_name", EL(lang, "Your name", "Ονοματεπώνυμο"), { required: true, maxLength: 120, autoComplete: "name" })}
        {fld("organisation", EL(lang, "Organisation", "Οργανισμός"), { required: true, maxLength: 160, autoComplete: "organization" })}
        {fld("email", EL(lang, "Email", "Email"), { required: true, type: "email", maxLength: 200, autoComplete: "email" })}
        {fld("event_type", EL(lang, "Event type", "Τύπος εκδήλωσης"), { required: true, maxLength: 120, placeholder: EL(lang, "e.g. conference, seminar, gala", "π.χ. συνέδριο, σεμινάριο") })}
        {fld("preferred_dates", EL(lang, "Preferred dates", "Προτιμώμενες ημερομηνίες"), { required: true, maxLength: 200 })}
        {fld("delegate_count", EL(lang, "Delegates", "Αριθμός συνέδρων"), { required: true, type: "number", min: 1, max: 10000 })}
        <label className="text-xs font-semibold block">{EL(lang, "Room layout", "Διάταξη αίθουσας")}
          <select name="room_layout" required className="mt-1 h-10 w-full border border-input bg-background px-3 text-sm">
            {ROOM_LAYOUTS.map((x) => <option key={x.id} value={x.id}>{x[lang]}</option>)}
          </select>
        </label>
      </div>
      <label className="text-xs font-semibold block">{EL(lang, "Catering requirements", "Απαιτήσεις εστίασης")}<Textarea name="catering" maxLength={1000} rows={2} className="mt-1" /></label>
      <label className="text-xs font-semibold block">{EL(lang, "AV requirements", "Οπτικοακουστικός εξοπλισμός")}<Textarea name="av_requirements" maxLength={1000} rows={2} className="mt-1" /></label>
      <label className="text-xs font-semibold block">{EL(lang, "Additional details", "Επιπλέον λεπτομέρειες")}<Textarea name="details" maxLength={3000} rows={3} className="mt-1" /></label>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <p className="text-xs text-muted-foreground">{EL(lang, "We save your request and send it only to this venue's confirmed business email.", "Αποθηκεύουμε το αίτημά σας και το στέλνουμε μόνο στο επιβεβαιωμένο email του χώρου.")}</p>
      {err && <p className="text-sm text-destructive" role="alert">{err}</p>}
      <Button type="submit" disabled={busy}>{busy ? "…" : EL(lang, "Send request", "Αποστολή")}</Button>
    </form>
  );
}
