import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { blendNews } from "@/lib/blendNews";

/** One ordered pool shared by the homepage's lead stories and continuation. */
export function useBlendedNews() {
  return useQuery({
    queryKey: ["blended-homepage-news"],
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("cna_articles")
        .select("id, title, summary, image_url, vertical, published_at, what_happened, body_markdown, why_it_matters, what_to_do, tags, source_id, source_url")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .order("id", { ascending: true })
        .limit(120);
      if (error) throw error;
      return blendNews(data ?? []);
    },
  });
}