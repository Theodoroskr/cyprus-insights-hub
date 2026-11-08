import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Search, Landmark, BookOpen, Briefcase, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InfocreditCta } from "@/components/mastercard/InfocreditCta";
import { EnquiryDialog } from "@/components/mastercard/EnquiryDialog";
import { LangToggle } from "@/components/mastercard/LangToggle";
import { Interest, Lang, trackCta } from "@/lib/mastercard";
import { prettyPeriod } from "@/lib/econMetrics";

const T = {
  en: {
    kicker: "Mastercard Economic Intelligence",
    title: "Mastercard Economic Intelligence",
    intro: "Explore global and regional economic trends, consumer spending insights, retail performance and market intelligence through research and solutions from Mastercard.",
    intro2: "For access to additional economic intelligence, market analytics and Mastercard solutions in Cyprus, contact Infocredit Group, a local Mastercard partner.",
    official: "Official Cyprus statistics", officialNote: "Public government statistics from CYSTAT and the Department of Lands and Surveys. These are separate from, and not derived from, Mastercard data.",
    research: "Research library", researchNote: "Summaries are written by BusinessHub and link to the original Mastercard publication. They are not Mastercard statements.",
    search: "Search research…", allCats: "All categories", allGeo: "All regions", none: "No research matches your filters.",
    products: "Premium intelligence opportunities", productsNote: "Informational product descriptions. Availability, coverage and features depend on Mastercard's product offering and commercial arrangements.",
    requestInfo: "Request information", read: "Read original", learn: "Learn more", sources: "Sources",
    inflation: "Inflation (CPI)", gdp: "Real GDP growth", unemp: "Unemployment rate", arrivals: "Tourist arrivals", contracts: "Property sale contracts",
  },
  el: {
    kicker: "Οικονομική Ανάλυση Mastercard",
    title: "Οικονομική Ανάλυση Mastercard",
    intro: "Ανακαλύψτε διεθνείς και περιφερειακές οικονομικές τάσεις, στοιχεία καταναλωτικής συμπεριφοράς, αναλύσεις λιανικού εμπορίου και πληροφορίες αγοράς μέσα από τις έρευνες και τις λύσεις της Mastercard.",
    intro2: "Για πρόσβαση σε πρόσθετα οικονομικά δεδομένα, εξειδικευμένες αναλύσεις αγοράς και λύσεις της Mastercard στην Κύπρο, επικοινωνήστε με την Infocredit Group, τοπικό συνεργάτη της Mastercard.",
    official: "Επίσημα στατιστικά Κύπρου", officialNote: "Δημόσια κρατικά στατιστικά από τη ΚΥΣΤΑΤ και το Τμήμα Κτηματολογίου και Χωρομετρίας, ξεχωριστά από τα δεδομένα της Mastercard.",
    research: "Βιβλιοθήκη ερευνών", researchNote: "Οι περιλήψεις γράφονται από το BusinessHub και παραπέμπουν στην πρωτότυπη δημοσίευση της Mastercard.",
    search: "Αναζήτηση…", allCats: "Όλες οι κατηγορίες", allGeo: "Όλες οι περιοχές", none: "Δεν βρέθηκαν αποτελέσματα.",
    products: "Ευκαιρίες εξειδικευμένης ανάλυσης", productsNote: "Ενημερωτικές περιγραφές προϊόντων. Η διαθεσιμότητα εξαρτάται από τις εμπορικές συμφωνίες της Mastercard.",
    requestInfo: "Ζητήστε πληροφορίες", read: "Πρωτότυπο", learn: "Περισσότερα", sources: "Πηγές",
    inflation: "Πληθωρισμός (ΔΤΚ)", gdp: "Πραγματική ανάπτυξη ΑΕΠ", unemp: "Ανεργία", arrivals: "Αφίξεις τουριστών", contracts: "Πωλητήρια έγγραφα ακινήτων",
  },
};

const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null);

function useOfficialSnapshot() {
  return useQuery({
    queryKey: ["mc-official-snapshot"], staleTime: 3600_000,
    queryFn: async () => {
      const latest = async (code: string) => (await supabase.from("econ_indicators").select("period_label, value").eq("series_code", code).eq("status", "published").not("value", "is", null).order("period_date", { ascending: false }).limit(1)).data?.[0] ?? null;
      const [cpi, gdp, unemp] = await Promise.all([latest("cpi_yoy"), latest("gdp_real_yoy"), latest("unemployment_rate")]);
      const tour = (await supabase.from("tourism_arrivals_monthly").select("period_date, arrivals").eq("country_code", "total").eq("status", "published").not("arrivals", "is", null).order("period_date", { ascending: false }).limit(1)).data?.[0] ?? null;
      const reLast = (await supabase.from("re_sale_contracts").select("period_date").eq("status", "published").order("period_date", { ascending: false }).limit(1)).data?.[0]?.period_date ?? null;
      let contracts: number | null = null;
      if (reLast) contracts = ((await supabase.from("re_sale_contracts").select("contract_count").eq("status", "published").eq("period_date", reLast)).data ?? []).reduce((s, r) => s + (r.contract_count ?? 0), 0);
      return { cpi, gdp, unemp, tour, reLast, contracts };
    },
  });
}

const monthLabel = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "");

export default function MastercardIntelligencePage() {
  const [lang, setLang] = useState<Lang>("en");
  const t = T[lang];
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [geo, setGeo] = useState("all");
  const [enquiry, setEnquiry] = useState<Interest | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["mastercard-resources-public"], staleTime: 600_000,
    queryFn: async () => (await supabase.from("mastercard_resources").select("*").eq("status", "published").order("sort_order")).data ?? [],
  });
  const snap = useOfficialSnapshot();
  const research = items.filter((i) => i.kind === "research");
  const products = items.filter((i) => i.kind === "product");
  const sources = items.filter((i) => i.kind === "source");
  const cats = [...new Set(research.map((r) => r.category))].sort();
  const geos = [...new Set(research.map((r) => r.geography).filter(Boolean) as string[])].sort();
  const filtered = useMemo(() => research.filter((r) => {
    if (cat !== "all" && r.category !== cat) return false;
    if (geo !== "all" && r.geography !== geo) return false;
    const s = q.trim().toLowerCase();
    return !s || [r.title, r.title_el, r.summary, r.category, ...(r.industries ?? [])].some((x) => x?.toLowerCase().includes(s));
  }), [research, q, cat, geo]);

  const pct = (v: number | null | undefined) => (v == null ? "—" : `${Number(v).toFixed(1)}%`);
  const s = snap.data;
  const official = [
    { l: t.inflation, v: pct(s?.cpi?.value), p: s?.cpi ? prettyPeriod(s.cpi.period_label) : "", src: "CYSTAT", href: "/economy" },
    { l: t.gdp, v: pct(s?.gdp?.value), p: s?.gdp ? `${prettyPeriod(s.gdp.period_label)} · y/y` : "", src: "CYSTAT", href: "/economy" },
    { l: t.unemp, v: pct(s?.unemp?.value), p: s?.unemp ? prettyPeriod(s.unemp.period_label) : "", src: "CYSTAT LFS", href: "/economy" },
    { l: t.arrivals, v: s?.tour?.arrivals?.toLocaleString("en-GB") ?? "—", p: monthLabel(s?.tour?.period_date ?? null), src: "CYSTAT", href: "/tourism" },
    { l: t.contracts, v: s?.contracts?.toLocaleString("en-GB") ?? "—", p: monthLabel(s?.reLast ?? null), src: "DLS", href: "/real-estate" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation onSearch={() => {}} />
      <SEOHead
        title={lang === "el" ? "Οικονομική Ανάλυση Mastercard | BusinessHub Κύπρος" : "Mastercard Economic Intelligence for Cyprus | BusinessHub"}
        description="Mastercard economic research, consumer spending and retail intelligence references alongside official Cyprus statistics, with enquiries handled by Infocredit Group, a local Mastercard partner."
        path="/intelligence/mastercard"
        breadcrumbs={[{ name: "Home", href: "/" }, { name: "Mastercard Economic Intelligence", href: "/intelligence/mastercard" }]}
      />
      <div className="container mx-auto px-4 py-8 space-y-10">
        <header className="space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="text-sm text-muted-foreground">{t.kicker}</div>
            <LangToggle lang={lang} onChange={setLang} />
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold">{t.title}</h1>
          <p className="text-muted-foreground max-w-3xl">{t.intro}</p>
          <p className="max-w-3xl">{t.intro2}</p>
        </header>

        <section className="space-y-3">
          <div className="flex items-center gap-2"><Landmark className="h-5 w-5" /><h2 className="text-xl font-serif font-bold">{t.official}</h2></div>
          <p className="text-sm text-muted-foreground max-w-3xl">{t.officialNote}</p>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {official.map((k) => (
              <Link key={k.l} to={k.href} className="block"><Card className="h-full hover:border-primary transition-colors"><CardContent className="p-4 space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{k.l}</p>
                <p className="text-2xl font-semibold font-serif">{snap.isLoading ? "…" : k.v}</p>
                <p className="text-xs text-muted-foreground">{k.p}</p>
                <p className="text-[10px] text-muted-foreground">Source: {k.src}</p>
              </CardContent></Card></Link>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2"><BookOpen className="h-5 w-5" /><h2 className="text-xl font-serif font-bold">{t.research}</h2></div>
          <p className="text-sm text-muted-foreground max-w-3xl">{t.researchNote}</p>
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[14rem] max-w-md"><Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" /><Input className="pl-9" placeholder={t.search} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t.search} /></div>
            <Select value={cat} onValueChange={setCat}><SelectTrigger className="w-48" aria-label="Category"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">{t.allCats}</SelectItem>{cats.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
            <Select value={geo} onValueChange={setGeo}><SelectTrigger className="w-44" aria-label="Region"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">{t.allGeo}</SelectItem>{geos.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
          </div>
          {isLoading ? <p className="text-muted-foreground">Loading…</p> : filtered.length === 0 ? <p className="text-muted-foreground">{t.none}</p> : (
            <div className="grid md:grid-cols-2 gap-4">
              {filtered.map((r) => (
                <Card key={r.id}><CardContent className="p-5 space-y-2">
                  <div className="flex flex-wrap gap-1.5"><Badge variant="secondary">{r.category}</Badge>{r.geography && <Badge variant="outline">{r.geography}</Badge>}</div>
                  <h3 className="font-semibold">{lang === "el" && r.title_el ? r.title_el : r.title}</h3>
                  <p className="text-xs text-muted-foreground">{r.publisher}{fmtDate(r.published_on) ? ` · ${fmtDate(r.published_on)}` : ""}</p>
                  {r.summary && <p className="text-sm">{lang === "el" && r.summary_el ? r.summary_el : r.summary}</p>}
                  {r.industries?.length > 0 && <p className="text-xs text-muted-foreground">Relevant to: {r.industries.join(", ")}</p>}
                  <a href={r.source_url} target="_blank" rel="noopener noreferrer" className="text-sm underline inline-flex items-center gap-1">{t.read} <ExternalLink className="h-3 w-3" /></a>
                  <p className="text-[10px] text-muted-foreground">© {r.attribution ?? r.publisher}. {r.licence_note}</p>
                </CardContent></Card>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2"><Briefcase className="h-5 w-5" /><h2 className="text-xl font-serif font-bold">{t.products}</h2></div>
          <p className="text-sm text-muted-foreground max-w-3xl">{t.productsNote}</p>
          <div className="grid md:grid-cols-2 gap-4">
            {products.map((p) => {
              const interest: Interest = /spendingpulse/i.test(p.title) ? "Mastercard SpendingPulse" : "Economic Research";
              return (
                <Card key={p.id}><CardContent className="p-5 space-y-3">
                  <h3 className="font-semibold text-lg">{lang === "el" && p.title_el ? p.title_el : p.title}</h3>
                  <p className="text-sm">{lang === "el" && p.summary_el ? p.summary_el : p.summary}</p>
                  {p.applications?.length > 0 && <ul className="text-sm list-disc pl-5 space-y-0.5">{p.applications.map((a) => <li key={a}>{a}</li>)}</ul>}
                  {p.industries?.length > 0 && <p className="text-xs text-muted-foreground">Industries: {p.industries.join(", ")}</p>}
                  <p className="text-[11px] text-muted-foreground">{p.licence_note}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => { trackCta("open", "mastercard-product", interest); setEnquiry(interest); }}>{t.requestInfo}</Button>
                    {interest === "Mastercard SpendingPulse" && <Button size="sm" variant="outline" asChild><Link to="/intelligence/mastercard/spendingpulse">{t.learn} <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link></Button>}
                    <Button size="sm" variant="ghost" asChild><a href={p.source_url} target="_blank" rel="noopener noreferrer">Mastercard <ExternalLink className="h-3 w-3 ml-1" /></a></Button>
                  </div>
                </CardContent></Card>
              );
            })}
          </div>
        </section>

        <InfocreditCta placement="mastercard-hub" variant="full" lang={lang} showExplore={false} />

        <footer className="border-t pt-4 text-xs text-muted-foreground space-y-2">
          <p className="font-medium">{t.sources}</p>
          <ul className="space-y-1">{sources.map((s) => <li key={s.id}><a href={s.source_url} target="_blank" rel="noopener noreferrer" className="underline">{s.title}</a> — {s.publisher}</li>)}</ul>
          <p>Mastercard and SpendingPulse are trademarks of Mastercard International Incorporated. BusinessHub is an independent publication and is not owned, operated or endorsed by Mastercard. Infocredit Group is a local Mastercard partner in Cyprus; not all Mastercard products are necessarily available through Infocredit Group.</p>
        </footer>
      </div>
      <EnquiryDialog open={!!enquiry} onOpenChange={(o) => !o && setEnquiry(null)} lang={lang} placement="mastercard-product" defaultInterest={enquiry ?? undefined} />
      <Footer />
    </div>
  );
}

