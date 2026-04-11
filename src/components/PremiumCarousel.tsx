import { useRef, useState } from "react";
import { Lock, ChevronLeft, ChevronRight, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PremiumArticle {
  id: string;
  title: string;
  summary: string;
  image: string;
  category: string;
  readTime: string;
}

const premiumArticles: PremiumArticle[] = [
  {
    id: "p1",
    title: "Cyprus Banking Sector: Q1 2026 Profitability Deep Dive",
    summary: "Exclusive analysis of NPL ratios, capital adequacy trends, and dividend forecasts across all major Cypriot banks.",
    image: "https://images.unsplash.com/photo-1560472355-536de3962603?w=600&q=80",
    category: "Banking & Finance",
    readTime: "12 min",
  },
  {
    id: "p2",
    title: "MiCA Implementation Tracker: What Cyprus CASPs Must Do by June",
    summary: "Step-by-step compliance roadmap for crypto-asset service providers transitioning under the new EU framework.",
    image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&q=80",
    category: "Compliance",
    readTime: "8 min",
  },
  {
    id: "p3",
    title: "EU Cohesion Funds 2026–2028: €450M Allocation Map for Cyprus",
    summary: "Detailed breakdown of available funding by sector, eligibility criteria, and application deadlines.",
    image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600&q=80",
    category: "EU Funding",
    readTime: "10 min",
  },
  {
    id: "p4",
    title: "Real Estate Intelligence: Limassol High-Rise Pipeline Report",
    summary: "Tracking 14 major developments, pre-sale pricing trends, and foreign buyer demand indicators.",
    image: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80",
    category: "Real Estate",
    readTime: "15 min",
  },
  {
    id: "p5",
    title: "Shipping & Maritime: Cyprus Flag State Performance Review",
    summary: "Port State Control rankings, fleet growth metrics, and regulatory outlook for Cyprus-flagged vessels.",
    image: "https://images.unsplash.com/photo-1494412574643-ff11b0a5eb95?w=600&q=80",
    category: "Shipping",
    readTime: "9 min",
  },
  {
    id: "p6",
    title: "Transfer Pricing Audits: Tax Department's 2026 Enforcement Strategy",
    summary: "Inside sources reveal increased scrutiny on intercompany transactions and new documentation requirements.",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=80",
    category: "Tax & Legal",
    readTime: "7 min",
  },
];

export function PremiumCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 340;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
    setTimeout(checkScroll, 350);
  };

  return (
    <section className="py-10 bg-gradient-to-r from-primary via-[hsl(213,80%,12%)] to-primary relative overflow-hidden">
      {/* Subtle gold accent lines */}
      <div className="absolute inset-0 opacity-[0.04]">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-secondary to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-secondary to-transparent" />
      </div>

      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/20 border border-secondary/30">
              <Crown className="h-4 w-4 text-secondary" />
              <span className="text-xs font-semibold tracking-widest uppercase text-secondary">
                Premium Members
              </span>
            </div>
            <h2 className="text-xl font-serif font-bold text-primary-foreground">
              Exclusive Intelligence
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className="p-2 rounded-full border border-secondary/30 text-secondary hover:bg-secondary/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className="p-2 rounded-full border border-secondary/30 text-secondary hover:bg-secondary/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-5 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {premiumArticles.map((article) => (
            <article
              key={article.id}
              className="group relative flex-shrink-0 w-[300px] rounded-xl overflow-hidden cursor-pointer snap-start"
            >
              {/* Image */}
              <div className="relative h-[200px] overflow-hidden">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/60 to-transparent" />

                {/* Lock overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-primary/40 backdrop-blur-[2px]">
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 rounded-full bg-secondary/20 border border-secondary/40">
                      <Lock className="h-5 w-5 text-secondary" />
                    </div>
                    <span className="text-xs font-semibold text-secondary tracking-wide">
                      Unlock with Premium
                    </span>
                  </div>
                </div>

                {/* Category badge */}
                <div className="absolute top-3 left-3">
                  <Badge className="bg-secondary/90 text-primary text-[10px] font-bold tracking-wide border-0">
                    {article.category}
                  </Badge>
                </div>

                {/* Read time */}
                <div className="absolute top-3 right-3">
                  <span className="text-[10px] text-primary-foreground/70 bg-primary/60 px-2 py-0.5 rounded-full backdrop-blur-sm">
                    {article.readTime}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 bg-gradient-to-b from-[hsl(213,60%,10%)] to-[hsl(213,80%,8%)] border-t border-secondary/10">
                <h3 className="font-serif font-bold text-sm text-primary-foreground leading-snug line-clamp-2 mb-2 group-hover:text-secondary transition-colors duration-300">
                  {article.title}
                </h3>
                <p className="text-xs text-primary-foreground/50 line-clamp-2 leading-relaxed">
                  {article.summary}
                </p>
              </div>

              {/* Gold bottom accent */}
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-secondary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
