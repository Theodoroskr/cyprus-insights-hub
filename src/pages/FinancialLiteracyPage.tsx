import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculators } from "@/components/finlit/Calculators";
import { StatChart } from "@/components/finlit/StatChart";
import { Education, Methodology, TOPICS } from "@/components/finlit/EducationAndMethod";
import { GEO_LABELS, formatStat, headline, prettyStatPeriod, databrowserUrl, type StatDataset, type StatObs } from "@/lib/eurostatView";

import { SurveyScores, type Finding as F } from "@/components/finlit/SurveyScores";
type Finding = F & { id: string; publisher: string; survey: string; survey_year: number; published_year: number | null; indicator: string; value: number | null; unit: string; comparison_label: string | null; comparison_value: number | null; source_url: string; page_ref: string | null; notes: string | null; status: string };

const HOUSEHOLD = ["disposable_income", "saving_rate", "net_earnings", "unexpected_expenses", "poverty_rate", "arope_rate"];
const COST = ["hicp_all", "hicp_food", "price_level", "household_consumption"];

async function loadStats() {
  const { data: ds, error } = await supabase.rpc("get_public_stat_datasets");
  if (error) throw error;
  const datasets = ((ds ?? []) as StatDataset[]).filter((d) => [...HOUSEHOLD, ...COST].includes(d.code));
  const { data, error: e } = await supabase.from("stat_observations").select("dataset_id, geo, period, period_date, value, status_flag")
    .in("dataset_id", datasets.map((d) => d.id)).gte("period_date", "2019-01-01").order("period_date").limit(5000);
  if (e) throw e;
  return { datasets, obs: (data ?? []).map((r) => ({ ...r, value: Number(r.value) })) as StatObs[] };
}

function StatCard({ ds, obs }: { ds: StatDataset; obs: StatObs[] }) {
  const h = headline(ds, obs);
  return (
    <Card className="border-l-4 border-l-primary transition-shadow hover:shadow-md"><CardContent className="p-4 space-y-1">
      <p className="text-xs font-medium text-muted-foreground leading-snug">{ds.title_en}</p>
      <p className="text-3xl font-bold font-serif text-primary">{formatStat(h.latest?.value, ds)}</p>
      <p className="text-xs text-muted-foreground">
        {h.latest ? prettyStatPeriod(h.latest.period) : "Data not available"}
        {h.benchmarks.map((b) => b.obs && <span key={b.geo}> · {GEO_LABELS[b.geo] ?? b.geo} {formatStat(b.obs.value, ds)}</span>)}
      </p>
      <p className="text-[10px] text-muted-foreground">{ds.unit_label} · <a className="underline" href={databrowserUrl(ds.dataset_code)} target="_blank" rel="noopener noreferrer">Eurostat {ds.dataset_code}</a></p>
    </CardContent></Card>
  );
}

export default function FinancialLiteracyPage() {
  const stats = useQuery({ queryKey: ["finlit-stats"], staleTime: 3600_000, queryFn: loadStats });
  const findings = useQuery({
    queryKey: ["finlit-findings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("fin_lit_findings").select("*").eq("status", "approved").order("sort_order");
      if (error) throw error;
      return (data ?? []) as Finding[];
    },
  });
  const visible = (findings.data ?? []).filter((f) => f.status === "approved");
  const ds = stats.data?.datasets ?? [];
  const obs = stats.data?.obs ?? [];
  const pick = (codes: string[]) => codes.map((c) => ds.find((d) => d.code === c)).filter(Boolean) as StatDataset[];

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation onSearch={() => {}} />
      <SEOHead title="Financial Literacy in Cyprus — Survey Results & Household Finances | BusinessHub"
        description="How financially literate are adults in Cyprus? OECD and Central Bank survey results, plus official Eurostat figures on household income, savings and the cost of living."
        jsonLd={{ "@context": "https://schema.org", "@type": "WebPage", name: "Financial Literacy in Cyprus", alternateName: "Χρηματοοικονομικός Αλφαβητισμός στην Κύπρο", inLanguage: ["en", "el"], url: "https://businesshub.cy/financial-literacy",
          about: TOPICS.map((t) => ({ "@type": "Thing", name: t.en, alternateName: t.el })) }}
        path="/financial-literacy" breadcrumbs={[{ name: "Home", href: "/" }, { name: "Financial Literacy", href: "/financial-literacy" }]} />
      <div className="container mx-auto px-4 py-8 space-y-10">
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><GraduationCap className="h-4 w-4" /> Financial Literacy · Χρηματοοικονομικός Αλφαβητισμός</div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold">Financial Literacy in Cyprus</h1>
          <p className="text-muted-foreground max-w-3xl">What adults in Cyprus know about money, and the household finances behind it. Survey results come from official reports; household and price figures update automatically from Eurostat. Every figure shows its publisher and year.</p>
        </header>

        <Link to="/financial-literacy/academy" className="block rounded-xl border bg-gradient-to-r from-primary/15 to-background p-5 hover:shadow-md transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">New · Ακαδημία</p>
          <p className="text-xl font-serif font-semibold">Financial Literacy Academy →</p>
          <p className="text-sm text-muted-foreground">Free, short lessons on budgeting, borrowing, online safety, saving and business finance, in English and Greek.</p>
        </Link>

        <section className="space-y-4">
          <h2 className="text-2xl font-serif font-semibold">Cyprus financial literacy</h2>
          {findings.isLoading ? <p className="text-muted-foreground">Loading…</p> : !visible.length ? <p className="text-muted-foreground">Data not available yet.</p> : <SurveyScores findings={visible} />}
          <p className="text-xs text-muted-foreground">The OECD (2023) and Central Bank of Cyprus (2018) surveys use different questions and scales, so their scores cannot be compared with each other.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-serif font-semibold">Household financial health</h2>
          {stats.isLoading ? <p className="text-muted-foreground">Loading…</p> : <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">{pick(HOUSEHOLD).map((d) => <StatCard key={d.code} ds={d} obs={obs} />)}</div>}
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-serif font-semibold">Cost of living</h2>
          {stats.isLoading ? <p className="text-muted-foreground">Loading…</p> : <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{pick(COST).map((d) => <StatCard key={d.code} ds={d} obs={obs} />)}</div>}
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-serif font-semibold">Explore the figures</h2>
          {stats.isLoading ? <p className="text-muted-foreground">Loading…</p> : <StatChart datasets={pick([...COST, ...HOUSEHOLD])} obs={obs} />}
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-serif font-semibold">Money basics · Βασικές γνώσεις</h2>
          <Education />
        </section>

        <section className="space-y-4"><Calculators /></section>

        <section className="space-y-2">
          <h2 className="text-2xl font-serif font-semibold">Sources & methodology</h2>
          <Methodology />
        </section>

        <footer className="border-t pt-4 text-xs text-muted-foreground space-y-1">
          <p>Sources: OECD; Central Bank of Cyprus; Eurostat (reuse permitted with attribution). Figures not yet published are shown as "Data not available", never as zero.</p>
          <p>More official figures: <Link to="/economy" className="underline">Cyprus Economic Indicators</Link> · <Link to="/open-data" className="underline">Official Data Sources</Link></p>
        </footer>
      </div>
      <Footer />
    </div>
  );
}
