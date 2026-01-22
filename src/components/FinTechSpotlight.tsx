import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Landmark, FileText, Shield, Server, Scale, ArrowRight } from "lucide-react";

const featuredArticle = {
  title: "Cyprus as an EU FinTech Gateway",
  excerpt: "Why Cyprus is emerging as a compliance-first entry point for EU fintech operations.",
  tag: "FinTech Intelligence",
};

const regulations = [
  { name: "MiCA", icon: FileText, description: "Crypto-Assets" },
  { name: "DORA", icon: Server, description: "Resilience" },
  { name: "AML", icon: Shield, description: "Anti-Money Laundering" },
  { name: "NIS2", icon: Scale, description: "Cybersecurity" },
];

export function FinTechSpotlight() {
  return (
    <section className="py-12 md:py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
            <Landmark className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">FinTech Spotlight</h2>
            <p className="text-sm text-muted-foreground">Digital finance intelligence for Cyprus</p>
          </div>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {/* Featured Article - 2 columns */}
          <Link to="/fintech" className="md:col-span-2 group">
            <div className="bento-card h-full p-6 hover:shadow-lg transition-all">
              <Badge variant="secondary" className="mb-4 bg-secondary/10 text-secondary">
                {featuredArticle.tag}
              </Badge>
              <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-secondary transition-colors">
                {featuredArticle.title}
              </h3>
              <p className="text-muted-foreground">{featuredArticle.excerpt}</p>
            </div>
          </Link>

          {/* Regulation Quick Links - 1 column */}
          <div className="bento-card p-4">
            <p className="text-sm font-medium text-muted-foreground mb-3">EU Regulations</p>
            <div className="grid grid-cols-2 gap-3">
              {regulations.map((reg, index) => (
                <Link
                  key={index}
                  to="/resources"
                  className="flex flex-col items-center p-3 rounded-lg bg-background hover:bg-secondary/5 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center mb-2 group-hover:bg-secondary/20 transition-colors">
                    <reg.icon className="h-4 w-4 text-secondary" />
                  </div>
                  <span className="text-xs font-medium text-foreground">{reg.name}</span>
                  <span className="text-[10px] text-muted-foreground">{reg.description}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Row */}
        <Link to="/fintech" className="block">
          <Button variant="secondary" className="w-full gap-2">
            Explore FinTech Hub
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
