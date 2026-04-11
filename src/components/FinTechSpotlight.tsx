import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Landmark, ArrowRight } from "lucide-react";

export function FinTechSpotlight() {
  return (
    <section className="py-12 md:py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
            <Landmark className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">FinTech Spotlight</h2>
            <p className="text-sm text-muted-foreground">Digital finance intelligence for Cyprus</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto text-center bento-card p-8">
          <Landmark className="h-12 w-12 mx-auto text-secondary mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">FintechHub.cy</h3>
          <p className="text-muted-foreground mb-6">
            Explore MiCA, DORA, AML and NIS2 regulatory coverage, licensing news, and fintech intelligence on the dedicated hub.
          </p>
          <Link to="/fintech">
            <Button variant="secondary" className="gap-2">
              Explore FinTech Hub
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
