import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export function HeroBanner() {
  const [trendingTags, setTrendingTags] = useState<string[]>([]);

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Fetch trending tags from recent articles
  useEffect(() => {
    supabase
      .from("cna_articles")
      .select("tags")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) {
          const tagCounts: Record<string, number> = {};
          data.forEach((a) => {
            (a.tags || []).forEach((t: string) => {
              tagCounts[t] = (tagCounts[t] || 0) + 1;
            });
          });
          const sorted = Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([tag]) => tag);
          setTrendingTags(sorted);
        }
      });
  }, []);

  return (
    <section className="border-b border-border bg-card">
      <div className="container mx-auto px-4">
        {/* Trending Topics Bar — FC "Latest Topics" */}
        {(
          <div className="py-2 flex items-center gap-3 overflow-x-auto scrollbar-hide">
            <h1 className="sr-only">BusinessHub.cy — Cyprus business intelligence</h1>
            <span className="text-secondary text-xs font-semibold uppercase tracking-wider whitespace-nowrap">
              Trending
            </span>
            <div className="flex items-center gap-2">
              {trendingTags.map((tag) => (
                <Link
                  key={tag}
                  to={`/search?q=${encodeURIComponent(tag)}`}
                  className="px-3 py-1 rounded-full border border-border text-xs font-medium text-foreground hover:border-secondary hover:text-secondary transition-colors whitespace-nowrap uppercase tracking-wide"
                >
                  {tag}
                </Link>
              ))}
            </div>
            <div className="ml-auto hidden md:flex items-center gap-3 text-xs text-muted-foreground whitespace-nowrap">
              <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" />{formattedDate}</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>Cyprus Edition</span>
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-semibold hover:bg-secondary/20 transition-colors"
              >
                <Crown className="h-3 w-3" />
                <span className="uppercase tracking-wider">Premium</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
