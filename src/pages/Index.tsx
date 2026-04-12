import { useState } from "react";
import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { Landmark, Euro, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InlineAdSlot } from "@/components/banners/AdSlot";
import { BusinessTicker } from "@/components/BusinessTicker";
import { TopNavigation } from "@/components/TopNavigation";
import { HeroBanner } from "@/components/banners/HeroBanner";
import { VerticalNavigator } from "@/components/VerticalNavigator";
import { SectionBanners } from "@/components/banners/SectionBanners";
import { IntelligenceHub } from "@/components/IntelligenceHub";
import { IntelligenceFeed } from "@/components/IntelligenceFeed";
import { SponsoredStudio } from "@/components/SponsoredStudio";
import { VerticalConnection } from "@/components/VerticalConnection";
import { KnowledgeGraph } from "@/components/KnowledgeGraph";
import { SearchResults } from "@/components/SearchResults";
import { Footer } from "@/components/Footer";
import { PartnerStrip } from "@/components/banners/PartnerStrip";
import { PremiumCTABanner } from "@/components/banners/PremiumCTABanner";
import { ArticleCounter } from "@/components/auth/ArticleCounter";
import { LeaderboardAdSlot } from "@/components/banners/LeaderboardAdSlot";
import { DirectoryPreview } from "@/components/DirectoryPreview";
import { FeaturedCompaniesSection } from "@/components/FeaturedCompaniesSection";

function HubTripleRow() {
  const hubs = [
    {
      icon: <Landmark className="h-6 w-6 text-fintech" />,
      title: "FinTech Hub",
      description: "MiCA, DORA, AML & NIS2 regulatory coverage, licensing news, and fintech intelligence.",
      href: "/fintech",
      cta: "Explore FinTech",
      accentClass: "bg-fintech/10 border-fintech/20",
      iconBg: "bg-fintech/10",
    },
    {
      icon: <Euro className="h-6 w-6 text-secondary" />,
      title: "EU Funding & Grants",
      description: "Check eligibility for Horizon Europe, Digital Europe, and other EU programmes for Cyprus businesses.",
      href: "/sme",
      cta: "Open SME Toolkit",
      accentClass: "bg-secondary/10 border-secondary/20",
      iconBg: "bg-secondary/10",
    },
    {
      icon: <Shield className="h-6 w-6 text-compliance" />,
      title: "Compliance & Risk",
      description: "Regulatory alerts, AML compliance tools, and country risk analysis on the dedicated hub.",
      href: "/compliance",
      cta: "Open Compliance",
      accentClass: "bg-compliance/10 border-compliance/20",
      iconBg: "bg-compliance/10",
    },
  ];

  return (
    <section className="py-10 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-5">
          {hubs.map((hub) => (
            <Link
              key={hub.href}
              to={hub.href}
              className={`group flex flex-col p-6 rounded-xl border bg-card hover:shadow-lg hover:border-secondary/30 transition-all ${hub.accentClass}`}
            >
              <div className={`w-12 h-12 rounded-lg ${hub.iconBg} flex items-center justify-center mb-4`}>
                {hub.icon}
              </div>
              <h3 className="font-serif font-bold text-lg text-foreground mb-2 group-hover:text-secondary transition-colors">
                {hub.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5 flex-1">
                {hub.description}
              </p>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-secondary group-hover:gap-2.5 transition-all">
                {hub.cta}
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}



const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCloseSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Cyprus Business Intelligence" description="Real-time business intelligence for Cyprus — compliance, fintech, trade data, company directory, and SME tools." path="/" />
      {/* Live Business Ticker */}
      <BusinessTicker />
      
      {/* Article Limit Counter */}
      <ArticleCounter />

      {/* Top Navigation */}
      <TopNavigation onSearch={handleSearch} />

      {/* Compact Masthead + Trending Topics — FC style */}
      <HeroBanner />

      {/* Vertical Navigator — category tabs */}
      <VerticalNavigator />

      {/* Main Content — content-first, FC-inspired density */}
      <main>
        {/* Intelligence Hub — 3-column hero layout */}
        <IntelligenceHub />

        {/* Ad: Leaderboard after hero */}
        <LeaderboardAdSlot />

        {/* Custom Studio — Sponsored Content */}
        <SponsoredStudio />

        {/* Ad: Billboard mid-page */}
        <InlineAdSlot size="billboard" label="970 × 250 — Billboard" />

        {/* Latest Stories Feed — with inline Premium indicators + sidebar ads */}
        <IntelligenceFeed />

        {/* Ad: Leaderboard mid-feed */}
        <InlineAdSlot size="leaderboard" label="728 × 90 — Mid-Page" />

        {/* Verticals strip */}
        <SectionBanners />

        {/* Intelligence Directory Preview */}
        <DirectoryPreview />

        {/* Ad: Banner between directory and featured */}
        <InlineAdSlot size="banner" label="468 × 60 — Banner" />

        {/* Featured Companies by City */}
        <FeaturedCompaniesSection compact />
        
        {/* Vertical Connection */}
        <VerticalConnection />

        {/* Ad: Leaderboard before knowledge graph */}
        <InlineAdSlot size="leaderboard" label="728 × 90 — Lower" />

        {/* Knowledge Graph */}
        <KnowledgeGraph />
        
        {/* FinTech · EU Funding · Compliance — 3-column row */}
        <HubTripleRow />
      </main>

      {/* Premium CTA Banner */}
      <PremiumCTABanner />
      
      {/* Leaderboard Ad — above footer */}
      <LeaderboardAdSlot />

      {/* Partner Strip */}
      <PartnerStrip />
      
      {/* Footer */}
      <Footer />
      
      {/* Search Results Overlay */}
      {searchQuery && (
        <SearchResults query={searchQuery} onClose={handleCloseSearch} />
      )}
    </div>
  );
};

export default Index;
