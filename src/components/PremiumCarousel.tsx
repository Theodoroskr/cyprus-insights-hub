import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Lock, ChevronLeft, ChevronRight, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface PremiumArticle {
  id: string;
  title: string;
  summary: string;
  image: string;
  category: string;
}

export function PremiumCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [articles, setArticles] = useState<PremiumArticle[]>([]);

  useEffect(() => {
    // Show latest published articles as "premium teasers"
    supabase
      .from("cna_articles")
      .select("id, title, summary, image_url, vertical")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .range(6, 11)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const verticalLabel = (v: string) => {
            const map: Record<string, string> = { compliance: "Compliance", fintech: "FinTech", sme: "SME", general: "Business" };
            return map[v] || v;
          };
          setArticles(
            data.map((a) => ({
              id: a.id,
              title: a.title,
              summary: a.summary || "",
              image: a.image_url || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80",
              category: verticalLabel(a.vertical),
            }))
          );
        }
      });
  }, []);

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

  if (articles.length === 0) return null;

  return (
    <section className="py-10 bg-gradient-to-r from-primary via-[hsl(213,80%,12%)] to-primary relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.04]">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-secondary to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-secondary to-transparent" />
      </div>

      <div className="container mx-auto px-4">
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

        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-5 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {articles.map((article) => (
            <Link
              to={`/article/${article.id}`}
              key={article.id}
              className="group relative flex-shrink-0 w-[300px] rounded-xl overflow-hidden cursor-pointer snap-start"
            >
              <div className="relative h-[200px] overflow-hidden">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/60 to-transparent" />

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

                <div className="absolute top-3 left-3">
                  <Badge className="bg-secondary/90 text-primary text-[10px] font-bold tracking-wide border-0">
                    {article.category}
                  </Badge>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-b from-[hsl(213,60%,10%)] to-[hsl(213,80%,8%)] border-t border-secondary/10">
                <h3 className="font-serif font-bold text-sm text-primary-foreground leading-snug line-clamp-2 mb-2 group-hover:text-secondary transition-colors duration-300">
                  {article.title}
                </h3>
                <p className="text-xs text-primary-foreground/50 line-clamp-2 leading-relaxed">
                  {article.summary}
                </p>
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-secondary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
