import { useState } from "react";
import { BusinessTicker } from "@/components/BusinessTicker";
import { TopNavigation } from "@/components/TopNavigation";
import { IntelligenceHub } from "@/components/IntelligenceHub";
import { VerticalConnection } from "@/components/VerticalConnection";
import { FinTechSpotlight } from "@/components/FinTechSpotlight";
import { EUFundingMatchmaker } from "@/components/EUFundingMatchmaker";
import { ComplianceDashboard } from "@/components/ComplianceDashboard";
import { SearchResults } from "@/components/SearchResults";
import { Footer } from "@/components/Footer";
import { NativeAdCard } from "@/components/banners/NativeAdCard";
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
      
      {/* Main Content */}
      <main>
        {/* Intelligence Hub - Featured News & Trending People */}
        <IntelligenceHub />
        
        {/* Sponsored Content */}
        <div className="container mx-auto px-4 py-8">
          <NativeAdCard
            title="Expert Advisory Services for EU Market Entry"
            description="Navigate Cyprus fintech regulations with confidence. Our advisory partners specialize in licensing, compliance, and market strategy for EU expansion."
            sponsor="Premier Advisory Group"
            ctaText="Explore Services"
          />
        </div>
        
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
