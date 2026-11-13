import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBlendedNews } from "@/hooks/useBlendedNews";
import { partitionHomepage, type PackageLink } from "@/lib/homepageStories";

/** Approved company links for the stories in the pool, with each company's profile page. */
async function fetchPackageLinks(articleIds: string[]): Promise<PackageLink[]> {
  if (articleIds.length === 0) return [];
  const { data: links } = await supabase
    .from("news_entity_links")
    .select("article_id, entity_type, entity_id, entity_label")
    .eq("status", "approved")
    .in("entity_type", ["company", "directory_company"])
    .in("article_id", articleIds);
  if (!links?.length) return [];
  const dirIds = [...new Set(links.filter((l) => l.entity_type === "directory_company").map((l) => l.entity_id))];
  const coIds = [...new Set(links.filter((l) => l.entity_type === "company").map((l) => l.entity_id))];
  const [dirs, cos] = await Promise.all([
    dirIds.length ? supabase.from("directory_companies").select("id, slug").in("id", dirIds) : Promise.resolve({ data: [] as { id: string; slug: string | null }[] }),
    coIds.length ? supabase.from("companies").select("id, slug").in("id", coIds) : Promise.resolve({ data: [] as { id: string; slug: string | null }[] }),
  ]);
  const href = new Map<string, string>();
  for (const d of dirs.data ?? []) if (d.slug) href.set(d.id, `/directory/company/${d.slug}`);
  for (const c of cos.data ?? []) if (c.slug) href.set(c.id, `/companies/${c.slug}`);
  return links.map((l) => ({
    article_id: l.article_id,
    entity_id: l.entity_id,
    entity_label: l.entity_label ?? "",
    href: href.get(l.entity_id) ?? null,
  }));
}

/** The homepage's story blocks, shared by the lead section, the story package and the feed. */
export function useHomepageStories() {
  const news = useBlendedNews();
  const pool = news.data ?? [];
  const ids = pool.map((s) => s.id);
  const links = useQuery({
    queryKey: ["homepage-package-links", ids.join(",")],
    queryFn: () => fetchPackageLinks(ids),
    enabled: ids.length > 0,
    staleTime: 5 * 60_000,
  });
  const parts = useMemo(() => partitionHomepage(pool, links.data ?? []), [pool, links.data]);
  return { ...parts, isLoading: news.isLoading, linksSettled: links.isSuccess || links.isError };
}
