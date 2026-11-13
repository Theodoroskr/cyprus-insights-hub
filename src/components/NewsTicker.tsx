import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Scrolling strip of the latest published headlines. */
export function NewsTicker() {
  const { data } = useQuery({
    queryKey: ["news-ticker"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cna_articles")
        .select("id, title").eq("status", "published")
        .order("published_at", { ascending: false }).limit(12);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 60 * 1000,
  });
  const items = data ?? [];
  if (items.length === 0) return null;
  return (
    <div className="bg-card border-b border-border flex items-center text-xs">
      <span className="shrink-0 bg-secondary text-secondary-foreground font-semibold uppercase tracking-wider px-3 py-2 z-10">Latest news</span>
      <div className="ticker-container py-2 flex-1 group">
        <div className="ticker-content [animation-duration:90s] group-hover:[animation-play-state:paused]">
          {[...items, ...items].map((a, i) => (
            <Link key={`${a.id}-${i}`} to={`/article/${a.id}`} className="inline-block px-6 text-foreground hover:text-secondary">
              <span className="text-secondary mr-2">•</span>{a.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
