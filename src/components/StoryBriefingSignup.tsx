import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Check } from "lucide-react";
import { toast } from "sonner";
import { briefingSignupRow, briefingSignupResult } from "@/lib/briefingSignup";

/** One-step sign-up box for the free weekly Cyprus business briefing, shown on every story page. */
export function StoryBriefingSignup({ greek = false }: { greek?: boolean }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("newsletter_subscribers").insert(briefingSignupRow(email));
    setBusy(false);
    const result = briefingSignupResult(error);
    if (result === "error") {
      toast.error(greek ? "Κάτι πήγε στραβά. Δοκιμάστε ξανά." : "Something went wrong. Please try again.");
      return;
    }
    setDone(true);
  };

  return (
    <section aria-label="Weekly briefing sign-up" className="not-prose my-10 rounded-xl navy-gradient text-primary-foreground p-6 md:p-8">
      {done ? (
        <div className="flex items-start gap-3">
          <Check className="h-5 w-5 text-secondary mt-0.5 shrink-0" />
          <div>
            <p className="font-serif font-bold text-lg">{greek ? "Εγγραφήκατε" : "You're signed up"}</p>
            <p className="text-sm text-primary-foreground/70">
              {greek
                ? "Θα λαμβάνετε την εβδομαδιαία ενημέρωση για τις επιχειρήσεις της Κύπρου."
                : "The weekly Cyprus business briefing will arrive in your inbox."}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-2">
            <Mail className="h-4 w-4 text-secondary" />
            <span className="text-[10px] uppercase tracking-[0.15em] font-semibold text-secondary">
              {greek ? "Δωρεάν εβδομαδιαία ενημέρωση" : "Free weekly briefing"}
            </span>
          </div>
          <h2 className="font-serif font-bold text-xl md:text-2xl mb-1">
            {greek ? "Η εβδομάδα των επιχειρήσεων στην Κύπρο, σε ένα email" : "The week in Cyprus business, in one email"}
          </h2>
          <p className="text-sm text-primary-foreground/70 mb-4">
            {greek
              ? "Οι σημαντικότερες ειδήσεις, οι ρυθμιστικές αλλαγές και τα στοιχεία της εβδομάδας. Δωρεάν, κάθε εβδομάδα."
              : "The week's most-read stories, regulatory changes and figures. Free, once a week."}
          </p>
          <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
            <Input
              type="email"
              required
              aria-label={greek ? "Το email σας" : "Your email"}
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40 flex-1"
            />
            <Button type="submit" disabled={busy} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold shrink-0">
              {busy ? (greek ? "Εγγραφή…" : "Signing up…") : greek ? "Εγγραφή" : "Sign up free"}
            </Button>
          </form>
          <p className="text-[11px] text-primary-foreground/50 mt-2">
            {greek ? "Δωρεάν · Διαγραφή οποιαδήποτε στιγμή" : "Free · Unsubscribe anytime"}
          </p>
        </>
      )}
    </section>
  );
}
