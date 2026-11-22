import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { blendNews } from "@/lib/blendNews";
import { pinHighlighted } from "@/lib/highlight";
import { cyprusHomeMix } from "@/lib/editionMix";

const COLUMNS = "id, title, summary, image_url, vertical, published_at, what_happened, body_markdown, why_it_matters, what_to_do, tags, source_id, source_url, featured_until, edition";
/** Stories in the Cyprus homepage pool. */
export const HOME_POOL_SIZE = 120;

/**
 * One ordered pool shared by the homepage's lead stories and continuation; editor highlights lead.
 * With `cyprusMix` the pool follows the Cyprus edition shares (`CYPRUS_HOME_MIX`), adding Greece-edition stories.
 */
export function useBlendedNews(verticals?: string[], opts?: { cyprusMix?: boolean }) {
  const mix = !!opts?.cyprusMix && !verticals?.length;
  return useQuery({
    queryKey: ["blended-homepage-news", verticals?.join(",") ?? "all", mix ? "mix" : "plain"],
    staleTime: 60_000,
    refetchInterval: 2 * 60_000,
    queryFn: async () => {
      let q = supabase.from("cna_articles").select(COLUMNS).eq("status", "published").contains("edition", ["cy"]);
      let h = supabase.from("cna_articles").select(COLUMNS).eq("status", "published").contains("edition", ["cy"]).gt("featured_until", new Date().toISOString());
      if (verticals?.length) { q = q.in("vertical", verticals as any); h = h.in("vertical", verticals as any); }
      const gr = mix
        ? supabase.from("cna_articles").select(COLUMNS).eq("status", "published").contains("edition", ["gr"]).not("published_at", "is", null).order("published_at", { ascending: false }).limit(60)
        : Promise.resolve({ data: [] as any[], error: null });
      const [{ data, error }, highlighted, greece] = await Promise.all([
        q.order("published_at", { ascending: false }).order("id", { ascending: true }).limit(mix ? 300 : HOME_POOL_SIZE),
        h.limit(10),
        gr,
      ]);
      if (error) throw error;
      const pool = mix ? cyprusHomeMix(data ?? [], greece.data ?? [], HOME_POOL_SIZE, blendNews) : blendNews(data ?? []);
      return pinHighlighted(pool, highlighted.data ?? []);
    },
  });
}
