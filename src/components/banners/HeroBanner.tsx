import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar } from "lucide-react";

export function HeroBanner() {
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <section className="relative border-b border-border bg-card">
      {/* Masthead */}
      <div className="container mx-auto px-4">
        {/* Top rule */}
        <div className="h-[3px] bg-foreground" />

        <div className="py-6 text-center border-b border-border">
          <p className="section-label mb-2 text-secondary">Cyprus Business Intelligence Platform</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground font-serif tracking-tight">
            BusinessHub<span className="text-secondary">.cy</span>
          </h1>
          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              {formattedDate}
            </span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span>Nicosia Edition</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span className="text-secondary font-medium">LIVE</span>
          </div>
        </div>

        {/* Lead headline */}
        <div className="py-8 md:py-10 max-w-4xl mx-auto text-center">
          <p className="section-label mb-4">Lead Story</p>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif text-foreground leading-tight mb-4">
            Independent Analysis, Regulatory Insight &amp; Professional Intelligence for the Cyprus Market
          </h2>
          <p className="article-body max-w-2xl mx-auto mb-6 text-base">
            Helping businesses navigate the Cyprus and EU landscape with clarity — from compliance and fintech to funding and risk intelligence.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/#news">
              <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 gap-2 rounded-none font-sans text-sm font-semibold tracking-wide uppercase">
                Read Intelligence
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/directory">
              <Button size="lg" variant="outline" className="gap-2 rounded-none border-foreground text-foreground hover:bg-foreground hover:text-background font-sans text-sm font-semibold tracking-wide uppercase">
                Who Is Who Directory
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
