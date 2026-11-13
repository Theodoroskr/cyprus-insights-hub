import { useState } from "react";
import { SEOHead } from "@/components/SEOHead";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { Link } from "react-router-dom";
import { Landmark, Euro, Shield, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BusinessTicker } from "@/components/BusinessTicker";
import { NewsTicker } from "@/components/NewsTicker";
import { TopNavigation } from "@/components/TopNavigation";
import { HeroBanner } from "@/components/banners/HeroBanner";
import { VerticalNavigator } from "@/components/VerticalNavigator";
import { SectionBanners } from "@/components/banners/SectionBanners";
import { IntelligenceHub } from "@/components/IntelligenceHub";
import { IntelligenceFeed } from "@/components/IntelligenceFeed";
import { StoryPackage } from "@/components/StoryPackage";
import { SponsoredStudio } from "@/components/SponsoredStudio";
import { SearchResults } from "@/components/SearchResults";
import { Footer } from "@/components/Footer";
import { PartnerStrip } from "@/components/banners/PartnerStrip";
import { ArticleCounter } from "@/components/auth/ArticleCounter";
import { LeaderboardAdSlot } from "@/components/banners/LeaderboardAdSlot";
import { DirectoryPreview } from "@/components/DirectoryPreview";
import { DirectoryCtaBanner } from "@/components/DirectoryCtaBanner";
import { UtilityBar } from "@/components/UtilityBar";
import { AdSlot } from "@/components/banners/AdSlot";

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
    <section className="py-8 bg-muted/30">
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
  const [showBeta, setShowBeta] = useState(() => typeof window === "undefined" || !localStorage.getItem("bh_beta_dismissed"));

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
      <NewsTicker />
      
      {/* Article Limit Counter */}
      <ArticleCounter />

      <UtilityBar />
      <div className="py-3"><div className="container mx-auto px-4"><AdSlot size="billboard" slotId="homepage-top" /></div></div>

      {/* Top Navigation */}
      <TopNavigation onSearch={handleSearch} />

      {/* Compact Masthead + Trending Topics — FC style */}
      <HeroBanner />

      {/* Free Beta Banner */}
      {showBeta && (
        <div className="bg-secondary/10 border-b border-secondary/20 py-1 text-center text-xs relative">
          <span className="text-foreground">Free during beta — full access, no credit card required.{" "}</span>
          <Link to="/dashboard" className="text-secondary font-semibold hover:underline">Create free account →</Link>
          <button
            aria-label="Dismiss"
            onClick={() => { localStorage.setItem("bh_beta_dismissed", "1"); setShowBeta(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Vertical Navigator — category tabs */}
      <VerticalNavigator />

      {/* Main Content — content-first, FC-inspired density */}
      <main>
        {/* Intelligence Hub — 3-column hero layout */}
        <IntelligenceHub />

        {/* Full coverage — several recent stories about one company or topic */}
        <StoryPackage />

        {/* Main homepage partner placement */}
        <SponsoredStudio />

        {/* Latest Stories Feed — with inline Premium indicators + sidebar ads */}
        <div className="container mx-auto px-4 pt-6"><AdSlot size="billboard" slotId="homepage-feed-top" /></div>
        <IntelligenceFeed />

        {/* Verticals strip */}
        <SectionBanners />

        {/* Intelligence Directory Preview */}
        <DirectoryPreview />

        {/* Featured Companies by City */}
        <DirectoryCtaBanner />

        <LeaderboardAdSlot slotId="homepage-mid" />

        
        {/* FinTech · EU Funding · Compliance — 3-column row */}
        <HubTripleRow />
      </main>

      {/* Newsletter Signup */}
      <NewsletterSignup />

      
      {/* Partner Strip */}
      <PartnerStrip />

      {/* Dedicated footer placement, never repeated above the headlines */}
      <LeaderboardAdSlot slotId="homepage-footer" />
      
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
