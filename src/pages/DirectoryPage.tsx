import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin } from "lucide-react";
import { NativeAdCard } from "@/components/banners/NativeAdCard";

const categoryFilters = [
  "FinTech",
  "RegTech",
  "Payments",
  "Crypto",
  "Banks",
  "Service Providers",
];

const directoryEntries = [
  {
    name: "CyprusPay Solutions Ltd",
    category: "Payments / FinTech",
    jurisdiction: "Cyprus, EU",
    description: "Digital payments provider operating under EU regulatory frameworks with PSD2 authorization.",
  },
  {
    name: "ComplianceFirst Technologies",
    category: "RegTech",
    jurisdiction: "Cyprus, EU",
    description: "Regulatory technology solutions for AML compliance and transaction monitoring.",
  },
  {
    name: "Mediterranean Digital Bank",
    category: "Bank / EMI",
    jurisdiction: "Cyprus, EU",
    description: "Licensed electronic money institution providing digital banking services across the EU.",
  },
  {
    name: "Nicosia Crypto Exchange",
    category: "Crypto / FinTech",
    jurisdiction: "Cyprus, EU",
    description: "CySEC-registered crypto asset service provider offering digital asset trading.",
  },
  {
    name: "Athena Advisory Partners",
    category: "Service Provider",
    jurisdiction: "Cyprus",
    description: "Professional advisory firm specializing in fintech licensing and regulatory strategy.",
  },
];

export default function DirectoryPage() {
  const handleSearch = (query: string) => {
    console.log("Search:", query);
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation onSearch={handleSearch} />

      {/* Hero Section */}
      <section className="bg-primary py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
            FinTech Directory
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            A curated overview of fintech and financial services ecosystem participants active in Cyprus.
          </p>
        </div>
      </section>

      {/* Category Filters */}
      <section className="py-8 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {categoryFilters.map((filter, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="px-4 py-2 text-sm cursor-default hover:bg-secondary/10 hover:border-secondary transition-colors"
              >
                {filter}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Directory Listings */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-4">
            {directoryEntries.map((entry, index) => (
              <>
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
                          <Building2 className="h-5 w-5 text-secondary" />
                        </div>
                        <CardTitle className="text-lg text-foreground">{entry.name}</CardTitle>
                      </div>
                      <Badge variant="secondary" className="w-fit bg-secondary/10 text-secondary">
                        {entry.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                      <MapPin className="h-4 w-4" />
                      <span>{entry.jurisdiction}</span>
                    </div>
                    <p className="text-muted-foreground">{entry.description}</p>
                  </CardContent>
                </Card>
                {/* Promoted listing after 2nd entry */}
                {index === 1 && (
                  <NativeAdCard
                    title="Premium Partner: Cyprus Legal Associates"
                    description="Leading law firm specializing in fintech licensing, EMI applications, and regulatory compliance across the EU."
                    sponsor="Cyprus Legal Associates"
                    variant="compact"
                  />
                )}
              </>
            ))}
          </div>
        </div>
      </section>

      {/* Neutrality Note */}
      <section className="py-8 border-t border-border">
        <div className="container mx-auto px-4">
          <p className="text-sm text-muted-foreground text-center">
            Listings are informational and do not imply endorsement or ranking.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
