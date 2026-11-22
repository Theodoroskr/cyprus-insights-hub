import { useMemo, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from "recharts";
import { ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { articlePath } from "@/lib/articleUrl";
import {
  CPI_SOURCES, MARKET_ISO, type CpiEdition, type CpiMarket, type CpiResult, type Lang,
  cpiPath, defaultLang, fmtScore, gapToEu, ranking, rankLabel, regionLabel, toggleCompare, trend, yoy, MAX_COMPARE, type CpiSort,
} from "@/lib/cpi";

const LINE = ["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(var(--muted-foreground))"];
const MARKETS: CpiMarket[] = ["cyprus", "greece", "global"];

const T = {
  en: {
    switch: { cyprus: "Cyprus", greece: "Greece", global: "International" },
    kicker: "Research · Corruption & public integrity",
    score: "CPI score", change: "Change on year", rank: "Global rank", eu: "EU average", global: "Global average",
    countries: "Countries and territories", below50: "Scored below 50", top: "Highest score",
    edition: "CPI edition", released: "Publisher release date", verified: "BusinessHub last verified",
    about: "The Corruption Perceptions Index measures expert and business perceptions of public-sector corruption on a scale of 0–100. Higher scores mean lower perceived corruption.",
    trend: "Score trend", ranking: "Country ranking", search: "Search country", compare: `Compare up to ${MAX_COMPARE} countries`,
    survey: "Business survey findings", surveyNote: "Survey results: share of companies saying corruption is a problem when doing business. These are not CPI scores.",
    updates: "Procurement and public integrity updates", none: "No approved updates yet.",
    related: "Related on ComplianceHub", source: "Source", unavailable: "Unavailable", year: "Edition",
    country: "Country or territory", region: "Region", allRegions: "All regions", sortBy: "Sort by", sortRank: "Rank", sortName: "Name", sortScore: "Score", compareCol: "Compare", showing: "Showing", tiesNote: "Ties shown with “=”.", title: null as string | null,
  },
  el: {
    switch: { cyprus: "Κύπρος", greece: "Ελλάδα", global: "Διεθνώς" },
    kicker: "Έρευνα · Διαφθορά και δημόσια ακεραιότητα",
    score: "Βαθμολογία CPI", change: "Μεταβολή έτους", rank: "Παγκόσμια κατάταξη", eu: "Μέσος όρος ΕΕ", global: "Παγκόσμιος μέσος όρος",
    countries: "Χώρες και περιοχές", below50: "Κάτω από 50", top: "Υψηλότερη βαθμολογία",
    edition: "Έκδοση CPI", released: "Ημερομηνία δημοσίευσης", verified: "Τελευταία επαλήθευση BusinessHub",
    about: "Ο Δείκτης Αντίληψης Διαφθοράς μετρά πώς αντιλαμβάνονται ειδικοί και επιχειρήσεις τη διαφθορά στον δημόσιο τομέα, σε κλίμακα 0–100. Υψηλότερη βαθμολογία σημαίνει χαμηλότερη αντιληπτή διαφθορά.",
    trend: "Εξέλιξη βαθμολογίας", ranking: "Κατάταξη χωρών", search: "Αναζήτηση χώρας", compare: `Σύγκριση έως ${MAX_COMPARE} χωρών`,
    survey: "Ευρήματα έρευνας επιχειρήσεων", surveyNote: "Αποτελέσματα έρευνας: ποσοστό επιχειρήσεων που θεωρούν τη διαφθορά πρόβλημα στις δραστηριότητές τους. Δεν είναι βαθμολογίες CPI.",
    updates: "Εξελίξεις σε δημόσιες συμβάσεις και ακεραιότητα", none: "Δεν υπάρχουν εγκεκριμένες εξελίξεις ακόμη.",
    related: "Σχετικά στο ComplianceHub", source: "Πηγή", unavailable: "Μη διαθέσιμο", year: "Έκδοση",
    country: "Χώρα ή περιοχή", region: "Περιοχή", allRegions: "Όλες οι περιοχές", sortBy: "Ταξινόμηση", sortRank: "Κατάταξη", sortName: "Όνομα", sortScore: "Βαθμολογία", compareCol: "Σύγκριση", showing: "Εμφανίζονται", tiesNote: "Οι ισοβαθμίες σημειώνονται με «=».", title: "Δείκτης Αντίληψης Διαφθοράς στην Ελλάδα" as string | null,
  },
};

function headline(m: CpiMarket, lang: Lang, score: number | null | undefined, eu: number | null | undefined, globalAvg: number | null | undefined) {
  const gap = gapToEu(score, eu);
  if (m === "global") return lang === "el" ? `Ο παγκόσμιος μέσος όρος αντίληψης διαφθοράς πέφτει στο ${globalAvg}/100` : `Global corruption perceptions score falls to ${globalAvg}/100`;
  if (m === "greece") return lang === "el"
    ? `Η Ελλάδα στο ${score}/100 στον Δείκτη Αντίληψης Διαφθοράς, ${gap} μονάδες κάτω από τον μέσο όρο της ΕΕ`
    : `Greece scores ${score}/100 on corruption perceptions, ${gap} points below the EU average`;
  return lang === "el"
    ? `Η Κύπρος στο ${score}/100 στον Δείκτη Αντίληψης Διαφθοράς, ${gap} μονάδες κάτω από τον μέσο όρο της ΕΕ`
    : `Cyprus scores ${score}/100 on corruption perceptions, ${["zero","one","two","three","four","five","six","seven","eight","nine","ten"][gap ?? -1] ?? gap} points below the EU average`;
}

function Src({ href, label }: { href: string; label: string }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-muted-foreground underline hover:text-foreground">{label}<ExternalLink className="h-3 w-3" /></a>;
}

function Kpi({ label, value, note, src }: { label: string; value: string; note?: string; src: { href: string; label: string } }) {
  return (
    <Card><CardContent className="p-4 space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold font-serif">{value}</p>
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
      <Src {...src} />
    </CardContent></Card>
  );
}

export default function CorruptionPerceptionsPage() {
  const { market = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const m = market as CpiMarket;
  const lang: Lang = params.get("lang") === "el" ? "el" : params.get("lang") === "en" ? "en" : defaultLang(m);
  const t = T[lang];
  const [q, setQ] = useState("");
  const [yearSel, setYearSel] = useState<number | null>(null);
  const [compare, setCompare] = useState<string[]>([]);
  const [region, setRegion] = useState("");
  const [sort, setSort] = useState<CpiSort>("rank");

  const { data } = useQuery({
    queryKey: ["cpi-all"],
    queryFn: async () => {
      const [e, r, s, u, b] = await Promise.all([
        supabase.from("cpi_editions").select("*").order("edition_year"),
        supabase.from("cpi_results").select("*").range(0, 4999),
        supabase.from("integrity_survey_findings").select("*"),
        supabase.from("integrity_source_updates").select("*").order("published_at", { ascending: false, nullsFirst: false }).limit(30),
        supabase.from("cpi_benchmarks").select("edition_year,scope,value,source_url"),
      ]);
      return { editions: (e.data ?? []) as CpiEdition[], results: ((r.data ?? []) as CpiResult[]).map((x) => ({ ...x, score: x.score == null ? null : Number(x.score) })), surveys: s.data ?? [], updates: u.data ?? [], benchmarks: (b.data ?? []) as { edition_year: number; scope: string; value: number; source_url: string }[] };
    },
    staleTime: 10 * 60 * 1000,
  });
  const { data: related = [] } = useQuery({
    queryKey: ["cpi-related", m],
    queryFn: async () => {
      const { data } = await supabase.from("cna_articles").select("id,title,title_el,published_at")
        .eq("status", "published").overlaps("tags", ["corruption", "anti-corruption", "anti-bribery", "bribery", "public-integrity", "procurement", "greco", "rule-of-law"])
        .order("published_at", { ascending: false }).limit(6);
      return data ?? [];
    },
  });

  const editions = data?.editions ?? [];
  const results = data?.results ?? [];
  const latest = editions[editions.length - 1];
  const year = yearSel ?? latest?.edition_year ?? 2025;
  const ed = editions.find((e) => e.edition_year === year) ?? latest;
  const years = editions.map((e) => e.edition_year);
  // Benchmarks are separately sourced rows; the edition's own figures are only a fallback.
  const bench = (scope: "eu" | "global") => (data?.benchmarks ?? []).find((x) => x.edition_year === year && x.scope === scope);
  const euAvg = bench("eu")?.value ?? ed?.eu_avg ?? null;
  const globalAvg = bench("global")?.value ?? ed?.global_avg ?? null;
  const tableYears = years.filter((y) => results.filter((r) => r.edition_year === y).length > 10);
  const iso = m === "global" ? null : MARKET_ISO[m];
  const own = iso ? results.find((r) => r.country_iso3 === iso && r.edition_year === year) : undefined;
  const change = iso ? yoy(results, iso, year) : null;
  const rows = useMemo(() => ranking(results, year, q, { region, sort }), [results, year, q, region, sort]);
  const regions = useMemo(() => [...new Set(results.filter((r) => r.edition_year === year).map((r) => regionLabel(r.region)).filter(Boolean))].sort(), [results, year]);
  const top = ranking(results, year)[0];
  const chartIsos = m === "global" ? (compare.length ? compare : ["CYP", "GRC"]) : [iso!];
  const chart = trend(results, chartIsos, years);
  const nameOf = (i: string) => { const r = results.find((x) => x.country_iso3 === i); return lang === "el" ? r?.country_name_el ?? r?.country_name ?? i : r?.country_name ?? i; };
  const surveyGeo = m === "cyprus" ? ["CY", "EU"] : m === "greece" ? ["GR", "EU"] : ["CY", "GR", "EU"];
  const surveys = (data?.surveys ?? []).filter((s: any) => surveyGeo.includes(s.geo));
  const aud = m === "global" ? "intl" : m === "cyprus" ? "cy" : "gr";
  const updates = (data?.updates ?? []).filter((u: any) => (u.audience ?? []).includes(aud));
  const date = (d: string | null | undefined) => (d ? new Date(d).toLocaleDateString(lang === "el" ? "el-GR" : "en-GB", { day: "numeric", month: "long", year: "numeric" }) : t.unavailable);
  const tiSrc = { href: m === "cyprus" ? CPI_SOURCES.cyprus : m === "greece" ? CPI_SOURCES.greece : CPI_SOURCES.cpi, label: `${t.source}: Transparency International` };
  const euSrc = { href: bench("eu")?.source_url ?? CPI_SOURCES.eu, label: `${t.source}: Transparency International (EU)` };
  const globalSrc = { href: bench("global")?.source_url ?? CPI_SOURCES.cpi, label: `${t.source}: Transparency International` };

  if (!MARKETS.includes(m)) return <Navigate to="/research/corruption-perceptions/cyprus" replace />;
  const setLang = (l: Lang) => { const p = new URLSearchParams(params); if (l === defaultLang(m)) p.delete("lang"); else p.set("lang", l); setParams(p, { replace: true }); };
  const h1 = latest ? headline(m, lang, own?.score ?? results.find((r) => r.country_iso3 === iso && r.edition_year === latest.edition_year)?.score, euAvg, globalAvg) : "";

  return (
    <div className="min-h-screen bg-background" lang={lang}>
      <SEOHead title={h1 || "Corruption Perceptions Index"} description={t.about} />
      <TopNavigation onSearch={() => {}} />
      <main className="container mx-auto max-w-6xl px-4 py-8 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="Market" className="inline-flex rounded-md border p-1">
            {MARKETS.map((k) => (
              <Link key={k} to={cpiPath(k, k === "global" ? "en" : lang)} aria-current={k === m ? "page" : undefined}
                className={`px-3 py-1.5 text-sm rounded ${k === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>{t.switch[k]}</Link>
            ))}
          </nav>
          {m !== "global" && (
            <div className="inline-flex gap-1" aria-label="Language">
              {(["en", "el"] as Lang[]).map((l) => <Button key={l} size="sm" variant={l === lang ? "default" : "outline"} onClick={() => setLang(l)}>{l === "en" ? "EN" : "ΕΛ"}</Button>)}
            </div>
          )}
        </div>

        <header className="space-y-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{t.kicker}</p>
          {m === "greece" && t.title ? (<>
            <h1 className="font-serif text-3xl md:text-4xl font-bold leading-tight">{t.title}</h1>
            <p className="font-serif text-xl md:text-2xl leading-snug">{h1}</p>
          </>) : <h1 className="font-serif text-3xl md:text-4xl font-bold leading-tight">{h1}</h1>}
          <p className="text-muted-foreground max-w-3xl">{t.about}</p>
          <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <div><dt className="inline text-muted-foreground">{t.edition}: </dt><dd className="inline font-medium">CPI {ed?.edition_year}</dd></div>
            <div><dt className="inline text-muted-foreground">{t.released}: </dt><dd className="inline font-medium">{date(ed?.release_date)}</dd></div>
            <div><dt className="inline text-muted-foreground">{t.verified}: </dt><dd className="inline font-medium">{date(latest?.verified_at)}</dd></div>
          </dl>
        </header>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {m === "global" ? (<>
            <Kpi label={t.global} value={fmtScore(globalAvg, lang)} note={`CPI ${year}`} src={globalSrc} />
            <Kpi label={t.countries} value={ed?.countries_covered?.toString() ?? t.unavailable} src={{ href: CPI_SOURCES.cpi, label: `${t.source}: Transparency International` }} />
            <Kpi label={t.below50} value={ed?.below_50?.toString() ?? t.unavailable} src={{ href: CPI_SOURCES.cpi, label: `${t.source}: Transparency International` }} />
            <Kpi label={t.top} value={top ? `${nameOf(top.country_iso3)} ${fmtScore(top.score, lang)}` : t.unavailable} src={{ href: CPI_SOURCES.cpi, label: `${t.source}: Transparency International` }} />
          </>) : (<>
            <Kpi label={t.score} value={fmtScore(own?.score, lang)} note={`CPI ${year}`} src={tiSrc} />
            <Kpi label={t.change} value={change == null ? t.unavailable : `${change > 0 ? "+" : ""}${change}`} note={`vs CPI ${year - 1}`} src={tiSrc} />
            <Kpi label={t.rank} value={rankLabel(own, ed?.countries_covered, lang)} src={tiSrc} />
            <Kpi label={t.eu} value={fmtScore(euAvg, lang)} note={`${t.global}: ${fmtScore(globalAvg, lang)}`} src={euSrc} />
          </>)}
        </section>

        {(m === "global" ? tableYears : years).length > 1 && (
          <div className="flex flex-wrap items-center gap-2 text-sm"><span className="text-muted-foreground">{t.year}:</span>
            {(m === "global" ? tableYears : years).map((y) => <Button key={y} size="sm" variant={y === year ? "default" : "outline"} onClick={() => setYearSel(y)}>{y}</Button>)}
          </div>
        )}

        <Card>
          <CardHeader><CardTitle className="font-serif">{t.trend}</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="year" /><YAxis domain={[0, 100]} /><Tooltip /><Legend />
                  {euAvg != null && <ReferenceLine y={euAvg} strokeDasharray="4 4" label={`${t.eu} ${year}: ${euAvg}`} />}
                  {chartIsos.map((i, k) => <Line key={i} dataKey={i} name={nameOf(i)} stroke={LINE[k % 3]} strokeWidth={2} connectNulls={false} dot />)}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <Src href={tiSrc.href} label={`${t.source}: Transparency International, Corruption Perceptions Index`} />
          </CardContent>
        </Card>

        {m === "global" && (
          <Card>
            <CardHeader className="space-y-3"><CardTitle className="font-serif">{t.ranking} — CPI {year}</CardTitle>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2">
                <Input placeholder={t.search} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t.search} />
                <select aria-label={t.region} value={region} onChange={(e) => setRegion(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">{t.allRegions}</option>
                  {regions.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <select aria-label={t.sortBy} value={sort} onChange={(e) => setSort(e.target.value as CpiSort)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="rank">{t.sortBy}: {t.sortRank}</option>
                  <option value="score">{t.sortBy}: {t.sortScore}</option>
                  <option value="name">{t.sortBy}: {t.sortName}</option>
                </select>
              </div>
              <p className="text-xs text-muted-foreground">{t.compare}</p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[480px]">
                  <thead><tr className="text-left text-muted-foreground border-b">
                    {([["rank", "#"], ["name", t.country]] as [CpiSort, string][]).map(([k, l]) => (
                      <th key={k} className="py-2 pr-2"><button type="button" onClick={() => setSort(k)} className={sort === k ? "font-semibold text-foreground" : "hover:text-foreground"}>{l}</button></th>))}
                    <th className="pr-2">{t.region}</th>
                    <th className="pr-2"><button type="button" onClick={() => setSort("score")} className={sort === "score" ? "font-semibold text-foreground" : "hover:text-foreground"}>{t.sortScore}</button></th>
                    <th>{t.compareCol}</th></tr></thead>
                  <tbody>{rows.map((r) => (
                    <tr key={r.country_iso3} className="border-b last:border-0" data-testid="cpi-row">
                      <td className="py-2 pr-2 tabular-nums">{r.rank == null ? "—" : `${r.rank_tied ? "=" : ""}${r.rank}`}</td>
                      <td className="pr-2">{nameOf(r.country_iso3)}</td>
                      <td className="pr-2 text-muted-foreground">{regionLabel(r.region)}</td>
                      <td className="pr-2 tabular-nums">{r.score ?? t.unavailable}</td>
                      <td><input type="checkbox" aria-label={`Compare ${r.country_name}`} checked={compare.includes(r.country_iso3)}
                        disabled={!compare.includes(r.country_iso3) && compare.length >= MAX_COMPARE} onChange={() => setCompare((c) => toggleCompare(c, r.country_iso3))} /></td>
                    </tr>))}</tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{t.showing} {rows.length} / {results.filter((r) => r.edition_year === year).length} · {ed?.countries_covered} countries and territories in CPI {year}. {t.tiesNote}</p>
              <Src href={ed?.source_url ?? CPI_SOURCES.cpi} label={`${t.source}: Transparency International, CPI ${year}`} />
            </CardContent>
          </Card>
        )}

        <Card className="border-dashed">
          <CardHeader><CardTitle className="font-serif">{t.survey}</CardTitle><p className="text-sm text-muted-foreground">{t.surveyNote}</p></CardHeader>
          <CardContent className="grid sm:grid-cols-3 gap-4">
            {surveys.map((s: any) => (
              <div key={s.id} className="space-y-1">
                <Badge variant="outline">{s.survey} {s.survey_year}</Badge>
                <p className="text-2xl font-serif font-semibold">{s.value_pct == null ? t.unavailable : `${s.value_pct}%`}</p>
                <p className="text-sm">{s.geo === "EU" ? (lang === "el" ? "ΕΕ" : "EU") : s.geo === "CY" ? t.switch.cyprus : t.switch.greece}</p>
                <Src href={s.source_url} label={s.source_label} />
              </div>
            ))}
          </CardContent>
        </Card>

        <section className="grid md:grid-cols-2 gap-6">
          <Card><CardHeader><CardTitle className="font-serif text-lg">{t.updates}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {updates.length === 0 && <p className="text-sm text-muted-foreground">{t.none}</p>}
              {updates.map((u: any) => (
                <div key={u.id} className="space-y-1"><Badge variant="secondary">{u.claim_status}</Badge>
                  <a href={u.canonical_url} target="_blank" rel="noopener noreferrer" className="block font-medium hover:underline">{lang === "el" ? u.title_el ?? u.title : u.title}</a>
                  <p className="text-xs text-muted-foreground">{u.publisher} · {date(u.published_at)}</p></div>
              ))}
              <div className="flex flex-wrap gap-3 pt-2"><Src href={CPI_SOURCES.ruleOfLaw} label="European Commission, Rule of Law Report 2026" /><Src href={CPI_SOURCES.greco} label="Council of Europe GRECO" /></div>
            </CardContent></Card>
          <Card><CardHeader><CardTitle className="font-serif text-lg">{t.related}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {related.length === 0 && <p className="text-sm text-muted-foreground">{t.none}</p>}
              {related.map((a: any) => <Link key={a.id} to={articlePath(a.id, a.title)} className="block text-sm hover:underline">{lang === "el" ? a.title_el ?? a.title : a.title}</Link>)}
              <Link to="/compliance" className="block pt-2 text-sm text-primary hover:underline">ComplianceHub.cy →</Link>
            </CardContent></Card>
        </section>
      </main>
      <Footer />
    </div>
  );
}
