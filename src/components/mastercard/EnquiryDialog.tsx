import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INDUSTRIES, INTERESTS, INTERESTS_EL, Interest, Lang } from "@/lib/mastercard";

const T = {
  en: {
    title: "Request more information", desc: "Your enquiry goes to Infocredit Group, a local Mastercard partner in Cyprus, via BusinessHub.",
    name: "Full name", company: "Company name", email: "Business email", phone: "Telephone (optional)", country: "Country", industry: "Industry",
    interest: "Area of interest", message: "Message (optional)", choose: "Choose…",
    privacy: "I have read the Privacy Policy and agree that BusinessHub shares this enquiry with Infocredit Group so they can respond.",
    marketing: "I would like to receive occasional updates from BusinessHub (optional).",
    send: "Send enquiry", sending: "Sending…", done: "Thank you. Your enquiry has been received and Infocredit Group will be in touch.", close: "Close",
    policy: "Privacy Policy",
  },
  el: {
    title: "Ζητήστε περισσότερες πληροφορίες", desc: "Το αίτημά σας διαβιβάζεται μέσω του BusinessHub στην Infocredit Group, τοπικό συνεργάτη της Mastercard στην Κύπρο.",
    name: "Ονοματεπώνυμο", company: "Εταιρεία", email: "Επαγγελματικό email", phone: "Τηλέφωνο (προαιρετικό)", country: "Χώρα", industry: "Κλάδος",
    interest: "Τομέας ενδιαφέροντος", message: "Μήνυμα (προαιρετικό)", choose: "Επιλέξτε…",
    privacy: "Διάβασα την Πολιτική Απορρήτου και συμφωνώ να διαβιβαστεί το αίτημα στην Infocredit Group για να απαντήσει.",
    marketing: "Επιθυμώ να λαμβάνω περιστασιακές ενημερώσεις από το BusinessHub (προαιρετικό).",
    send: "Αποστολή", sending: "Αποστολή…", done: "Ευχαριστούμε. Λάβαμε το αίτημά σας και η Infocredit Group θα επικοινωνήσει μαζί σας.", close: "Κλείσιμο",
    policy: "Πολιτική Απορρήτου",
  },
};

const schema = z.object({
  full_name: z.string().trim().min(2, "Required").max(120),
  company: z.string().trim().min(2, "Required").max(160),
  email: z.string().trim().email("Enter a valid email").max(200),
  phone: z.string().trim().max(40).regex(/^[+()\d\s.-]*$/, "Digits only"),
  country: z.string().trim().min(2, "Required").max(80),
  industry: z.string().min(2, "Required"),
  interest: z.enum(INTERESTS, { errorMap: () => ({ message: "Required" }) }),
  message: z.string().trim().max(2000),
  privacy_ack: z.literal(true, { errorMap: () => ({ message: "Required" }) }),
});

interface Props { open: boolean; onOpenChange: (o: boolean) => void; lang?: Lang; placement: string; defaultInterest?: Interest }

export function EnquiryDialog({ open, onOpenChange, lang = "en", placement, defaultInterest }: Props) {
  const t = T[lang];
  const empty = { full_name: "", company: "", email: "", phone: "", country: "Cyprus", industry: "", interest: (defaultInterest ?? "") as string, message: "", privacy_ack: false, marketing_consent: false, website: "" };
  const [f, setF] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState("");
  const started = useRef(Date.now());

  useEffect(() => { if (open) { started.current = Date.now(); setDone(false); setServerError(""); setF((p) => ({ ...p, interest: defaultInterest ?? p.interest })); } }, [open, defaultInterest]);
  const set = (k: keyof typeof f, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(f);
    if (!r.success) { setErrors(Object.fromEntries(Object.entries(r.error.flatten().fieldErrors).map(([k, v]) => [k, v?.[0] ?? ""]))); return; }
    setErrors({}); setBusy(true); setServerError("");
    const { data, error } = await supabase.functions.invoke("submit-enquiry", {
      body: { ...r.data, marketing_consent: f.marketing_consent, website: f.website, language: lang, origin_path: window.location.pathname, placement, started_at: started.current },
    });
    setBusy(false);
    if (error || !data?.ok) { setServerError(data?.error ?? "Something went wrong. Please try again."); return; }
    setDone(true); setF(empty);
  };

  const err = (k: string) => errors[k] && <p className="text-xs text-destructive mt-1">{errors[k]}</p>;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{t.title}</DialogTitle><DialogDescription>{t.desc}</DialogDescription></DialogHeader>
        {done ? (
          <div className="space-y-4 py-4 text-center">
            <CheckCircle2 className="h-10 w-10 text-primary mx-auto" />
            <p>{t.done}</p>
            <Button onClick={() => onOpenChange(false)}>{t.close}</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3" noValidate>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label htmlFor="enq-name">{t.name}</Label><Input id="enq-name" value={f.full_name} onChange={(e) => set("full_name", e.target.value)} maxLength={120} autoComplete="name" />{err("full_name")}</div>
              <div><Label htmlFor="enq-company">{t.company}</Label><Input id="enq-company" value={f.company} onChange={(e) => set("company", e.target.value)} maxLength={160} autoComplete="organization" />{err("company")}</div>
              <div><Label htmlFor="enq-email">{t.email}</Label><Input id="enq-email" type="email" value={f.email} onChange={(e) => set("email", e.target.value)} maxLength={200} autoComplete="email" />{err("email")}</div>
              <div><Label htmlFor="enq-phone">{t.phone}</Label><Input id="enq-phone" type="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} maxLength={40} autoComplete="tel" />{err("phone")}</div>
              <div><Label htmlFor="enq-country">{t.country}</Label><Input id="enq-country" value={f.country} onChange={(e) => set("country", e.target.value)} maxLength={80} autoComplete="country-name" />{err("country")}</div>
              <div><Label>{t.industry}</Label>
                <Select value={f.industry} onValueChange={(v) => set("industry", v)}><SelectTrigger aria-label={t.industry}><SelectValue placeholder={t.choose} /></SelectTrigger>
                  <SelectContent>{INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent></Select>{err("industry")}</div>
            </div>
            <div><Label>{t.interest}</Label>
              <Select value={f.interest} onValueChange={(v) => set("interest", v)}><SelectTrigger aria-label={t.interest}><SelectValue placeholder={t.choose} /></SelectTrigger>
                <SelectContent>{INTERESTS.map((i) => <SelectItem key={i} value={i}>{lang === "el" ? INTERESTS_EL[i] : i}</SelectItem>)}</SelectContent></Select>{err("interest")}</div>
            <div><Label htmlFor="enq-msg">{t.message}</Label><Textarea id="enq-msg" rows={3} value={f.message} onChange={(e) => set("message", e.target.value)} maxLength={2000} /></div>
            {/* honeypot */}
            <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" value={f.website} onChange={(e) => set("website", e.target.value)} name="website" />
            <label className="flex items-start gap-2 text-xs"><Checkbox checked={f.privacy_ack} onCheckedChange={(v) => set("privacy_ack", v === true)} aria-label="Privacy acknowledgement" className="mt-0.5" />
              <span>{t.privacy} <Link to="/privacy" target="_blank" className="underline">{t.policy}</Link></span></label>
            {err("privacy_ack")}
            <label className="flex items-start gap-2 text-xs"><Checkbox checked={f.marketing_consent} onCheckedChange={(v) => set("marketing_consent", v === true)} aria-label="Marketing consent" className="mt-0.5" /><span>{t.marketing}</span></label>
            {serverError && <p className="text-sm text-destructive">{serverError}</p>}
            <Button type="submit" className="w-full" disabled={busy}>{busy ? t.sending : t.send}</Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
