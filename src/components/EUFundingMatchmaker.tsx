import { Link } from "react-router-dom";
import { Euro, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EUFundingMatchmaker() {
  return (
    <section id="funding" className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg gold-gradient flex items-center justify-center">
            <Euro className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-primary">EU Funding & Grants</h2>
            <p className="text-muted-foreground text-sm">Explore EU funding tools and eligibility checkers</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto text-center bento-card-highlight py-10 px-6">
          <Euro className="h-12 w-12 mx-auto text-secondary mb-4" />
          <h3 className="text-xl font-semibold text-primary mb-2">EU Funding Eligibility Tools</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Use our SME toolkit to check your eligibility for Horizon Europe, Digital Europe, and other EU programmes available to Cyprus businesses.
          </p>
          <Link to="/sme">
            <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2">
              Open SME Toolkit
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
