import { useState } from "react";
import { BusinessTicker } from "@/components/BusinessTicker";
import { TopNavigation } from "@/components/TopNavigation";
import { HeroBanner } from "@/components/banners/HeroBanner";
import { VerticalNavigator } from "@/components/VerticalNavigator";
import { SectionBanners } from "@/components/banners/SectionBanners";
import { IntelligenceHub } from "@/components/IntelligenceHub";
import { IntelligenceFeed } from "@/components/IntelligenceFeed";
import { VerticalConnection } from "@/components/VerticalConnection";
import { FinTechSpotlight } from "@/components/FinTechSpotlight";
import { EUFundingMatchmaker } from "@/components/EUFundingMatchmaker";
import { ComplianceDashboard } from "@/components/ComplianceDashboard";
import { SearchResults } from "@/components/SearchResults";
import { Footer } from "@/components/Footer";
import { PartnerStrip } from "@/components/banners/PartnerStrip";

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
      
      {/* Top Navigation */}
      <TopNavigation onSearch={handleSearch} />

      {/* Hero Banner — Business Intelligence Positioning */}
      <HeroBanner />
      
      {/* Main Content */}
      <main>
        {/* Secondary Section Banners — Compliance, FinTech, Risk */}
        <SectionBanners />

        {/* Intelligence Hub - Featured News & Trending People */}
        <IntelligenceHub />
        
        {/* Vertical Connection - News linked to Profiles */}
        <VerticalConnection />
        
        {/* FinTech Spotlight */}
        <FinTechSpotlight />
        
        {/* EU Funding Matchmaker */}
        <EUFundingMatchmaker />
        
        {/* Compliance & Risk Dashboard */}
        <ComplianceDashboard />
      </main>
      
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
