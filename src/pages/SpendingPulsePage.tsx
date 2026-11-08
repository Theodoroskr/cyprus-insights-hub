import { useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, ArrowLeft } from "lucide-react";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { InfocreditCta } from "@/components/mastercard/InfocreditCta";
import { LangToggle } from "@/components/mastercard/LangToggle";
import { Lang } from "@/lib/mastercard";

const SOURCE = "https://www.mastercard.com/global/en/business/insights-intelligence/economic-market-insights/solutions/spendingpulse/spendingpulse-platform.html";

const T = {
  en: {
    back: "Mastercard Economic Intelligence",
    title: "Mastercard SpendingPulse — Retail & Consumer Spending Intelligence",
    lead: "According to Mastercard, SpendingPulse provides near real-time estimates and insights on retail sales activity at national, regional and local levels. Mastercard says the insights are sourced from anonymised, aggregate sales activity in the Mastercard payments network and modelled to reflect total sales across all payment types, with consulting support available from Mastercard's team.",
    whoTitle: "Who it could help",
    who: [
      ["Banks", "Understand consumer demand trends alongside lending and card portfolios."],
      ["Retail chains", "Benchmark store and category performance against the wider market."],
      ["Shopping centres", "Follow footfall-related spending trends and tenant mix performance."],
      ["Hospitality businesses", "Track tourism-related spending patterns over the season."],
      ["Property developers", "Assess commercial and retail demand in specific areas."],
      ["Investors", "Monitor sector momentum before official statistics are released."],
      ["Market research companies", "Enrich studies with spending-based indicators."],
      ["Government & economic development", "Inform policy with timely consumption signals."],
    ],
    appsTitle: "Potential applications",
    apps: ["Retail spending trends", "Sector-level market performance", "Consumer demand analysis", "Geographic spending comparisons", "Historical market benchmarking", "Tourism-related spending intelligence", "Market forecasting where supported"],
    availability: "Availability, coverage (including for Cyprus), features and access depend on Mastercard's applicable product offering and commercial arrangements. BusinessHub does not publish SpendingPulse data, and no figures on this page are Mastercard data.",
    original: "Read Mastercard's SpendingPulse page",
  },
  el: {
    back: "Οικονομική Ανάλυση Mastercard",
    title: "Mastercard SpendingPulse — Ανάλυση Λιανικού Εμπορίου και Καταναλωτικών Δαπανών",
    lead: "Σύμφωνα με τη Mastercard, το SpendingPulse παρέχει εκτιμήσεις και αναλύσεις λιανικών πωλήσεων σχεδόν σε πραγματικό χρόνο σε εθνικό, περιφερειακό και τοπικό επίπεδο, βασισμένες σε ανωνυμοποιημένα, συγκεντρωτικά στοιχεία συναλλαγών του δικτύου Mastercard.",
    whoTitle: "Σε ποιους μπορεί να φανεί χρήσιμο",
    who: [
      ["Τράπεζες", "Κατανόηση τάσεων καταναλωτικής ζήτησης."],
      ["Αλυσίδες λιανικής", "Σύγκριση απόδοσης με την ευρύτερη αγορά."],
      ["Εμπορικά κέντρα", "Παρακολούθηση τάσεων δαπανών."],
      ["Φιλοξενία", "Παρακολούθηση τουριστικών δαπανών ανά εποχή."],
      ["Κατασκευαστές ακινήτων", "Αξιολόγηση εμπορικής ζήτησης ανά περιοχή."],
      ["Επενδυτές", "Παρακολούθηση δυναμικής κλάδων."],
      ["Εταιρείες έρευνας αγοράς", "Εμπλουτισμός μελετών με δείκτες δαπανών."],
      ["Δημόσιος τομέας", "Τεκμηρίωση πολιτικής με έγκαιρα στοιχεία κατανάλωσης."],
    ],
    appsTitle: "Πιθανές εφαρμογές",
    apps: ["Τάσεις λιανικών δαπανών", "Απόδοση αγοράς ανά κλάδο", "Ανάλυση καταναλωτικής ζήτησης", "Γεωγραφικές συγκρίσεις δαπανών", "Ιστορική συγκριτική ανάλυση", "Ανάλυση τουριστικών δαπανών", "Προβλέψεις αγοράς, όπου υποστηρίζεται"],
    availability: "Η διαθεσιμότητα, η κάλυψη (και για την Κύπρο), οι λειτουργίες και η πρόσβαση εξαρτώνται από τις λύσεις και τις εμπορικές συμφωνίες της Mastercard. Το BusinessHub δεν δημοσιεύει δεδομένα SpendingPulse.",
    original: "Η σελίδα SpendingPulse της Mastercard",
  },
};

export default function SpendingPulsePage() {
  const [lang, setLang] = useState<Lang>("en");
  const t = T[lang];
  return (
    <div className="min-h-screen bg-background">
      <TopNavigation onSearch={() => {}} />
      <SEOHead
        title={lang === "el" ? "Mastercard SpendingPulse στην Κύπρο | BusinessHub" : "Mastercard SpendingPulse — Retail & Consumer Spending Intelligence | BusinessHub"}
        description="What Mastercard SpendingPulse retail spending intelligence could offer Cyprus banks, retailers, hospitality and investors, and how to enquire through Infocredit Group, a local Mastercard partner."
        path="/intelligence/mastercard/spendingpulse"
        breadcrumbs={[{ name: "Home", href: "/" }, { name: "Mastercard Economic Intelligence", href: "/intelligence/mastercard" }, { name: "SpendingPulse", href: "/intelligence/mastercard/spendingpulse" }]}
      />
      <div className="container mx-auto px-4 py-8 space-y-8 max-w-5xl">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Link to="/intelligence/mastercard" className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:underline"><ArrowLeft className="h-4 w-4" /> {t.back}</Link>
          <LangToggle lang={lang} onChange={setLang} />
        </div>
        <header className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-serif font-bold">{t.title}</h1>
          <p className="text-lg text-muted-foreground">{t.lead}</p>
          <a href={SOURCE} target="_blank" rel="noopener noreferrer" className="text-sm underline inline-flex items-center gap-1">{t.original} <ExternalLink className="h-3 w-3" /></a>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-serif font-bold">{t.whoTitle}</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {t.who.map(([h, d]) => <Card key={h}><CardContent className="p-4"><p className="font-semibold">{h}</p><p className="text-sm text-muted-foreground">{d}</p></CardContent></Card>)}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-serif font-bold">{t.appsTitle}</h2>
          <ol className="list-decimal pl-6 space-y-1">{t.apps.map((a) => <li key={a}>{a}</li>)}</ol>
          <p className="text-sm text-muted-foreground border-l-2 pl-3">{t.availability}</p>
        </section>

        <InfocreditCta placement="spendingpulse" variant="full" lang={lang} interest="Mastercard SpendingPulse" showExplore={false} />

        <p className="text-xs text-muted-foreground border-t pt-4">Mastercard and SpendingPulse are trademarks of Mastercard International Incorporated. BusinessHub is independent and is not owned, operated or endorsed by Mastercard. Descriptions above summarise Mastercard's public product page; BusinessHub commentary is shown as "who it could help".</p>
      </div>
      <Footer />
    </div>
  );
}
