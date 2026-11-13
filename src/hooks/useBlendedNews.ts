import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { blendNews } from "@/lib/blendNews";
import { isTourismStory, TOURISM_TITLE_ROOTS } from "@/lib/tourismNews";

/** One ordered pool shared by the homepage's lead stories and continuation. */
/** `topic: "tourism"` picks stories by headline instead of by vertical (TourismHub). */
export function useBlendedNews(verticals?: string[], topic?: "tourism") {
  return useQuery({
    queryKey: ["blended-homepage-news", verticals?.join(",") ?? "all", topic ?? ""],
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
    queryFn: async () => {
      let q = supabase.from("cna_articles")
        .select("id, title, summary, image_url, vertical, published_at, what_happened, body_markdown, why_it_matters, what_to_do, tags, source_id, source_url")
        .eq("status", "published");
      if (verticals?.length) q = q.in("vertical", verticals as any);
      if (topic === "tourism") q = q.or([...TOURISM_TITLE_ROOTS.map((r) => `title.ilike.%${r}%`), "tags.cs.{Tourism}", "tags.cs.{Hospitality}"].join(","));
      const { data, error } = await q
        .order("published_at", { ascending: false })
        .order("id", { ascending: true })
        .limit(120);
      if (error) throw error;
      const rows = topic === "tourism" ? (data ?? []).filter((a) => isTourismStory(a.title, a.tags)) : data ?? [];
      return blendNews(rows);
    },
  });
}