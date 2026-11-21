import { useMemo, useState, type ReactNode } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { AdSlot } from "@/components/banners/AdSlot";
import { Button } from "@/components/ui/button";
import { listImage } from "@/lib/fallbackImage";
import { grHref, INTL_PATH } from "@/lib/edition";
import { currentHost, greeceHome, intlHome } from "@/lib/networkEditions";
import { MARKET_LABEL, type Market } from "@/lib/internationalHome";
import {
  INTL_SECTIONS, briefStories, intlSection, intlSectionPath, isIntlSection, latestByMarket, marketCounts, sectionStories,
  type IntlSectionSlug, type MarketFilter, type StorySection,
} from "@/lib/internationalSections";
import { useStatSeries } from "@/hooks/useStatSeries";
import { formatValue, latestCommonPeriod, latestWithYoy, periodLabel, seriesFor } from "@/lib/greecePulse";
import { databrowserUrl } from "@/lib/eurostatView";
import { DataBlock, FundingBlock, Heading, MarketEditions, MarketTag, StoryList, storyHref, useNetworkStories } from "@/components/intl/IntlBlocks";

/** How many stories the section pages read: enough for a few weeks of every market. */
const POOL = 800;
const PAGE = 20;

type RelLink = { to: string; label: string; note: string };

/** Pages of the Cyprus and Greece editions that go deeper on each section's subject. */
const RELATED: Record<StorySection, RelLink[]> = {
  companies: [
    { to: "/company-announcements", label: "Company announcements", note: "Cyprus disclosures, each linked to its filing" },
    { to: "/directory", label: "Business directory", note: "61,000+ registered Cyprus companies" },
    { to: "/rankings", label: "Cyprus rankings", note: "Companies and markets from official data" },
    { to: grHref("/greece/announcements"), label: "Greek company announcements", note: "Results, deals and disclosures in Greece" },
  ],
  fintech: [
    { to: "/fintech", label: "FinTechHub.cy", note: "Cyprus digital finance and payments" },
    { to: "/directory/cysec-licensed-firms", label: "CySEC-licensed firms", note: "From the official register" },
    { to: "/regtech", label: "RegTechHub.cy", note: "Technology for regulatory work" },
    { to: grHref("/greece/fintech"), label: "Greece fintech", note: "Greek payments and digital banking" },
  ],
  compliance: [
    { to: "/compliance", label: "ComplianceHub.cy", note: "AML, sanctions and regulatory news" },
    { to: "/compliance/regulatory-updates", label: "Regulatory updates", note: "Circulars and directives, with documents" },
    { to: "/compliance/sanctions", label: "Sanctions updates", note: "EU, UN and national changes" },
    { to: "/compliance/deadlines", label: "Compliance deadlines", note: "Upcoming reporting dates" },
  ],
  funding: [
    { to: "/funding", label: "Funding & subsidies", note: "The full catalogue of Cyprus and EU calls" },
    { to: grHref("/greece/funding"), label: "Greece funding", note: "Greek programmes and funding news" },
    { to: grHref("/greece/opportunities"), label: "Greek public tenders", note: "Every open tender, searchable" },
  ],
};

function Related({ links }: { links: RelLink[] }) {
  return <aside className="border border-border rounded-lg bg-card p-5 h-fit">
    <h2 className="text-xs font-bold uppercase tracking-wider border-b border-foreground pb-1">Go deeper</h2>
    <ul className="divide-y divide-border">{links.map((l) => <li key={l.to} className="py-3">
      <Link to={l.to} className="font-semibold hover:underline">{l.label}</Link>
      <p className="text-xs text-muted-foreground mt-0.5">{l.note}</p>
    </li>)}</ul>
  </aside>;
}

const FILTERS: MarketFilter[] = ["all", "intl", "gr", "cy"];

/** A section that lists stories: market filter, lead story, then the rest newest first. */
function StorySectionView({ section }: { section: StorySection }) {
  const { data: rows = [], isLoading } = useNetworkStories(POOL);
  const [params, setParams] = useSearchParams();
  const raw = params.get("market");
  const market: MarketFilter = raw === "intl" || raw === "gr" || raw === "cy" ? raw : "all";
  const [shown, setShown] = useState(PAGE);
  const counts = useMemo(() => marketCounts(rows, section), [rows, section]);
  const list = useMemo(() => sectionStories(rows, section, market), [rows, section, market]);
  const lead = list.find((s) => !!s.image_url) ?? list[0];
  const rest = list.filter((s) => s.id !== lead?.id);
  const first = rest.slice(0, Math.min(10, shown));
  const second = rest.slice(10, shown);
  const setMarket = (m: MarketFilter) => { const p = new URLSearchParams(params); if (m === "all") p.delete("market"); else p.set("market", m); setParams(p, { replace: true }); setShown(PAGE); };

  return <div className="grid lg:grid-cols-3 gap-8 mt-6">
    <div className="lg:col-span-2 min-w-0">
      <div role="group" aria-label="Market" className="flex flex-wrap gap-2">
        {FILTERS.map((m) => <Button key={m} size="sm" variant={market === m ? "default" : "outline"} aria-pressed={market === m} onClick={() => setMarket(m)}>
          {m === "all" ? "All markets" : MARKET_LABEL[m]} <span className="ml-1 opacity-70">{counts[m]}</span>
        </Button>)}
      </div>
      {isLoading && !rows.length ? <div className="mt-6 aspect-video rounded bg-muted animate-pulse" />
        : !lead ? <p className="mt-6 border border-dashed border-border p-6 text-sm text-muted-foreground">No stories in this section{market !== "all" ? ` for ${MARKET_LABEL[market as Market]}` : ""} yet.</p>
        : <>
          <Link to={storyHref(lead)} className="group block mt-6">
            <div className="aspect-video overflow-hidden rounded bg-muted">
              <img src={listImage(list, 0)} alt="" data-vertical={lead.vertical ?? undefined} data-seed={lead.id} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <span className="block mt-3"><MarketTag s={lead} /></span>
            <h2 className="font-serif text-2xl md:text-3xl font-bold leading-tight group-hover:underline">{lead.title}</h2>
            {lead.summary && <p className="text-muted-foreground mt-2 line-clamp-3">{lead.summary}</p>}
            <p className="text-xs text-muted-foreground mt-2">{format(new Date(lead.published_at), "d MMM yyyy")}</p>
          </Link>
          <div className="mt-6"><StoryList rows={first} /></div>
          {second.length > 0 && <>
            <div className="my-6"><AdSlot size="leaderboard" slotId="intl-mid" /></div>
            <StoryList rows={second} />
          </>}
          {rest.length > shown && <div className="mt-6 text-center"><Button variant="outline" onClick={() => setShown((n) => n + PAGE)}>Show more stories</Button></div>}
        </>}
    </div>
    <div className="space-y-6"><Related links={RELATED[section]} /></div>
  </div>;
}

/** Markets: each market's newest stories, the edition cards and the Greece–Cyprus brief. */
function MarketsView() {
  const { data: rows = [], isLoading } = useNetworkStories(POOL);
  const host = currentHost();
  const byMarket = useMemo(() => latestByMarket(rows, 6), [rows]);
  const brief = useMemo(() => briefStories(rows, 8), [rows]);
  const cols: { m: Market; more: { to: string; label: string } }[] = [
    { m: "intl", more: { to: "/news?scope=international", label: "More" } },
    { m: "gr", more: { to: greeceHome(host).href, label: "Greece edition" } },
    { m: "cy", more: { to: "/news?scope=cyprus", label: "More" } },
  ];
  return <>
    <div className="grid md:grid-cols-3 gap-8 mt-6">
      {cols.map(({ m, more }) => <section key={m} aria-labelledby={`m-${m}`} className="min-w-0">
        <Heading id={`m-${m}`} more={more}>{MARKET_LABEL[m]}</Heading>
        {isLoading && !rows.length ? <div className="h-64 rounded bg-muted animate-pulse" /> : <StoryList rows={byMarket[m]} compact />}
      </section>)}
    </div>
    <div className="mt-10"><AdSlot size="leaderboard" slotId="intl-mid" /></div>
    <MarketEditions />
    {brief.length > 0 && <section aria-labelledby="brief" className="mt-12">
      <Heading id="brief">Greece–Cyprus business brief</Heading>
      <div className="grid md:grid-cols-2 gap-x-8"><StoryList rows={brief.slice(0, Math.ceil(brief.length / 2))} /><StoryList rows={brief.slice(Math.ceil(brief.length / 2))} /></div>
    </section>}
    <DataBlock title="Cyprus, Greece and the EU" more={{ to: intlSectionPath("data"), label: "All data" }} />
  </>;
}

type Tender = { reference_number: string; title: string; authority_name: string | null; deadline_at: string | null; value_without_vat: number | null; currency: string | null; official_url: string };

/** Smaller notices (office supplies, minor services) stay on the full tenders page. */
const MIN_TENDER_VALUE = 100_000;

/** Larger Greek public tenders closing soonest, as published on KIMDIS (titles stay in Greek). */
function GreekTenders() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["intl-gr-tenders"],
    staleTime: 600_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("gr_procurement_notices")
        .select("reference_number,title,authority_name,deadline_at,value_without_vat,currency,official_url")
        .eq("kind", "tender").is("superseded_by", null).eq("cancelled", false).gt("deadline_at", new Date().toISOString())
        .gte("value_without_vat", MIN_TENDER_VALUE).order("deadline_at", { ascending: true }).limit(6);
      if (error) throw error;
      return (data ?? []) as Tender[];
    },
  });
  if (!isLoading && !data.length) return null;
  return <section aria-labelledby="tenders" className="mt-12">
    <Heading id="tenders" more={{ to: grHref("/greece/opportunities"), label: "All Greek tenders" }}>Larger Greek public tenders closing soon</Heading>
    <p className="text-xs text-muted-foreground">Over €100,000, from KIMDIS, Greece's official procurement register. Titles are shown in Greek, as published.</p>
    <ul className="divide-y divide-border mt-2">{data.map((t) => <li key={t.reference_number} className="py-3 grid sm:grid-cols-[1fr_auto] gap-x-6 gap-y-1">
      <div className="min-w-0">
        <a href={t.official_url} target="_blank" rel="noopener noreferrer" lang="el" className="font-serif font-semibold hover:underline line-clamp-2">{t.title}</a>
        {t.authority_name && <p className="text-xs text-muted-foreground mt-0.5" lang="el">{t.authority_name}</p>}
      </div>
      <div className="text-sm sm:text-right whitespace-nowrap">
        {t.deadline_at && <p><span className="text-muted-foreground">Closes</span> {format(new Date(t.deadline_at), "d MMM yyyy")}</p>}
        {t.value_without_vat != null && <p className="text-muted-foreground">{t.currency === "EUR" || !t.currency ? "€" : `${t.currency} `}{Math.round(t.value_without_vat).toLocaleString("en-GB")} excl. VAT</p>}
      </div>
    </li>)}</ul>
  </section>;
}

/** Funding: open calls, Greek tenders and funding news. */
function FundingView() {
  const { data: rows = [] } = useNetworkStories(POOL);
  const news = useMemo(() => sectionStories(rows, "funding").slice(0, 8), [rows]);
  return <div className="grid lg:grid-cols-3 gap-8">
    <div className="lg:col-span-2 min-w-0">
      <FundingBlock title="Open funding calls" />
      <GreekTenders />
      <div className="mt-10"><AdSlot size="leaderboard" slotId="intl-mid" /></div>
      {news.length > 0 && <section aria-labelledby="funding-news" className="mt-12">
        <Heading id="funding-news">Funding news</Heading>
        <StoryList rows={news} />
      </section>}
    </div>
    <div className="mt-12"><Related links={RELATED.funding} /></div>
  </div>;
}

/** Annual and monthly series Eurostat publishes for both Cyprus and the EU. */
const CY_EU = ["employment_rate", "net_earnings", "disposable_income", "household_consumption", "saving_rate", "price_level", "hicp_food", "arope_rate"];
/** Greece-only official series (Eurostat), latest value with change on a year earlier. */
const GR_ONLY = ["gr_goods_exports", "gr_goods_imports", "gr_travel_receipts"];

function SourceLink({ code, updated }: { code: string; updated: string | null }) {
  return <><a href={databrowserUrl(code)} target="_blank" rel="noopener noreferrer" className="underline">Eurostat {code}</a>{updated && <> · {format(new Date(updated), "d MMM yyyy")}</>}</>;
}

/** Data: three-way comparison, Cyprus against the EU, and Greece's trade and travel figures. */
function DataView() {
  const q = useStatSeries([...CY_EU, ...GR_ONLY]);
  const cyEu = CY_EU.map((code) => {
    const ds = q.data?.datasets[code];
    const obs = q.data?.obs[code] ?? [];
    const period = ds ? latestCommonPeriod(obs.filter((o) => o.geo === "CY" || o.geo === "EU27_2020"), ["CY", "EU27_2020"]) : null;
    const at = (g: string) => obs.find((o) => o.geo === g && o.period === period)?.value;
    return ds && period ? { ds, period, cy: at("CY"), eu: at("EU27_2020") } : null;
  }).filter((x): x is NonNullable<typeof x> => !!x);
  const gr = GR_ONLY.map((code) => {
    const ds = q.data?.datasets[code];
    const { latest, change } = latestWithYoy(seriesFor(q.data?.obs[code] ?? [], "EL"), "percent");
    return ds && latest ? { ds, latest, change } : null;
  }).filter((x): x is NonNullable<typeof x> => !!x);

  return <>
    <DataBlock title="Cyprus, Greece and the EU" more={{ to: "/compare/greece-cyprus", label: "Full comparison" }} />
    {q.isLoading && <div className="mt-8 h-48 rounded bg-muted animate-pulse" />}
    {cyEu.length > 0 && <section aria-labelledby="cy-eu" className="mt-12">
      <Heading id="cy-eu" more={{ to: "/economy", label: "Cyprus economy" }}>Cyprus compared with the EU</Heading>
      <div className="overflow-x-auto">
        <table className="w-full text-sm mt-2">
          <thead><tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
            <th className="py-2 pr-4 font-semibold">Indicator</th><th className="py-2 pr-4 font-semibold">Period</th>
            <th className="py-2 pr-4 font-semibold text-right">Cyprus</th><th className="py-2 pr-4 font-semibold text-right">EU</th><th className="py-2 font-semibold">Source</th>
          </tr></thead>
          <tbody className="divide-y divide-border">{cyEu.map(({ ds, period, cy, eu }) => <tr key={ds.code}>
            <td className="py-2.5 pr-4"><span className="font-medium">{ds.title_en}</span><span className="block text-xs text-muted-foreground">{ds.unit_label}</span></td>
            <td className="py-2.5 pr-4 whitespace-nowrap">{periodLabel(period, "en")}</td>
            <td className="py-2.5 pr-4 text-right font-serif font-semibold whitespace-nowrap">{formatValue(cy, ds.unit_label, ds.decimals, "en") ?? "—"}</td>
            <td className="py-2.5 pr-4 text-right font-serif whitespace-nowrap">{formatValue(eu, ds.unit_label, ds.decimals, "en") ?? "—"}</td>
            <td className="py-2.5 text-xs text-muted-foreground whitespace-nowrap"><SourceLink code={ds.dataset_code} updated={ds.last_success_at} /></td>
          </tr>)}</tbody>
        </table>
      </div>
    </section>}
    <div className="mt-10"><AdSlot size="leaderboard" slotId="intl-mid" /></div>
    {gr.length > 0 && <section aria-labelledby="gr-data" className="mt-12">
      <Heading id="gr-data" more={{ to: grHref("/greece/business-pulse"), label: "Greece Business Pulse" }}>Greece: trade and travel</Heading>
      <div className="grid md:grid-cols-3 gap-5 mt-4">{gr.map(({ ds, latest, change }) => <div key={ds.code} className="border border-border rounded-lg bg-card p-5">
        <h3 className="font-serif font-semibold text-lg">{ds.title_en}</h3>
        <p className="text-xs text-muted-foreground">{ds.unit_label} · {periodLabel(latest.period, "en")}</p>
        <p className="text-2xl font-serif font-semibold mt-3">{formatValue(latest.value, ds.unit_label, ds.decimals, "en")}</p>
        {change != null && <p className="text-xs text-muted-foreground mt-1">{change >= 0 ? "+" : "−"}{Math.abs(change).toFixed(1)}% on a year earlier</p>}
        <p className="text-[11px] text-muted-foreground mt-3">Source: <SourceLink code={ds.dataset_code} updated={ds.last_success_at} /></p>
      </div>)}</div>
    </section>}
    <p className="text-sm mt-8 flex flex-wrap gap-x-5 gap-y-1">
      <Link to="/economy" className="underline">Cyprus economy dashboard</Link>
      <Link to={grHref("/greece/business-pulse")} className="underline">Greece Business Pulse</Link>
      <Link to="/compare/greece-cyprus" className="underline">Greece–Cyprus comparison</Link>
      <Link to="/open-data" className="underline">Open data sources</Link>
    </p>
  </>;
}

function SectionTabs({ current }: { current: IntlSectionSlug }) {
  return <nav aria-label="International sections" className="mt-5 -mx-4 px-4 overflow-x-auto">
    <ul className="flex gap-1 border-b border-border min-w-max">{INTL_SECTIONS.map((s) => <li key={s.slug}>
      <Link to={intlSectionPath(s.slug)} aria-current={s.slug === current ? "page" : undefined}
        className={`block px-3 py-2 text-sm font-semibold border-b-2 -mb-px ${s.slug === current ? "border-secondary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{s.label}</Link>
    </li>)}</ul>
  </nav>;
}

export default function InternationalSectionPage() {
  const { section } = useParams();
  if (!isIntlSection(section)) return <Navigate to={INTL_PATH} replace />;
  const meta = intlSection(section);
  const home = intlHome(currentHost());
  let body: ReactNode;
  if (section === "markets") body = <MarketsView />;
  else if (section === "funding") body = <FundingView />;
  else if (section === "data") body = <DataView />;
  else body = <StorySectionView key={section} section={section} />;

  return <div className="min-h-screen bg-background">
    <SEOHead title={`${meta.title} — International | BHub Network`} description={meta.intro} path={intlSectionPath(section)} />
    <TopNavigation onSearch={() => {}} />
    <div className="container mx-auto px-4 pt-5"><AdSlot size="wide-banner" slotId="intl-top" /></div>
    <main className="container mx-auto px-4 py-6">
      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground flex items-center gap-1">
        {home.external ? <a href={home.href} className="hover:underline">International</a> : <Link to={home.href} className="hover:underline">International</Link>}
        <ChevronRight className="h-3 w-3" aria-hidden /> <span aria-current="page">{meta.title}</span>
      </nav>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary mt-3">BHub Network · International edition</p>
      <h1 className="font-serif text-3xl md:text-4xl font-bold mt-1">{meta.title}</h1>
      <p className="text-muted-foreground mt-2 max-w-3xl">{meta.intro}</p>
      <SectionTabs current={section} />
      {body}
      <div className="mt-12"><AdSlot size="leaderboard" slotId="intl-footer" /></div>
    </main>
    <Footer />
  </div>;
}

