import { Link } from "react-router-dom";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Shield, Scale, Server, ArrowRight } from "lucide-react";

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
];

const regulations = [
  { name: "MiCA", icon: FileText, description: "Markets in Crypto-Assets Regulation" },
  { name: "EU AML Package", icon: Shield, description: "Anti-Money Laundering Framework" },
  { name: "DORA", icon: Server, description: "Digital Operational Resilience Act" },
  { name: "NIS2", icon: Scale, description: "Network and Information Security" },
];

export default function FinTechPage() {
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
            FinTech Hub
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            Independent intelligence on FinTech, RegTech, and digital finance in Cyprus.
          </p>
        </div>
      </section>

      {/* Featured FinTech Intelligence */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground mb-8">Featured FinTech Intelligence</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {featuredCards.map((card, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow border-border">
                <CardHeader>
                  <Badge variant="secondary" className="w-fit mb-2 bg-secondary/10 text-secondary">
                    {card.tag}
                  </Badge>
                  <CardTitle className="text-xl text-foreground">{card.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{card.excerpt}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Regulation Snapshot */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground mb-8">Regulation Snapshot</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {regulations.map((reg, index) => (
              <Link to="/resources" key={index}>
                <Card className="hover:shadow-lg transition-all hover:border-secondary/50 cursor-pointer h-full">
                  <CardContent className="pt-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                      <reg.icon className="h-6 w-6 text-secondary" />
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
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="py-10 text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Cyprus FinTech Ecosystem</h2>
              <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">
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

      <Footer />
    </div>
  );
}
