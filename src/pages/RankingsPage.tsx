import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ExternalLink, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import {
  inNewsHref, rankShares, yearOnYear, yearsSince, LICENCE_SOURCE_LABEL,
  type RankingsData, type ShareQuote,
} from "@/lib/rankings";

const fmt = (n: number | null | undefined) => (n == null ? "—" : Number(n).toLocaleString("en-GB"));
const longDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";
const monthYear = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : "";

const LISTS = [
  { id: "in-the-news", title: "Most in the news", note: "Last 30 days" },
  { id: "licensed-finance", title: "Licensed finance firms by type", note: "CySEC & Central Bank" },
  { id: "property-sales", title: "Property sales by district", note: "Last 12 months" },
  { id: "companies-by-district", title: "Where companies are registered", note: "Active companies" },
  { id: "oldest-companies", title: "Cyprus's oldest active companies", note: "Top 25" },
  { id: "share-movers", title: "Today's share movers", note: "Cyprus Stock Exchange" },
] as const;

function RankingSection({ id, index, title, intro, source, children }: {
  id: string; index: number; title: string; intro: string; source: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t-4 border-foreground pt-5 mb-14">
      <p className="text-[11px] font-sans font-semibold uppercase tracking-[0.18em] text-secondary">Ranking {index}</p>
      <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-2">{title}</h2>
      <p className="text-muted-foreground max-w-3xl mb-5">{intro}</p>
      {children}
      <p className="text-xs text-muted-foreground mt-4">{source}</p>
    </section>
  );
}

function Rank({ n }: { n: number }) {
  return <span className="font-serif font-black text-2xl text-muted-foreground/40 w-10 text-right shrink-0 tabular-nums">{n}</span>;
}

function Row({ n, children, href }: { n: number; children: React.ReactNode; href?: string | null }) {
  const inner = <><Rank n={n} /><div className="flex-1 min-w-0 flex items-baseline justify-between gap-4">{children}</div></>;
  return href ? (
    <li><Link to={href} className="flex items-center gap-4 py-3 group hover:bg-muted/40 px-2 -mx-2">{inner}</Link></li>
  ) : (
    <li className="flex items-center gap-4 py-3">{inner}</li>
  );
}

function SkeletonList() {
  return <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-8 bg-muted animate-pulse" />)}</div>;
}

export default function RankingsPage() {
  const rankings = useQuery({
    queryKey: ["cyprus-rankings"],
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_rankings");
      if (error) throw error;
      return data as unknown as RankingsData;
    },
  });
  const shares = useQuery({
    queryKey: ["rankings-shares"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("market_quotes")
        .select("symbol, name, value, change_pct, updated_at").eq("active", true).eq("category", "equity");
      if (error) throw error;
      return rankShares((data ?? []) as ShareQuote[]);
    },
  });

  const d = rankings.data;
  // A single story is not a ranking; ties at one story would be listed in arbitrary order.
  const inNews = d?.in_news.filter((n) => n.stories >= 2) ?? [];
  const cysec = d?.licences.filter((l) => l.source === "cysec") ?? [];
  const cbc = d?.licences.filter((l) => l.source === "cbc") ?? [];
  const licenceChecked = d?.licences.map((l) => l.last_seen_at).filter(Boolean).sort().pop();
  const maxDistrict = Math.max(1, ...(d?.districts.map((x) => x.companies) ?? [1]));
  const maxProperty = Math.max(1, ...(d?.property.map((x) => x.last12 ?? 0) ?? [1]));
  const sharesAt = shares.data?.map((s) => s.updated_at).sort().pop();

  return (
    <div className="min-h-screen bg-background select-none" onCopy={(e) => e.preventDefault()} onContextMenu={(e) => e.preventDefault()}>
      <SEOHead
        title="Cyprus Rankings — Companies, Licensed Firms, Property & Shares"
        description="Cyprus rankings built only from official registers and statistics: the oldest active companies, licensed finance firms by type, property sales by district, companies most in the news and today's share movers."
        path="/rankings"
        breadcrumbs={[{ name: "Home", href: "/" }, { name: "Rankings", href: "/rankings" }]}
      />
      <TopNavigation onSearch={() => {}} />

      <header className="container mx-auto px-4 pt-10 pb-8 max-w-5xl">
        <p className="text-[11px] font-sans font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-2">Cyprus Edition · Rankings</p>
        <h1 className="font-serif text-4xl md:text-6xl font-bold text-foreground leading-[1.05] mb-4">Cyprus Rankings</h1>
        <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
          Who leads, where and by how much. Every list is built from official registers and statistics, and
          refreshes on its own when the source updates. Each one names its source.
        </p>

        <nav aria-label="Rankings on this page" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border mt-8">
          {LISTS.map((l, i) => (
            <a key={l.id} href={`#${l.id}`} className="bg-card p-4 group hover:bg-muted/50 transition-colors">
              <span className="font-serif font-black text-3xl text-muted-foreground/30 group-hover:text-secondary transition-colors">{i + 1}</span>
              <p className="font-serif font-bold text-foreground leading-snug mt-1">{l.title}</p>
              <p className="text-xs text-muted-foreground">{l.note}</p>
            </a>
          ))}
        </nav>
      </header>

      <main className="container mx-auto px-4 pb-16 max-w-5xl">
        {rankings.isError && (
          <p className="text-sm text-destructive mb-10">The rankings couldn't be loaded just now. Please try again in a moment.</p>
        )}

        {/* 1. Most in the news */}
        <RankingSection
          id="in-the-news" index={1} title="Most in the news"
          intro="Companies and organisations with at least two BusinessHub stories in the last 30 days. Only links an editor or the official company register has confirmed are counted."
          source={<>Source: BusinessHub.cy news coverage, confirmed company links only.{d ? ` Counted ${longDate(d.generated_at)}.` : ""}</>}
        >
          {!d ? <SkeletonList /> : inNews.length === 0 ? (
            <p className="text-sm text-muted-foreground">No company had more than one confirmed story in the last 30 days.</p>
          ) : (
            <ol className="divide-y divide-border">
              {inNews.map((n, i) => (
                <Row key={n.entity_id} n={i + 1} href={inNewsHref(n)}>
                  <span className="font-serif font-semibold text-foreground truncate group-hover:text-secondary">{n.label}</span>
                  <span className="text-sm text-muted-foreground whitespace-nowrap tabular-nums">{n.stories} {n.stories === 1 ? "story" : "stories"}</span>
                </Row>
              ))}
            </ol>
          )}
        </RankingSection>

        {/* 2. Licensed finance firms */}
        <RankingSection
          id="licensed-finance" index={2} title="Licensed finance firms by type"
          intro="How many firms hold a current licence of each type. Licences that were renounced, withdrawn or suspended are left out."
          source={<>Source: <a href="https://www.cysec.gov.cy/en-GB/entities/investment-firms/cypriot/" target="_blank" rel="noopener noreferrer" className="underline">CySEC registers</a> and the <a href="https://www.centralbank.cy/en/licensing-supervision/payment-institutions-and-electronic-money-institutions/registers" target="_blank" rel="noopener noreferrer" className="underline">Central Bank of Cyprus registers</a>.{licenceChecked ? ` Last checked ${longDate(licenceChecked)}.` : ""}</>}
        >
          {!d ? <SkeletonList /> : (
            <div className="grid md:grid-cols-2 gap-8">
              {[{ key: "cysec" as const, rows: cysec }, { key: "cbc" as const, rows: cbc }].map(({ key, rows }) => (
                <div key={key}>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-1">{LICENCE_SOURCE_LABEL[key]}</h3>
                  <ol className="divide-y divide-border">
                    {rows.map((l, i) => (
                      <Row key={l.licence_type} n={i + 1} href={key === "cysec" ? "/directory/cysec-licensed-firms" : null}>
                        <span className="text-foreground leading-snug">{l.licence_type}</span>
                        <span className="font-serif font-bold text-lg text-foreground tabular-nums">{fmt(l.firms)}</span>
                      </Row>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          )}
        </RankingSection>

        {/* 3. Property sales */}
        <RankingSection
          id="property-sales" index={3} title="Property sales by district"
          intro={`Sale contracts lodged with the Land Registry in the 12 months to ${monthYear(d?.property_period_end) || "the latest month"}, compared with the 12 months before.`}
          source={<>Source: Department of Lands and Surveys, via <a href="https://www.data.gov.cy" target="_blank" rel="noopener noreferrer" className="underline">data.gov.cy</a>. See the <Link to="/real-estate" className="underline">Real Estate Intelligence</Link> pages for monthly figures.</>}
        >
          {!d ? <SkeletonList /> : (
            <ol className="divide-y divide-border">
              {d.property.map((p, i) => {
                const yoy = yearOnYear(p);
                return (
                  <Row key={p.slug} n={i + 1} href={`/real-estate/${p.slug}`}>
                    <div className="flex-1 min-w-0">
                      <span className="font-serif font-semibold text-foreground group-hover:text-secondary">{p.name_en}</span>
                      <div className="h-1.5 bg-muted mt-1.5"><div className="h-full bg-secondary" style={{ width: `${((p.last12 ?? 0) / maxProperty) * 100}%` }} /></div>
                    </div>
                    <span className="text-right whitespace-nowrap w-32 shrink-0">
                      <span className="font-serif font-bold text-lg text-foreground tabular-nums">{fmt(p.last12)}</span>
                      {yoy != null && (
                        <span className={`block text-xs tabular-nums ${yoy > 0 ? "text-success" : yoy < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                          {yoy > 0 ? "+" : ""}{yoy.toFixed(1)}% on year
                        </span>
                      )}
                    </span>
                  </Row>
                );
              })}
            </ol>
          )}
        </RankingSection>

        {/* 4. Companies by district */}
        <RankingSection
          id="companies-by-district" index={4} title="Where companies are registered"
          intro="Active companies in our directory, by the district of their registered office."
          source={<>Source: Department of Registrar of Companies and Intellectual Property, via the BusinessHub <Link to="/directory" className="underline">Business Directory</Link>.</>}
        >
          {!d ? <SkeletonList /> : (
            <ol className="divide-y divide-border">
              {d.districts.map((x, i) => (
                <Row key={x.slug} n={i + 1} href={`/directory/city/${x.slug}`}>
                  <div className="flex-1 min-w-0">
                    <span className="font-serif font-semibold text-foreground group-hover:text-secondary">{x.name_en}</span>
                    <div className="h-1.5 bg-muted mt-1.5"><div className="h-full bg-primary" style={{ width: `${(x.companies / maxDistrict) * 100}%` }} /></div>
                  </div>
                  <span className="font-serif font-bold text-lg text-foreground tabular-nums w-32 shrink-0 text-right">{fmt(x.companies)}</span>
                </Row>
              ))}
            </ol>
          )}
        </RankingSection>

        {/* 5. Oldest companies */}
        <RankingSection
          id="oldest-companies" index={5} title="Cyprus's oldest active companies"
          intro="The 25 longest-registered companies that are still active, by their date of registration."
          source={<>Source: Department of Registrar of Companies and Intellectual Property. Registration dates as recorded in the official register.</>}
        >
          {!d ? <SkeletonList /> : (
            <ol className="divide-y divide-border">
              {d.oldest.map((c, i) => (
                <Row key={`${c.slug}-${i}`} n={i + 1} href={c.slug ? `/directory/company/${c.slug}` : null}>
                  <span className="min-w-0">
                    <span className="font-serif font-semibold text-foreground group-hover:text-secondary block truncate">{c.name}</span>
                    {c.city && <span className="text-xs text-muted-foreground">{c.city}</span>}
                  </span>
                  <span className="text-right whitespace-nowrap">
                    <span className="text-sm text-foreground tabular-nums">{longDate(c.registration_date)}</span>
                    <span className="block text-xs text-muted-foreground">{yearsSince(c.registration_date)} years</span>
                  </span>
                </Row>
              ))}
            </ol>
          )}
        </RankingSection>

        {/* 6. Share movers */}
        <RankingSection
          id="share-movers" index={6} title="Today's share movers"
          intro="The Cyprus Stock Exchange shares we follow, ranked by today's price change. This covers the shares in our ticker, not the whole market."
          source={<>Source: <a href="https://www.cse.com.cy" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-0.5">Cyprus Stock Exchange<ExternalLink className="h-3 w-3" /></a> closing prices.{sharesAt ? ` Updated ${longDate(sharesAt)}.` : ""} Not investment advice.</>}
        >
          {shares.isLoading ? <SkeletonList /> : (shares.data?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No share prices available right now.</p>
          ) : (
            <ol className="divide-y divide-border">
              {shares.data!.map((s, i) => {
                const Icon = s.change_pct > 0 ? TrendingUp : s.change_pct < 0 ? TrendingDown : Minus;
                const tone = s.change_pct > 0 ? "text-success" : s.change_pct < 0 ? "text-destructive" : "text-muted-foreground";
                return (
                  <Row key={s.symbol} n={i + 1}>
                    <span className="min-w-0">
                      <span className="font-serif font-semibold text-foreground">{s.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{s.symbol}</span>
                    </span>
                    <span className="flex items-center gap-4 whitespace-nowrap tabular-nums">
                      <span className="text-sm text-foreground">€{s.value.toFixed(3)}</span>
                      <span className={`inline-flex items-center gap-1 text-sm font-semibold w-20 justify-end ${tone}`}>
                        <Icon className="h-3.5 w-3.5" />{s.change_pct > 0 ? "+" : ""}{s.change_pct.toFixed(2)}%
                      </span>
                    </span>
                  </Row>
                );
              })}
            </ol>
          )}
        </RankingSection>

        <div className="border border-border p-5 bg-muted/30">
          <p className="font-serif font-bold text-foreground mb-1">Looking for a specific firm?</p>
          <p className="text-sm text-muted-foreground mb-3">Search more than 55,000 Cyprus companies, with their registration details and licences.</p>
          <Link to="/directory" className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-secondary hover:gap-2 transition-all">
            Open the Business Directory <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
