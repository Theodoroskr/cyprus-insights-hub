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
        {/* Thin accent line */}
        <div className="h-[3px] bg-foreground" />

        {/* Compact masthead — FC style */}
        <div className="py-4 flex flex-col md:flex-row items-center justify-between gap-3 border-b border-border">
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground font-serif tracking-tight">
              BusinessHub<span className="text-secondary">.cy</span>
            </h1>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
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

        {/* Trending Topics Bar — FC "Latest Topics" */}
        {trendingTags.length > 0 && (
          <div className="py-2.5 flex items-center gap-3 overflow-x-auto scrollbar-hide">
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
            <div className="ml-auto hidden md:flex items-center gap-2">
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
