import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Clock, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";




interface MostReadItem {
  id: string;
  title: string;
  category: string;
  image?: string | null;
  view_count: number;
}

// Generate a simple anonymous viewer hash (session-based)
function getViewerHash(): string {
  let hash = sessionStorage.getItem("bh_viewer");
  if (!hash) {
    hash = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem("bh_viewer", hash);
  }
  return hash;
}

export function IntelligenceHub() {
  const [dbArticles, setDbArticles] = useState<any[]>([]);
  const [mostRead, setMostRead] = useState<MostReadItem[]>([]);
  const [viewsLoaded, setViewsLoaded] = useState(false);

  // Fetch latest published articles from DB (skip the first one used by HeroBanner)
  useEffect(() => {
    supabase
      .from("cna_articles")
      .select("id, title, summary, image_url, vertical, published_at, what_happened")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .range(1, 5) // skip index 0 (hero lead), get next 5
      .then(({ data }) => {
        if (data && data.length > 0) {
          setDbArticles(data);
        }
      });
  }, []);

  const verticalLabel = (v: string) => {
    const map: Record<string, string> = {
      compliance: "Compliance",
      fintech: "FinTech",
      sme: "SME",
      general: "Business",
    };
    return map[v] || v;
  };

  // Map DB articles to display format, fall back to static data
  const featuredArticles = useMemo(() => {
    return dbArticles.map((a) => ({
      id: a.id,
      title: a.what_happened || a.title,
      summary: a.summary || "",
      image: a.image_url || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
      category: verticalLabel(a.vertical),
      date: a.published_at
        ? formatDistanceToNow(new Date(a.published_at), { addSuffix: true })
        : "",
      author: "Editorial",
    }));
  }, [dbArticles]);

  const [lead, ...secondary] = featuredArticles;

  // Fetch most-read articles from DB
  useEffect(() => {
    supabase
      .rpc("get_most_read_articles", { _limit: 5 })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setMostRead(
            data.map((d: any) => ({
              id: d.article_id,
              title: d.title,
              category: verticalLabel(d.vertical),
              image: d.image_url,
              view_count: Number(d.view_count),
            }))
          );
        }
        setViewsLoaded(true);
      });
  }, []);

  // Record a view for published articles shown on this page
  useEffect(() => {
    if (featuredArticles.length === 0) return;
    const viewerHash = getViewerHash();
    featuredArticles.forEach((article) => {
      if (article.id.length > 10) {
        supabase
          .from("article_views")
          .insert({ article_id: article.id, viewer_hash: viewerHash })
          .then(() => {});
      }
    });
  }, [featuredArticles]);

  const displayMostRead = mostRead;

  if (!lead && displayMostRead.length === 0) return null;

  return (
    <section id="news" className="section-rule section-rule-thick">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="flex items-center gap-3 mb-6">
          <span className="section-label">Intelligence Hub</span>
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">Latest from Cyprus</span>
        </div>

        {/* Fast Company-style 3-column layout */}
        {lead ? (
        <div className="grid lg:grid-cols-12 gap-0">

          {/* COLUMN 1: Lead Story (wide) */}
          <div className="lg:col-span-5 lg:pr-6 lg:border-r border-border pb-6 lg:pb-0">
            <article className="group cursor-pointer">
              <div className="relative overflow-hidden mb-4">
                <img
                  src={lead.image}
                  alt={lead.title}
                  className="w-full h-64 md:h-80 object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
                <Badge className="absolute top-3 left-3 bg-foreground text-background rounded-none text-[10px] uppercase tracking-wider font-sans">
                  {lead.category}
                </Badge>
              </div>
              <h3 className="text-2xl md:text-3xl font-serif font-bold text-foreground leading-tight mb-3 group-hover:text-secondary transition-colors">
                {lead.title}
              </h3>
              <p className="article-body text-base mb-3">
                {lead.summary}
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="byline">By {lead.author}</span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {lead.date}
                </span>
              </div>
            </article>
          </div>

          {/* COLUMN 2: Secondary Stories (middle) */}
          <div className="lg:col-span-4 lg:px-6 lg:border-r border-border py-6 lg:py-0 border-t lg:border-t-0">
            <div className="divide-y divide-border">
              {secondary.map((article) => (
                <article key={article.id} className="py-4 first:pt-0 group cursor-pointer">
                  <Badge variant="outline" className="rounded-none text-[10px] uppercase tracking-wider font-sans mb-2 border-muted-foreground/30">
                    {article.category}
                  </Badge>
                  <h4 className="font-serif text-lg font-bold text-foreground leading-snug mb-2 group-hover:text-secondary transition-colors">
                    {article.title}
                  </h4>
                  <p className="article-body text-sm line-clamp-2 mb-2">
                    {article.summary}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="byline">By {article.author}</span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span>{article.date}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* COLUMN 3: Most Read — numbered sidebar */}
          <div className="lg:col-span-3 lg:pl-6 pt-6 lg:pt-0 border-t lg:border-t-0">
            <div className="flex items-center gap-2 mb-5">
              <Flame className="h-4 w-4 text-destructive" />
              <span className="section-label">Most Read</span>
            </div>
            <div className="space-y-0">
              {displayMostRead.map((article, index) => (
                <article
                  key={article.id}
                  className="group cursor-pointer flex items-start gap-3 py-3.5 border-b border-border last:border-b-0 transition-all duration-200 hover:bg-muted/40 -mx-2 px-2 rounded-sm"
                >
                  <span className="text-3xl font-serif font-black text-muted-foreground/20 leading-none select-none min-w-[2rem] text-right transition-all duration-300 group-hover:text-secondary group-hover:scale-110 origin-right">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <Badge variant="outline" className="rounded-none text-[9px] uppercase tracking-wider font-sans mb-1.5 border-muted-foreground/20 px-1.5 py-0">
                      {article.category}
                    </Badge>
                    <h5 className="font-serif text-sm font-bold text-foreground leading-snug group-hover:text-secondary transition-colors duration-200 line-clamp-2">
                      {article.title}
                    </h5>
                    {article.view_count > 0 && (
                      <span className="text-[11px] text-muted-foreground mt-1 inline-block">{article.view_count.toLocaleString()} views</span>
                    )}
                  </div>
                  {article.image && (
                    <div className="relative w-14 h-14 flex-shrink-0 overflow-hidden rounded-sm">
                      <img
                        src={article.image}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-foreground/5 group-hover:bg-transparent transition-colors duration-300" />
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>
        </div>
        ) : (
          <p className="text-muted-foreground text-sm py-8 text-center">Loading intelligence briefings…</p>
        )}
      </div>
    </section>
  );
}
