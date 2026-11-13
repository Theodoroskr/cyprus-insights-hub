import { articleImage, storyImage } from "@/lib/fallbackImage";
import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { estimateReadingTime } from "@/lib/readingTime";
import { useHomepageStories } from "@/hooks/useHomepageStories";
import { LeadStoriesView } from "@/components/hub/HubLeadStories";

interface MostReadItem {
  id: string;
  title: string;
  category: string;
  image?: string | null;
  view_count: number;
}

const verticalLabel = (v: string) => {
  const map: Record<string, string> = {
    compliance: "Compliance",
    fintech: "FinTech",
    sme: "SME",
    general: "Business",
    regtech: "RegTech",
  };
  return map[v] || v;
};

const fullDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";
const ago = (iso?: string | null) => (iso ? formatDistanceToNow(new Date(iso), { addSuffix: true }) : "");

/** Small uppercase topic label above a headline. */
function Kicker({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-sans font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-2">{children}</p>;
}

export function IntelligenceHub() {
  const { hub, latest } = useHomepageStories();
  const [mostRead, setMostRead] = useState<MostReadItem[]>([]);

  const featured = useMemo(() => hub.map((a: any) => ({
    id: a.id as string,
    title: (a.title || a.what_happened) as string,
    summary: (a.summary || a.what_happened || "") as string,
    image: storyImage(a.image_url, a.vertical, a.id, a.body_markdown),
    category: verticalLabel(a.vertical),
    publishedAt: a.published_at as string,
    readTime: estimateReadingTime(a.what_happened, a.why_it_matters, a.what_to_do, a.summary, a.body_markdown),
  })), [hub]);

  const [lead, ...secondary] = featured;

  useEffect(() => {
    supabase
      .rpc("get_most_read_articles", { _limit: 5 })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setMostRead(data.map((d: any) => ({
            id: d.article_id,
            title: d.title,
            category: verticalLabel(d.vertical),
            image: storyImage(d.image_url, d.vertical, d.article_id ?? d.id, d.body_markdown),
            view_count: Number(d.view_count),
          })));
        }
      });
  }, []);

  if (!lead && mostRead.length === 0) {
    return <p className="text-muted-foreground text-sm py-8 text-center">Loading intelligence briefings…</p>;
  }

  return (
    <section id="news" className="section-rule section-rule-thick">
      <div className="container mx-auto px-4">
        <LeadStoriesView hub={hub} latest={latest} aside={
          mostRead.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center gap-2 pb-2 border-b border-border mb-1">
                  <Flame className="h-4 w-4 text-destructive" />
                  <span className="section-label">Most Read</span>
                </div>
                {mostRead.map((article, index) => (
                  <Link
                    to={`/article/${article.id}`}
                    key={article.id}
                    className="group flex items-start gap-3 py-3 border-b border-border last:border-b-0"
                  >
                    <span className="text-xl font-serif font-black text-muted-foreground/30 leading-none min-w-[1.25rem] text-right pt-0.5 group-hover:text-secondary transition-colors">
                      {index + 1}
                    </span>
                    <h3 className="flex-1 min-w-0 font-serif text-[13px] font-bold text-foreground leading-snug group-hover:text-secondary transition-colors line-clamp-3">
                      {article.title}
                    </h3>
                    <div className="w-14 h-14 flex-shrink-0 overflow-hidden">
                      <img src={articleImage(article.image, null, String(article.id))} alt="" className="w-full h-full object-cover" />
                    </div>
                  </Link>
                ))}
              </div>
            )
        } />
      </div>
    </section>
  );
}
