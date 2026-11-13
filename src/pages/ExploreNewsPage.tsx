import { useState } from "react";
import { Link } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { ExploreShell } from "@/components/explore/ExploreShell";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { AdSlot } from "@/components/banners/AdSlot";
import { HUB_MID_SLOTS } from "@/components/hub/HubMasthead";
import { storyImage } from "@/lib/fallbackImage";
import { EL } from "@/lib/explore";

const PAGE = 24;
const fullDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "");

/** TourismHub's own news section: every published story filed under Tourism, newest first. */
export default function ExploreNewsPage() {
  const q = useInfiniteQuery({
    queryKey: ["tourism-news"],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase.from("cna_articles")
        .select("id, title, summary, image_url, vertical, published_at, body_markdown")
        .eq("status", "published").eq("vertical", "tourism")
        .order("published_at", { ascending: false }).range(pageParam * PAGE, pageParam * PAGE + PAGE - 1);
      if (error) throw error;
      return data ?? [];
    },
    getNextPageParam: (last, all) => (last.length === PAGE ? all.length : undefined),
  });
  const rows = q.data?.pages.flat() ?? [];
  const [lead, ...rest] = rows;

  return (
    <ExploreShell title={(l) => EL(l, "Tourism & Hospitality News", "Ειδήσεις Τουρισμού & Φιλοξενίας")}>
      {(lang) => (
        <div className="container mx-auto px-4 py-8">
          <SEOHead title="Tourism & Hospitality News — Cyprus | TourismHub.cy" description="Cyprus tourism and hospitality news: arrivals, hotels, airlines, grants and policy, each story linked to its official source." path="/explore/news" />
          {lang === "el" && <p className="text-xs text-muted-foreground mb-4">Οι ειδήσεις δημοσιεύονται στα αγγλικά.</p>}
          {q.isLoading ? <p className="text-sm text-muted-foreground">…</p> : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">{EL(lang, "No tourism stories yet.", "Δεν υπάρχουν ακόμη ειδήσεις.")}</p>
          ) : (
            <>
              <Link to={`/article/${lead.id}`} className="group grid md:grid-cols-12 gap-6 bg-muted/50 p-4 md:p-6 mb-8">
                <div className="md:col-span-7 aspect-[16/10] overflow-hidden bg-muted">
                  <img src={storyImage(lead.image_url, lead.vertical, lead.id, lead.body_markdown)} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="md:col-span-5 flex flex-col justify-center">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-tourism mb-2">Tourism</p>
                  <h2 className="font-serif font-bold text-2xl md:text-3xl leading-tight group-hover:text-secondary transition-colors line-clamp-4">{lead.title}</h2>
                  {lead.summary && <p className="text-muted-foreground mt-3 line-clamp-3">{lead.summary}</p>}
                  <p className="text-xs text-muted-foreground mt-3">{fullDate(lead.published_at)}</p>
                </div>
              </Link>
              <div className="mb-8"><AdSlot size="leaderboard" slotId={HUB_MID_SLOTS.tourismhub} /></div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rest.map((a) => (
                  <Link key={a.id} to={`/article/${a.id}`} className="group block">
                    <div className="aspect-[16/10] overflow-hidden bg-muted mb-3">
                      <img src={storyImage(a.image_url, a.vertical, a.id, a.body_markdown)} alt="" loading="lazy" className="w-full h-full object-cover" />
                    </div>
                    <h3 className="font-serif text-lg font-semibold leading-snug line-clamp-3 group-hover:text-secondary transition-colors">{a.title}</h3>
                    <time dateTime={a.published_at ?? undefined} title={fullDate(a.published_at)} className="text-xs text-muted-foreground">
                      {a.published_at ? formatDistanceToNow(new Date(a.published_at), { addSuffix: true }) : ""}
                    </time>
                  </Link>
                ))}
              </div>
              {q.hasNextPage && (
                <div className="text-center mt-8">
                  <Button variant="outline" onClick={() => q.fetchNextPage()} disabled={q.isFetchingNextPage}>{EL(lang, "Load more", "Περισσότερα")}</Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </ExploreShell>
  );
}
