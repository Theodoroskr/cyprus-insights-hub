import { Navigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ShieldCheck } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { MASTERCARD_DEMO } from "@/lib/mastercardDemo";
import { useAcademyLang } from "@/lib/academy";
import { LangSwitch } from "@/components/academy/AcademyChrome";
import { SurveyScores } from "@/components/finlit/SurveyScores";
import { Calculators } from "@/components/finlit/Calculators";
import { StatCard, useFinLitFindings, useFinLitStats } from "@/components/finlit/useFinLitStats";

const C = {
  en: {
    sub: "Proposed Partnership Demonstration – Not an Official Mastercard Programme",
    title: "Cyprus Financial Confidence",
    intro: "A preview of how BusinessHub.cy's financial literacy platform could look as a joint public programme. All figures are live official data from OECD, the Central Bank of Cyprus and Eurostat.",
    scores: "How confident is Cyprus with money?", figures: "Household finances today", tools: "Try the money tools",
    soon: "Coming in the next demo stage", soonItems: ["Financial knowledge assessment", "Digital payment safety simulator", "Personal learning results"],
    note: "Private demonstration for discussion purposes only. Mastercard has not endorsed or approved this programme. Visible to BusinessHub administrators only.",
    back: "View the public Financial Literacy pages",
  },
  el: {
    sub: "Επίδειξη Προτεινόμενης Συνεργασίας – Δεν αποτελεί Επίσημο Πρόγραμμα της Mastercard",
    title: "Οικονομική Αυτοπεποίθηση στην Κύπρο",
    intro: "Προεπισκόπηση του πώς θα μπορούσε να μοιάζει η πλατφόρμα χρηματοοικονομικού αλφαβητισμού του BusinessHub.cy ως κοινό πρόγραμμα. Όλα τα στοιχεία είναι επίσημα, από τον ΟΟΣΑ, την Κεντρική Τράπεζα της Κύπρου και τη Eurostat.",
    scores: "Πόσο σίγουρη νιώθει η Κύπρος με τα χρήματα;", figures: "Τα οικονομικά των νοικοκυριών σήμερα", tools: "Δοκιμάστε τα εργαλεία",
    soon: "Στο επόμενο στάδιο της επίδειξης", soonItems: ["Αξιολόγηση χρηματοοικονομικών γνώσεων", "Προσομοιωτής ασφαλών ψηφιακών πληρωμών", "Προσωπικά αποτελέσματα μάθησης"],
    note: "Ιδιωτική επίδειξη μόνο για συζήτηση. Η Mastercard δεν έχει εγκρίνει αυτό το πρόγραμμα. Ορατό μόνο στους διαχειριστές του BusinessHub.",
    back: "Δείτε τις δημόσιες σελίδες",
  },
};

export default function MastercardDemoPage() {
  const { isAdmin, loading } = useIsAdmin();
  const [lang, setLang] = useAcademyLang();
  const s = useFinLitStats();
  const f = useFinLitFindings();
  if (loading) return null;
  if (!isAdmin || !MASTERCARD_DEMO.enabled) return <Navigate to="/" replace />;
  const t = C[lang];
  const overall = (f.data ?? []).filter((x) => x.publisher?.startsWith("OECD") && !x.breakdown_dimension).slice(0, 4);
  const showLogo = MASTERCARD_DEMO.logoApproved && !!MASTERCARD_DEMO.logoUrl;
  return (
    <div className="mc-demo min-h-screen bg-background">
      <Helmet><title>Private demo</title><meta name="robots" content="noindex, nofollow" /></Helmet>
      <header className="bg-[hsl(var(--mc-charcoal))] text-[hsl(var(--mc-white))]">
        <div className="container mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-serif text-xl font-bold">BusinessHub.cy</span>
            <span aria-hidden className="opacity-60">×</span>
            {showLogo ? <img src={MASTERCARD_DEMO.logoUrl!} alt="Mastercard" className="h-8 w-auto" /> : <span className="text-xl font-semibold">Mastercard</span>}
          </div>
          <div className="rounded-md bg-[hsl(var(--mc-white))] text-[hsl(var(--mc-charcoal))] text-sm"><LangSwitch lang={lang} setLang={setLang} /></div>
        </div>
        <div className="flex h-1" aria-hidden>
          <div className="flex-1 bg-[hsl(var(--mc-red))]" /><div className="flex-1 bg-[hsl(var(--mc-orange))]" /><div className="flex-1 bg-[hsl(var(--mc-yellow))]" />
        </div>
        <p className="container mx-auto px-4 py-2 text-xs font-medium tracking-wide">{t.sub}</p>
      </header>

      <main className="container mx-auto px-4 py-10 space-y-12">
        <section className="space-y-3 max-w-3xl">
          <h1 className="text-3xl md:text-5xl font-serif font-bold">{t.title}</h1>
          <p className="text-muted-foreground text-lg">{t.intro}</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-serif font-semibold border-l-4 border-[hsl(var(--mc-orange))] pl-3">{t.scores}</h2>
          {overall.length > 0 && <SurveyScores findings={overall} />}
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-serif font-semibold border-l-4 border-[hsl(var(--mc-yellow))] pl-3">{t.figures}</h2>
          {!s.isLoading && <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{s.pick(["saving_rate", "unexpected_expenses", "hicp_all", "cbc_rate_mortgage"]).map((d) => <StatCard key={d.code} ds={d} obs={s.obs} />)}</div>}
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-serif font-semibold border-l-4 border-[hsl(var(--mc-red))] pl-3">{t.tools}</h2>
          <Calculators />
        </section>

        <section className="rounded-lg border p-6 space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" />{t.soon}</h2>
          <ul className="grid sm:grid-cols-3 gap-3">{t.soonItems.map((i) => <li key={i} className="rounded-md bg-muted p-3 text-sm">{i}</li>)}</ul>
        </section>

        <footer className="space-y-2 text-sm text-muted-foreground border-t pt-6">
          <p>{t.note}</p>
          <Link to="/financial-literacy" className="underline">{t.back}</Link>
        </footer>
      </main>
    </div>
  );
}
