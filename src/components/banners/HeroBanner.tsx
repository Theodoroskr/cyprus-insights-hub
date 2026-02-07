import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BarChart3, ArrowRight } from "lucide-react";

export function HeroBanner() {
  return (
    <section className="relative py-16 md:py-20 overflow-hidden">
      <div className="absolute inset-0 navy-gradient" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-secondary" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4 text-balance">
            Business Intelligence for the Cyprus Market
          </h1>
          <p className="text-base md:text-lg text-primary-foreground/75 mb-8 max-w-2xl mx-auto leading-relaxed">
            Independent analysis, regulatory insight, and professional intelligence — helping businesses navigate the Cyprus and EU landscape with clarity.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="#news">
              <Button
                size="lg"
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2"
              >
                Explore Intelligence
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/directory">
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 gap-2"
              >
                Browse Directory
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
