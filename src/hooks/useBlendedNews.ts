import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { blendNews } from "@/lib/blendNews";
import { pinHighlighted } from "@/lib/highlight";

const COLUMNS = "id, title, summary, image_url, vertical, published_at, what_happened, body_markdown, why_it_matters, what_to_do, tags, source_id, source_url, featured_until";

/** One ordered pool shared by the homepage's lead stories and continuation; editor highlights lead. */
export function useBlendedNews(verticals?: string[]) {
  return useQuery({
    queryKey: ["blended-homepage-news", verticals?.join(",") ?? "all"],
    staleTime: 60_000,
    refetchInterval: 2 * 60_000,
    queryFn: async () => {
      let q = supabase.from("cna_articles").select(COLUMNS).eq("status", "published");
      let h = supabase.from("cna_articles").select(COLUMNS).eq("status", "published").gt("featured_until", new Date().toISOString());
      if (verticals?.length) { q = q.in("vertical", verticals as any); h = h.in("vertical", verticals as any); }
      const [{ data, error }, highlighted] = await Promise.all([
        q.order("published_at", { ascending: false }).order("id", { ascending: true }).limit(120),
        h.limit(10),
      ]);
      if (error) throw error;
      return pinHighlighted(blendNews(data ?? []), highlighted.data ?? []);
    },
  });
}
