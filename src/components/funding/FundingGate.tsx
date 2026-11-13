import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoginModal } from "@/components/auth/LoginModal";
import { RETURN_KEY, type Lang } from "@/lib/funding";

/** Register / sign-in prompt that brings the visitor back to the same call or filtered list afterwards. */
export function FundingGate({ lang, compact = false }: { lang: Lang; compact?: boolean }) {
  const [open, setOpen] = useState<null | "login" | "register">(null);
  const loc = useLocation();
  const go = (tab: "login" | "register") => { localStorage.setItem(RETURN_KEY, loc.pathname + loc.search); setOpen(tab); };
  return (
    <div className={`border border-secondary/30 bg-secondary/5 rounded-lg text-center ${compact ? "p-5" : "p-8"}`}>
      <Lock className="h-6 w-6 mx-auto text-secondary mb-3" />
      <p className="font-serif text-xl font-bold text-foreground mb-2">
        {lang === "el" ? "Δείτε όλες τις ευκαιρίες χρηματοδότησης" : "See every verified funding opportunity"}
      </p>
      <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-5">
        {lang === "el"
          ? "Η δωρεάν εγγραφή ξεκλειδώνει τον πλήρη κατάλογο, όλες τις λεπτομέρειες κάθε πρόσκλησης, την αναζήτηση και τα φίλτρα."
          : "A free account unlocks the full catalogue, complete call details, search and every filter."}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button size="lg" onClick={() => go("register")}>{lang === "el" ? "Δωρεάν εγγραφή για όλες τις ευκαιρίες" : "Register free to view all funding opportunities"}</Button>
        <Button size="lg" variant="outline" onClick={() => go("login")}>{lang === "el" ? "Σύνδεση" : "Sign in"}</Button>
      </div>
      {open && <LoginModal isOpen onClose={() => setOpen(null)} defaultTab={open} />}
    </div>
  );
}
