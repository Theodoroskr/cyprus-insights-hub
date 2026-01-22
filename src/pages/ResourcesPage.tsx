import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Shield, Globe, Euro, Building } from "lucide-react";

const resourceCategories = [
  {
    title: "Regulatory Frameworks",
    description: "Overview of EU and Cyprus regulatory requirements",
    icon: FileText,
  },
  {
    title: "Licensing & Compliance",
    description: "Guides to obtaining and maintaining licenses",
    icon: Shield,
  },
  {
    title: "Market Entry Guides",
    description: "Strategic pathways into Cyprus and EU markets",
    icon: Globe,
  },
  {
    title: "EU Funding Basics",
    description: "Introduction to EU funding opportunities",
    icon: Euro,
  },
  {
    title: "Governance & Substance",
    description: "Corporate governance and substance requirements",
    icon: Building,
  },
];

export default function ResourcesPage() {
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
            Resource Hub
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            Practical guides and regulatory explainers for operating in Cyprus and the EU.
          </p>
        </div>
      </section>

      {/* Resource Categories */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground mb-8">Resource Categories</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {resourceCategories.map((category, index) => (
              <Card 
                key={index} 
                className="hover:shadow-lg transition-all hover:border-secondary/50 cursor-pointer"
              >
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                    <category.icon className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-foreground">{category.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{category.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 border-t border-border">
        <div className="container mx-auto px-4">
          <p className="text-sm text-muted-foreground text-center">
            Content is informational only and does not replace professional advisory services.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
