import { useState } from "react";
import { BusinessTicker } from "@/components/BusinessTicker";
import { TopNavigation } from "@/components/TopNavigation";
import { IntelligenceHub } from "@/components/IntelligenceHub";
import { VerticalConnection } from "@/components/VerticalConnection";
import { EUFundingMatchmaker } from "@/components/EUFundingMatchmaker";
import { ComplianceDashboard } from "@/components/ComplianceDashboard";
import { SearchResults } from "@/components/SearchResults";
import { Footer } from "@/components/Footer";

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
        
        {/* Vertical Connection - News linked to Profiles */}
        <VerticalConnection />
        
        {/* EU Funding Matchmaker */}
        <EUFundingMatchmaker />
        
        {/* Compliance & Risk Dashboard */}
        <ComplianceDashboard />
      </main>
      
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
