import { useState } from "react";
import { BusinessTicker } from "@/components/BusinessTicker";
import { TopNavigation } from "@/components/TopNavigation";
import { HeroBanner } from "@/components/banners/HeroBanner";
import { VerticalNavigator } from "@/components/VerticalNavigator";
import { SectionBanners } from "@/components/banners/SectionBanners";
import { IntelligenceHub } from "@/components/IntelligenceHub";
import { IntelligenceFeed } from "@/components/IntelligenceFeed";
import { PremiumCarousel } from "@/components/PremiumCarousel";
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

      {/* Hero Banner — Business Intelligence Positioning */}
      <HeroBanner />

      {/* Interactive Vertical Navigator */}
      <VerticalNavigator />
      
      {/* Main Content */}
      <main>
        {/* Secondary Section Banners — Compliance, FinTech, Risk */}
        <SectionBanners />

        {/* Intelligence Hub - Featured News & Trending People */}
        <IntelligenceHub />

        {/* Custom Studio — Sponsored Content */}
        <SponsoredStudio />

        <PremiumCarousel />

        {/* Intelligence Briefings — Semafor-style Cards */}
        <IntelligenceFeed />
        
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
