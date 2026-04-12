import { useState, useEffect } from "react";
import { SEOHead } from "@/components/SEOHead";
import { Link, useNavigate } from "react-router-dom";
import { HubLayout } from "@/layouts/HubLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Shield, Scale, Server, ArrowRight, TrendingUp, Building2, Users, Landmark, Calendar, Globe, Lock, Cpu, Gavel, ChevronRight, type LucideIcon } from "lucide-react";
import { InsightBanner } from "@/components/banners/InsightBanner";
import { PremiumCTABanner } from "@/components/banners/PremiumCTABanner";
import { SectionSponsorStrip } from "@/components/SectionSponsorStrip";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

const stats = [
  { label: "Licensed EMIs", value: "45+", icon: Building2 },
  { label: "CySEC Regulated", value: "120+", icon: Shield },
  { label: "FinTech Startups", value: "80+", icon: TrendingUp },
  { label: "Industry Jobs", value: "5,000+", icon: Users },
];

const iconMap: Record<string, LucideIcon> = {
  FileText, Shield, Scale, Server, Globe, Lock, Cpu, Gavel, Landmark, Building2, TrendingUp,
};

const statusColorMap: Record<string, string> = {
  emerald: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30",
  amber: "text-amber-600 bg-amber-100 dark:bg-amber-900/30",
  red: "text-red-600 bg-red-100 dark:bg-red-900/30",
  blue: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
};

interface Regulation {
  id: string;
  name: string;
  icon: string;
  description: string;
  status: string;
  status_color: string;
  effective_date: string;
  impact: string;
  applies_to: string[];
  key_body: string;
}
export default function FinTechPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [featuredArticles, setFeaturedArticles] = useState<any[]>([]);
  const [regulations, setRegulations] = useState<Regulation[]>([]);

  useEffect(() => {
    supabase
      .from("cna_articles")
      .select("id, title, summary, image_url, tags, published_at")
      .eq("status", "published")
      .eq("vertical", "fintech")
      .order("published_at", { ascending: false })
      .limit(3)
      .then(({ data }) => {
        if (data) setFeaturedArticles(data);
      });

    supabase
      .from("regulations")
      .select("*")
      .eq("active", true)
      .eq("hub_section", "fintech")
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (data) setRegulations(data as Regulation[]);
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
    <HubLayout brand="fintechhub" onSearch={handleSearch}>
      <SEOHead title="FinTech Hub" description="MiCA, DORA, AML & digital finance regulatory intelligence for Cyprus fintech." path="/fintech" />
      {/* Editorial Masthead Hero */}
      <section className="relative border-b border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="h-[3px] bg-foreground" />

          <div className="py-6 text-center border-b border-border">
            <p className="section-label mb-2 text-secondary">Digital Finance Intelligence for Cyprus</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground font-serif tracking-tight">
              FinTechHub<span className="text-secondary">.cy</span>
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

          {/* Quick Stats — editorial row */}
          <div className="py-6 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto border-b border-border">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <stat.icon className="h-4 w-4 text-secondary mx-auto mb-1.5" />
                <p className="text-2xl font-bold text-foreground font-serif">{stat.value}</p>
                <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SectionSponsorStrip sectionKey="fintechhub" />

      {/* Featured FinTech Intelligence — newspaper grid */}
      <section className="section-rule">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-label text-foreground text-sm">Featured Intelligence</h2>
            <span className="section-label text-secondary">Latest from Cyprus FinTech</span>
          </div>
          {featuredArticles.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {featuredArticles.map((article) => (
                <Link to={`/article/${article.id}`} key={article.id} className="group block border border-border rounded-lg overflow-hidden hover:border-secondary/40 transition-colors">
                  <div className="relative h-44 overflow-hidden">
                    <img src={article.image_url || "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80"} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent" />
                    <span className="absolute top-3 left-3 section-label text-white drop-shadow bg-primary/40 backdrop-blur-sm px-2 py-0.5">FinTech</span>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-serif font-bold text-foreground mb-2 group-hover:text-secondary transition-colors leading-tight">
                      {article.title}
                    </h3>
                    <p className="article-body text-muted-foreground mb-3 line-clamp-2">{article.summary}</p>
                    <p className="byline">{article.published_at ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true }) : ""}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No fintech articles published yet.</p>
          )}
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

      {/* Regulation Snapshot — enhanced editorial cards */}
      <section id="regulations" className="section-rule bg-muted/30">
        <div className="container mx-auto px-4 pb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="section-label text-foreground text-sm">Regulation Snapshot</h2>
              <p className="text-xs text-muted-foreground mt-1">Key EU frameworks shaping Cyprus FinTech</p>
            </div>
            <Badge variant="outline" className="text-[9px] uppercase tracking-widest text-muted-foreground">
              <Calendar className="h-3 w-3 mr-1" /> Updated Q2 2026
            </Badge>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {regulations.map((reg) => {
              const IconComponent = iconMap[reg.icon] || FileText;
              const colorClass = statusColorMap[reg.status_color] || statusColorMap.emerald;
              return (
                <Card key={reg.id} className="hover:shadow-lg transition-all hover:border-secondary/50 cursor-pointer rounded-none border-border group">
                  <CardContent className="pt-5 pb-4 px-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-none bg-foreground/5 flex items-center justify-center shrink-0">
                          <IconComponent className="h-5 w-5 text-foreground" />
                        </div>
                        <div>
                          <h3 className="font-serif font-bold text-foreground text-base">{reg.name}</h3>
                          <p className="text-xs text-muted-foreground">{reg.description}</p>
                        </div>
                      </div>
                      <Badge className={`text-[9px] border-0 shrink-0 ${colorClass}`}>
                        {reg.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                      {reg.impact}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {reg.applies_to.map((entity) => (
                        <span key={entity} className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground">
                          {entity}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground/70 border-t border-border pt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Effective: {reg.effective_date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Landmark className="h-3 w-3" />
                        {reg.key_body}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Ecosystem Preview — editorial CTA */}
      <section className="section-rule">
        <div className="container mx-auto px-4 pb-8">
          <div className="navy-gradient text-primary-foreground py-10 px-8 text-center">
            <h2 className="text-2xl md:text-3xl font-serif font-bold mb-4">Cyprus FinTech Ecosystem</h2>
            <p className="text-primary-foreground/70 mb-6 max-w-xl mx-auto article-body text-base">
              Explore fintech, RegTech, and financial services participants active in Cyprus.
            </p>
            <Link to="/directory">
              <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2 rounded-none font-sans text-sm font-semibold tracking-wide uppercase">
                View FinTech Directory
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Premium CTA */}
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
