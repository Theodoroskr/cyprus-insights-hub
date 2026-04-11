import { useState } from "react";
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
import { FinTechSpotlight } from "@/components/FinTechSpotlight";
import { EUFundingMatchmaker } from "@/components/EUFundingMatchmaker";
import { ComplianceDashboard } from "@/components/ComplianceDashboard";
import { SearchResults } from "@/components/SearchResults";
import { Footer } from "@/components/Footer";
import { PartnerStrip } from "@/components/banners/PartnerStrip";
import { PremiumCTABanner } from "@/components/banners/PremiumCTABanner";
import { ArticleCounter } from "@/components/auth/ArticleCounter";
import { LeaderboardAdSlot } from "@/components/banners/LeaderboardAdSlot";
import { DirectoryPreview } from "@/components/DirectoryPreview";
import { FeaturedCompaniesSection } from "@/components/FeaturedCompaniesSection";

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
        {/* Intelligence Hub — 3-column hero layout (Lead + Secondary + Most Read) */}
        <IntelligenceHub />

        {/* Leaderboard Ad — after hero section */}
        <LeaderboardAdSlot />

        {/* Custom Studio — Sponsored Content (FC "Custom Studio" pattern) */}
        <SponsoredStudio />

        {/* Latest Stories Feed — with inline Premium indicators */}
        <IntelligenceFeed />

        {/* Verticals strip — Compliance, FinTech, Risk */}
        <SectionBanners />

        {/* Intelligence Directory Preview */}
        <DirectoryPreview />

        {/* Featured Companies by City */}
        <FeaturedCompaniesSection compact />
        
        {/* Vertical Connection - News linked to Profiles */}
        <VerticalConnection />

        {/* Knowledge Graph — Person ↔ Article connections */}
        <KnowledgeGraph />
        
        {/* FinTech Spotlight */}
        <FinTechSpotlight />
        
        {/* EU Funding Matchmaker */}
        <EUFundingMatchmaker />
        
        {/* Compliance & Risk Dashboard */}
        <ComplianceDashboard />
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
