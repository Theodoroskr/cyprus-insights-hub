import { useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { AdSlot } from "@/components/banners/AdSlot";
import { Button } from "@/components/ui/button";
import { listImage } from "@/lib/fallbackImage";
import { buildIntlHome } from "@/lib/internationalHome";
import { intlSectionPath } from "@/lib/internationalSections";
import { DataBlock, FundingBlock, Heading, MarketEditions, MiniCard, MarketTag, StoryList, storyHref, useNetworkStories, type Row } from "@/components/intl/IntlBlocks";

export default function InternationalPage() {
  const { data: rows = [], isLoading } = useNetworkStories();
  const home = useMemo(() => buildIntlHome(rows), [rows]);
  const { hash } = useLocation();
  // Menu links such as "Fintech" jump to their block once the stories are on the page.
  useEffect(() => {
    if (!hash || isLoading) return;
    const t = window.setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    return () => window.clearTimeout(t);
  }, [hash, isLoading]);

  const top = [home.lead, ...home.latest, ...home.more].filter((s): s is Row => !!s);
  const blocks = [
    { id: "brief", title: "Greece–Cyprus business brief", rows: home.brief, more: intlSectionPath("markets") },
    { id: "companies", title: "Companies & investment", rows: home.companies, more: intlSectionPath("companies") },
    { id: "fintech", title: "Fintech & payments", rows: home.fintech, more: intlSectionPath("fintech") },
    { id: "compliance", title: "Compliance & risk", rows: home.compliance, more: intlSectionPath("compliance") },
  ].filter((b) => b.rows.length);
  const briefTarget = home.brief.length ? "#brief" : "#top";

  return <div className="min-h-screen bg-background">
    <SEOHead title="Business intelligence across markets | BHub Network"
      description="Company developments, investment, regulation, funding and official economic data across Cyprus, Greece and the EU, from the BHub Network editions."
      path="/intl" />
    <TopNavigation onSearch={() => {}} />
    <div className="container mx-auto px-4 pt-5"><AdSlot size="wide-banner" slotId="intl-top" /></div>
    <main className="container mx-auto px-4 py-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">BHub Network · International edition</p>
      <h1 className="font-serif text-3xl md:text-4xl font-bold mt-1">Business intelligence across markets</h1>
      <p className="text-muted-foreground mt-2 max-w-3xl">Follow company developments, investment, regulation, funding and economic data across Cyprus, Greece and the EU.</p>
      <div className="flex flex-wrap gap-3 mt-4">
        <Button asChild><a href="#markets">Explore markets</a></Button>
        <Button asChild variant="outline"><a href={briefTarget}>Read the latest brief</a></Button>
      </div>

      <section aria-labelledby="top" className="mt-8">
        <h2 id="top" className="sr-only scroll-mt-24">Top stories</h2>
        {isLoading && !top.length ? <div className="grid lg:grid-cols-3 gap-8"><div className="lg:col-span-2 aspect-video rounded bg-muted animate-pulse" /><div className="h-96 rounded bg-muted animate-pulse" /></div>
          : home.lead ? <>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 min-w-0">
              <Link to={storyHref(home.lead)} className="group block">
                <div className="aspect-video overflow-hidden rounded bg-muted">
                  <img src={listImage(top, 0)} alt="" data-vertical={home.lead.vertical ?? undefined} data-seed={home.lead.id} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <span className="block mt-3"><MarketTag s={home.lead} /></span>
                <h3 className="font-serif text-2xl md:text-3xl font-bold leading-tight group-hover:underline">{home.lead.title}</h3>
                {home.lead.summary && <p className="text-muted-foreground mt-2 line-clamp-3">{home.lead.summary}</p>}
              </Link>
              {home.more.length > 0 && <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border">
                {home.more.map((s, i) => <MiniCard key={s.id} s={s} rows={top} i={1 + home.latest.length + i} />)}
              </div>}
            </div>
            <aside className="min-w-0">
              <h3 className="text-xs font-bold uppercase tracking-wider border-b border-foreground pb-1">Latest across the network</h3>
              <StoryList rows={home.latest} compact />
            </aside>
          </div>
        </> : <p className="border border-dashed border-border p-6 text-sm text-muted-foreground">No published stories yet.</p>}
      </section>

      <div className="mt-10"><AdSlot size="leaderboard" slotId="intl-mid" /></div>

      <MarketEditions more={{ to: intlSectionPath("markets"), label: "All markets" }} />

      {blocks.length > 0 && <div className="grid md:grid-cols-2 gap-x-8 gap-y-10 mt-12">
        {blocks.map((b, i) => <section key={b.id} aria-labelledby={b.id} className={`min-w-0 ${i === blocks.length - 1 && blocks.length % 2 ? "md:col-span-2" : ""}`}>
          <Heading id={b.id} more={{ to: b.more, label: "More" }}>{b.title}</Heading>
          <StoryList rows={b.rows} />
        </section>)}
      </div>}

      <FundingBlock more={{ to: intlSectionPath("funding"), label: "All funding" }} />

      <div className="mt-12"><AdSlot size="leaderboard" slotId="intl-footer" /></div>

      <DataBlock more={{ to: intlSectionPath("data"), label: "All data" }} />
    </main>
    <Footer />
  </div>;
}
