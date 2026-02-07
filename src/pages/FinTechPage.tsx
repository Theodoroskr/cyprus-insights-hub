import { useState } from "react";
import { Link } from "react-router-dom";
import { HubLayout } from "@/layouts/HubLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Shield, Scale, Server, ArrowRight, TrendingUp, Building2, Users, Landmark } from "lucide-react";
import { InsightBanner } from "@/components/banners/InsightBanner";

const stats = [
  { label: "Licensed EMIs", value: "45+", icon: Building2 },
  { label: "CySEC Regulated", value: "120+", icon: Shield },
  { label: "FinTech Startups", value: "80+", icon: TrendingUp },
  { label: "Industry Jobs", value: "5,000+", icon: Users },
];

const featuredCards = [
  {
    title: "Cyprus as an EU FinTech Gateway",
    excerpt: "Why Cyprus is emerging as a compliance-first entry point for EU fintech operations.",
    tag: "FinTech Intelligence",
  },
  {
    title: "EU Regulation Snapshot for FinTechs",
    excerpt: "What MiCA, AML, and DORA mean in practice for fintechs operating from Cyprus.",
    tag: "Regulation",
  },
  {
    title: "Digital Assets Licensing in Cyprus",
    excerpt: "Complete guide to obtaining CASP registration and operating under MiCA framework.",
    tag: "Licensing",
  },
];

const regulations = [
  { name: "MiCA", icon: FileText, description: "Markets in Crypto-Assets Regulation" },
  { name: "EU AML Package", icon: Shield, description: "Anti-Money Laundering Framework" },
  { name: "DORA", icon: Server, description: "Digital Operational Resilience Act" },
  { name: "NIS2", icon: Scale, description: "Network and Information Security" },
];

export default function FinTechPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    console.log("Search:", query);
  };

  return (
    <HubLayout brand="fintechhub" onSearch={handleSearch}>
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-fintech to-fintech-light" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
              <Landmark className="h-7 w-7 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            FinTechHub<span className="text-secondary">.cy</span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-8">
            Independent intelligence on FinTech, RegTech, and digital finance in Cyprus.
          </p>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mt-12">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white/10 backdrop-blur rounded-lg p-4">
                <stat.icon className="h-5 w-5 text-secondary mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured FinTech Intelligence */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground mb-8">Featured FinTech Intelligence</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {featuredCards.map((card, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow border-border group">
                <CardHeader>
                  <Badge variant="secondary" className="w-fit mb-2 bg-fintech/10 text-fintech">
                    {card.tag}
                  </Badge>
                  <CardTitle className="text-xl text-foreground group-hover:text-fintech transition-colors">
                    {card.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{card.excerpt}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Inline Insight Banner */}
      <div className="container mx-auto px-4 py-8">
        <InsightBanner
          text="Fintech firms operating across jurisdictions often adopt unified compliance and onboarding platforms to support growth and licensing. Solutions like ComplianceSuite help streamline regulatory workflows across multiple EU frameworks."
          ctaText="See how this is operationalised"
          href="/compliance"
        />
      </div>

      {/* Regulation Snapshot */}
      <section id="regulations" className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground mb-8">Regulation Snapshot</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {regulations.map((reg, index) => (
              <Link to="/resources" key={index}>
                <Card className="hover:shadow-lg transition-all hover:border-fintech/50 cursor-pointer h-full">
                  <CardContent className="pt-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-fintech/10 flex items-center justify-center mx-auto mb-4">
                      <reg.icon className="h-6 w-6 text-fintech" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">{reg.name}</h3>
                    <p className="text-sm text-muted-foreground">{reg.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Ecosystem Preview */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <Card className="bg-fintech text-white border-0">
            <CardContent className="py-10 text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Cyprus FinTech Ecosystem</h2>
              <p className="text-white/80 mb-6 max-w-xl mx-auto">
                Explore fintech, RegTech, and financial services participants active in Cyprus.
              </p>
              <Link to="/directory">
                <Button variant="secondary" size="lg" className="gap-2">
                  View FinTech Directory
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 border-t border-border">
        <div className="container mx-auto px-4">
          <p className="text-sm text-muted-foreground text-center">
            Information provided is for educational purposes only and does not constitute legal or regulatory advice.
          </p>
        </div>
      </section>
    </HubLayout>
  );
}
