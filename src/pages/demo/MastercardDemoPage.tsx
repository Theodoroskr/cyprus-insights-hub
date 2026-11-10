import { Navigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { MASTERCARD_DEMO } from "@/lib/mastercardDemo";
import { useAcademyLang } from "@/lib/academy";
import { LangSwitch } from "@/components/academy/AcademyChrome";
import { SurveyScores } from "@/components/finlit/SurveyScores";
import { Calculators } from "@/components/finlit/Calculators";
import { useState } from "react";
import { scoreExplain } from "@/lib/finlitExplain";
import { TrendChart as DemoTrendChart, CompareBars as DemoCompareBars } from "@/components/finlit/SnapshotCharts";
import { ConfidenceTools } from "@/components/demo/ConfidenceTools";
import { StatCard, useFinLitFindings, useFinLitStats } from "@/components/finlit/useFinLitStats";

const C = {
  en: {
    sub: "Proposed Partnership Demonstration – Not an Official Mastercard Programme",
    title: "Cyprus Financial Confidence",
    kicker: "Financial confidence for everyone in Cyprus", cta: "Test your money confidence", k1: "Overall financial literacy score", k2: "Adults reaching the target score", k3: "Answer the compound-interest question correctly", src: "survey 2023, published 2025",
    intro: "A preview of how BusinessHub.cy's financial literacy platform could look as a joint public programme. All figures are live official data from OECD, the Central Bank of Cyprus and Eurostat.",
    scores: "How confident is Cyprus with money?", figures: "Household finances today", tools: "Try the money tools",
    check: "Test your money confidence", tap: "Tap any score to see what it means.", trend: "Cyprus vs Europe over time", glance: "Cyprus vs EU at a glance",
    note: "Private demonstration for discussion purposes only. Mastercard has not endorsed or approved this programme. Visible to BusinessHub administrators only.",
    back: "View the public Financial Literacy pages",
  },
  el: {
    sub: "Επίδειξη Προτεινόμενης Συνεργασίας – Δεν αποτελεί Επίσημο Πρόγραμμα της Mastercard",
    title: "Οικονομική Αυτοπεποίθηση στην Κύπρο",
    kicker: "Οικονομική αυτοπεποίθηση για όλους στην Κύπρο", cta: "Δοκιμάστε την αυτοπεποίθησή σας", k1: "Συνολική βαθμολογία χρηματοοικονομικού αλφαβητισμού", k2: "Ενήλικες που φτάνουν τον στόχο", k3: "Απαντούν σωστά στην ερώτηση ανατοκισμού", src: "έρευνα 2023, δημοσίευση 2025",
    intro: "Προεπισκόπηση του πώς θα μπορούσε να μοιάζει η πλατφόρμα χρηματοοικονομικού αλφαβητισμού του BusinessHub.cy ως κοινό πρόγραμμα. Όλα τα στοιχεία είναι επίσημα, από τον ΟΟΣΑ, την Κεντρική Τράπεζα της Κύπρου και τη Eurostat.",
    scores: "Πόσο σίγουρη νιώθει η Κύπρος με τα χρήματα;", figures: "Τα οικονομικά των νοικοκυριών σήμερα", tools: "Δοκιμάστε τα εργαλεία",
    check: "Δοκιμάστε την οικονομική σας αυτοπεποίθηση", tap: "Πατήστε μια βαθμολογία για να δείτε τι σημαίνει.", trend: "Κύπρος και Ευρώπη με τον χρόνο", glance: "Κύπρος και ΕΕ με μια ματιά",
    note: "Ιδιωτική επίδειξη μόνο για συζήτηση. Η Mastercard δεν έχει εγκρίνει αυτό το πρόγραμμα. Ορατό μόνο στους διαχειριστές του BusinessHub.",
    back: "Δείτε τις δημόσιες σελίδες",
  },
};

export default function MastercardDemoPage() {
  const { isAdmin, loading } = useIsAdmin();
  const [lang, setLang] = useAcademyLang();
  const s = useFinLitStats();
  const f = useFinLitFindings();
  const [tile, setTile] = useState<number | null>(null);
  if (loading) return null;
  if (!isAdmin || !MASTERCARD_DEMO.enabled) return <Navigate to="/" replace />;
  const t = C[lang];
  const overall = (f.data ?? []).filter((x) => x.publisher?.startsWith("OECD") && !x.breakdown_dimension).slice(0, 4);
  const compound = (f.data ?? []).find((x) => /compound/i.test(x.indicator) && !x.breakdown_dimension)?.value ?? null;
  const showLogo = MASTERCARD_DEMO.logoApproved && !!MASTERCARD_DEMO.logoUrl;
  return (
    <div className="mc-demo min-h-screen bg-background">
      <Helmet><title>Private demo</title><meta name="robots" content="noindex, nofollow" /></Helmet>
      <header className="sticky top-0 z-40 bg-[hsl(var(--mc-white))] border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-serif text-lg md:text-xl font-bold">BusinessHub.cy</span>
            <span aria-hidden className="text-muted-foreground">×</span>
            {showLogo ? <img src={MASTERCARD_DEMO.logoUrl!} alt="Mastercard" className="h-9 md:h-10 w-auto" /> : <span className="text-xl font-semibold">Mastercard</span>}
          </div>
          <div className="text-sm"><LangSwitch lang={lang} setLang={setLang} /></div>
        </div>
      </header>
      <div className="bg-[hsl(var(--mc-charcoal))] text-[hsl(var(--mc-white))] border-b border-[hsl(var(--mc-white)/0.1)]">
        <p className="container mx-auto px-4 py-2 text-xs font-medium tracking-wide text-center">{t.sub}</p>
      </div>

      <section className="bg-[hsl(var(--mc-charcoal))] text-[hsl(var(--mc-white))]">
        <div className="container mx-auto px-4 py-12 md:py-16 grid lg:grid-cols-[1.4fr_1fr] gap-10 items-center">
          <div className="space-y-5">
            <p className="inline-flex rounded-full bg-[hsl(var(--mc-orange))] px-3 py-1 text-xs font-semibold text-[hsl(var(--mc-charcoal))]">{t.kicker}</p>
            <h1 className="text-4xl md:text-6xl font-serif font-bold leading-tight">{t.title}</h1>
            <p className="text-lg opacity-80 max-w-2xl">{t.intro}</p>
            <div className="flex flex-wrap gap-3">
              <a href="#check" className="rounded-full bg-[hsl(var(--mc-red))] px-6 py-3 font-semibold text-[hsl(var(--mc-white))] hover:opacity-90">{t.cta}</a>
              <a href="#tools" className="rounded-full border border-[hsl(var(--mc-white)/0.4)] px-6 py-3 font-semibold hover:bg-[hsl(var(--mc-white)/0.1)]">{t.tools}</a>
            </div>
          </div>
          <div className="grid grid-cols-3 lg:grid-cols-1 gap-3">
            {[
              { q: "overall", v: "56/100", l: t.k1, c: "--mc-red" },
              { q: "target", v: "17%", l: t.k2, c: "--mc-orange" },
              { q: "compound", v: compound != null ? `${compound}%` : "—", l: t.k3, c: "--mc-yellow" },
            ].map((k, i) => (
              <button type="button" key={k.l} onClick={() => setTile(tile === i ? null : i)} aria-expanded={tile === i}
                className="text-left !rounded-2xl bg-[hsl(var(--mc-white)/0.06)] hover:bg-[hsl(var(--mc-white)/0.12)] p-4 border-l-4 transition-colors" style={{ borderColor: `hsl(var(${k.c}))` }}>
                <p className="text-2xl md:text-3xl font-serif font-bold">{k.v}</p>
                <p className="text-xs md:text-sm opacity-75">{k.l}</p>
                {tile === i && <p className="mt-2 text-xs leading-relaxed opacity-90">{scoreExplain(k.q, lang)}</p>}
              </button>
            ))}
            <p className="col-span-3 lg:col-span-1 text-[11px] opacity-60">OECD, {t.src}</p>
          </div>
        </div>
        <div className="flex h-1.5" aria-hidden>
          <div className="flex-1 bg-[hsl(var(--mc-red))]" /><div className="flex-1 bg-[hsl(var(--mc-orange))]" /><div className="flex-1 bg-[hsl(var(--mc-yellow))]" />
        </div>
      </section>

      <main className="container mx-auto px-4 py-12 space-y-14">
        <section className="space-y-4">
          <h2 className="text-2xl font-serif font-semibold border-l-4 border-[hsl(var(--mc-orange))] pl-3">{t.scores}</h2>
          {overall.length > 0 && <SurveyScores findings={overall} />}
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-serif font-semibold border-l-4 border-[hsl(var(--mc-yellow))] pl-3">{t.figures}</h2>
          {!s.isLoading && <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{s.pick(["saving_rate", "unexpected_expenses", "hicp_all", "cbc_rate_mortgage"]).map((d) => <StatCard key={d.code} ds={d} obs={s.obs} />)}</div>}
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-serif font-semibold border-l-4 border-[hsl(var(--mc-red))] pl-3">{t.trend}</h2>
          {!s.isLoading && <DemoTrendChart lang={lang} obs={s.obs} datasets={s.pick(["hicp_all", "hicp_food", "cbc_rate_mortgage", "cbc_rate_deposit", "saving_rate"])} />}
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-serif font-semibold border-l-4 border-[hsl(var(--mc-orange))] pl-3">{t.glance}</h2>
          {!s.isLoading && <DemoCompareBars lang={lang} obs={s.obs} datasets={s.pick(["saving_rate", "unexpected_expenses", "hicp_all"])} />}
        </section>

        <section className="space-y-4">
          <h2 id="tools" className="scroll-mt-24 text-2xl font-serif font-semibold border-l-4 border-[hsl(var(--mc-red))] pl-3">{t.tools}</h2>
          <Calculators />
        </section>

        <section className="space-y-4">
          <h2 id="check" className="scroll-mt-24 text-2xl font-serif font-semibold border-l-4 border-[hsl(var(--mc-orange))] pl-3">{t.check}</h2>
          <ConfidenceTools lang={lang} cyCompound={compound} />
        </section>

        <footer className="space-y-2 text-sm text-muted-foreground border-t pt-6">
          <p>{t.note}</p>
          <Link to="/financial-literacy" className="underline">{t.back}</Link>
        </footer>
      </main>
    </div>
  );
}
