import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { HubLayout } from "@/layouts/HubLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Shield, Scale, Server, ArrowRight, TrendingUp, Building2, Users, Landmark, Calendar } from "lucide-react";
import { InsightBanner } from "@/components/banners/InsightBanner";
import { PremiumCTABanner } from "@/components/banners/PremiumCTABanner";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

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
    author: "Editorial Desk",
    time: "6 hours ago",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80",
  },
  {
    title: "EU Regulation Snapshot for FinTechs",
    excerpt: "What MiCA, AML, and DORA mean in practice for fintechs operating from Cyprus.",
    tag: "Regulation",
    author: "Andreas Georgiou",
    time: "1 day ago",
    image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&q=80",
  },
  {
    title: "Digital Assets Licensing in Cyprus",
    excerpt: "Complete guide to obtaining CASP registration and operating under MiCA framework.",
    tag: "Licensing",
    author: "Maria Ioannou",
    time: "2 days ago",
    image: "https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=600&q=80",
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

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <HubLayout brand="fintechhub" onSearch={handleSearch}>
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

      {/* Featured FinTech Intelligence — newspaper grid */}
      <section className="section-rule">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-label text-foreground text-sm">Featured Intelligence</h2>
            <span className="section-label text-secondary">Latest from Cyprus FinTech</span>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {featuredCards.map((card, index) => (
              <Link to={`/news?vertical=fintech`} key={index} className="group block border border-border rounded-lg overflow-hidden hover:border-secondary/40 transition-colors">
                <div className="relative h-44 overflow-hidden">
                  <img src={card.image} alt={card.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent" />
                  <span className="absolute top-3 left-3 section-label text-white drop-shadow bg-primary/40 backdrop-blur-sm px-2 py-0.5">{card.tag}</span>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-serif font-bold text-foreground mb-2 group-hover:text-secondary transition-colors leading-tight">
                    {card.title}
                  </h3>
                  <p className="article-body text-muted-foreground mb-3">{card.excerpt}</p>
                  <p className="byline">By {card.author} · {card.time}</p>
                </div>
              </Link>
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

      {/* Regulation Snapshot — editorial cards */}
      <section id="regulations" className="section-rule bg-muted/30">
        <div className="container mx-auto px-4 pb-8">
          <h2 className="section-label text-foreground text-sm mb-6">Regulation Snapshot</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {regulations.map((reg, index) => (
              <Link to="/resources" key={index}>
                <Card className="hover:shadow-lg transition-all hover:border-secondary/50 cursor-pointer h-full rounded-none border-border">
                  <CardContent className="pt-6 text-center">
                    <div className="w-12 h-12 rounded-none bg-foreground/5 flex items-center justify-center mx-auto mb-4">
                      <reg.icon className="h-6 w-6 text-foreground" />
                    </div>
                    <h3 className="font-serif font-semibold text-foreground mb-1">{reg.name}</h3>
                    <p className="text-sm text-muted-foreground">{reg.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
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
