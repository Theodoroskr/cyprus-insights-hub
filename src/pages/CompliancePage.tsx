import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { HubLayout } from "@/layouts/HubLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  FileSearch,
  Scale,
  Globe,
  Calendar
} from "lucide-react";
import { OperationaliseBanner } from "@/components/banners/OperationaliseBanner";
import { PremiumCTABanner } from "@/components/banners/PremiumCTABanner";
import { supabase } from "@/integrations/supabase/client";

const complianceAreas = [
  { 
    name: "AML/KYC", 
    icon: Shield, 
    description: "Anti-Money Laundering & Know Your Customer",
  },
  { 
    name: "GDPR", 
    icon: FileSearch, 
    description: "Data Protection & Privacy Compliance",
  },
  { 
    name: "MiFID II", 
    icon: Scale, 
    description: "Markets in Financial Instruments",
  },
  { 
    name: "FATCA/CRS", 
    icon: Globe, 
    description: "Tax Reporting & Exchange of Information",
  },
];

export default function CompliancePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [articles, setArticles] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("cna_articles")
      .select("id, title, summary, image_url, published_at, vertical")
      .eq("status", "published")
      .eq("vertical", "compliance")
      .order("published_at", { ascending: false })
      .limit(6)
      .then(({ data }) => {
        if (data) setArticles(data);
      });
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <HubLayout brand="compliancehub" onSearch={handleSearch}>
      {/* Editorial Masthead Hero */}
      <section className="relative border-b border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="h-[3px] bg-foreground" />

          <div className="py-6 text-center border-b border-border">
            <p className="section-label mb-2 text-secondary">Regulatory Intelligence & Risk Management</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground font-serif tracking-tight">
              ComplianceHub<span className="text-secondary">.cy</span>
            </h1>
            <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                {formattedDate}
              </span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>Cyprus Edition</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="text-secondary font-medium">LIVE</span>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Compliance Articles */}
      {articles.length > 0 && (
        <section id="alerts" className="section-rule">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="section-label text-foreground text-sm">Latest Compliance Intelligence</h2>
              <Badge variant="outline" className="gap-1 rounded-none text-[10px] uppercase tracking-wider">
                <Clock className="h-3 w-3" />
                Live Updates
              </Badge>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {articles.map((article) => (
                <Link to={`/article/${article.id}`} key={article.id}>
                  <article className="border border-border rounded-lg overflow-hidden group cursor-pointer hover:border-secondary/40 transition-colors">
                    {article.image_url && (
                      <div className="relative h-40 overflow-hidden">
                        <img src={article.image_url} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/50 to-transparent" />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="text-lg font-serif font-bold text-foreground mb-2 group-hover:text-secondary transition-colors">
                        {article.title}
                      </h3>
                      {article.summary && <p className="article-body text-muted-foreground mb-2 line-clamp-2">{article.summary}</p>}
                      {article.published_at && (
                        <p className="byline">{new Date(article.published_at).toLocaleDateString("en-GB")}</p>
                      )}
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Compliance Areas */}
      <section id="aml" className="section-rule bg-muted/30">
        <div className="container mx-auto px-4 pb-8">
          <h2 className="section-label text-foreground text-sm mb-6">Compliance Areas</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {complianceAreas.map((area, index) => (
              <Link to="/resources" key={index}>
                <Card className="hover:shadow-lg transition-all hover:border-secondary/50 cursor-pointer h-full rounded-none border-border">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-none bg-foreground/5 flex items-center justify-center mb-4">
                      <area.icon className="h-6 w-6 text-foreground" />
                    </div>
                    <h3 className="font-serif font-semibold text-foreground mb-1">{area.name}</h3>
                    <p className="text-sm text-muted-foreground">{area.description}</p>
                    <div className="flex items-center gap-1 mt-3">
                      <CheckCircle2 className="h-3 w-3 text-success" />
                      <span className="text-xs text-success">Active</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Operationalise Compliance Banner */}
      <div className="container mx-auto px-4 py-8">
        <OperationaliseBanner />
      </div>

      {/* CTA Section */}
      <section className="section-rule">
        <div className="container mx-auto px-4 pb-8">
          <div className="navy-gradient text-primary-foreground py-10 px-8 text-center">
            <h2 className="text-2xl md:text-3xl font-serif font-bold mb-4">Full Compliance Dashboard</h2>
            <p className="text-primary-foreground/70 mb-6 max-w-xl mx-auto article-body text-base">
              Access comprehensive compliance tools, document templates, and regulatory guidance.
            </p>
            <Link to="/resources">
              <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2 rounded-none font-sans text-sm font-semibold tracking-wide uppercase">
                Explore Resources
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <PremiumCTABanner />

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
