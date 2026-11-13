import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Newspaper, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { format, formatDistanceToNow } from "date-fns";
import { blendNews } from "@/lib/blendNews";
import { storyImage } from "@/lib/fallbackImage";

const PAGE = 24;
const HUBS = [
  { key: "all", label: "All" },
  { key: "business", label: "Business", verticals: ["general", "sme"] },
  { key: "fintech", label: "FinTech", verticals: ["fintech"] },
  { key: "compliance", label: "Compliance", verticals: ["compliance"] },
  { key: "regtech", label: "RegTech", verticals: ["regtech"] },
  { key: "tourism", label: "Tourism", verticals: ["tourism"] },
] as const;
const LABEL: Record<string, string> = { general: "Business", sme: "Business", fintech: "FinTech", compliance: "Compliance", regtech: "RegTech", tourism: "Tourism" };

interface Item { id: string; title: string; excerpt: string | null; image: string; href: string; date: string | null; label: string; vertical: string | null }

export default function NewsListPage() {
  const [hub, setHub] = useState<string>(() => new URLSearchParams(window.location.search).get("hub") || "all");
  const [news, setNews] = useState<any[]>([]);
  const [own, setOwn] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [more, setMore] = useState(true);

  useEffect(() => {
    supabase.from("directory_articles").select("id, title, slug, excerpt, cover_image, article_type, published_at").eq("is_published", true).in("article_type", ["news", "insight"])
      .then(({ data }) => setOwn(data || []));
  }, []);

  useEffect(() => { setNews([]); setPage(1); setMore(true); }, [hub]);

  useEffect(() => {
    let q = supabase.from("cna_articles").select("id, title, summary, image_url, vertical, published_at, body_markdown, source_id, source_url")
      .eq("status", "published").order("published_at", { ascending: false }).range((page - 1) * PAGE, page * PAGE - 1);
    const h = HUBS.find((x) => x.key === hub) as any;
    if (h?.verticals) q = q.in("vertical", h.verticals);
    q.then(({ data }) => {
      const rows = data || [];
      setNews((prev) => (page === 1 ? rows : [...prev, ...rows]));
      setMore(rows.length === PAGE);
    });
  }, [hub, page]);

  const items: Item[] = useMemo(() => {
    const a: Item[] = blendNews(news as any[]).map((n: any) => ({
      id: n.id, title: n.title, excerpt: n.summary, href: `/article/${n.id}`, date: n.published_at,
      image: storyImage(n.image_url, n.vertical, n.id, n.body_markdown), label: LABEL[n.vertical] || "News", vertical: n.vertical,
    }));
    if (hub !== "all") return a;
    const oldest = news.length && more ? news[news.length - 1].published_at : null;
    const b: Item[] = own
      .filter((d) => !oldest || (d.published_at && d.published_at >= oldest))
      .map((d) => ({ id: d.id, title: d.title, excerpt: d.excerpt, href: `/news/${d.slug}`, date: d.published_at,
        image: storyImage(d.cover_image, "general", d.id), label: d.article_type === "insight" ? "Insight" : "News", vertical: "general" }));
    // Keep the blended order for news; slot our own articles in by date
    const out = [...a];
    for (const d of b) {
      const i = out.findIndex((x) => (x.date || "") < (d.date || ""));
      out.splice(i === -1 ? out.length : i, 0, d);
    }
    return out;
  }, [news, own, hub, more]);

  const featured = items[0];
  const rest = items.slice(1);

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation onSearch={() => {}} />

      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-10">
          <div className="flex items-center gap-3">
            <Newspaper className="h-6 w-6 text-secondary" />
            <h1 className="text-3xl font-serif font-bold text-foreground">News & Insights</h1>
          </div>
          <p className="text-muted-foreground mt-2">Latest business news, analysis, and market intelligence from Cyprus</p>
          <div className="flex flex-wrap gap-2 mt-6">
            {HUBS.map((h) => (
              <Button key={h.key} size="sm" variant={hub === h.key ? "default" : "outline"} onClick={() => setHub(h.key)}>{h.label}</Button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        {featured && (
          <Link to={featured.href} className="group block mb-10">
            <div className="grid md:grid-cols-2 gap-6 border border-border rounded-xl overflow-hidden bg-card hover:shadow-xl transition-all">
              <div className="relative aspect-[16/9] overflow-hidden">
                <img src={featured.image} alt={featured.title} data-vertical={featured.vertical ?? undefined} data-seed={featured.id} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-8 flex flex-col justify-center">
                <Badge variant="outline" className="w-fit mb-3">{featured.label}</Badge>
                <h2 className="text-2xl font-serif font-bold text-foreground group-hover:text-secondary transition-colors leading-snug line-clamp-3">{featured.title}</h2>
                {featured.excerpt && <p className="text-muted-foreground mt-3 line-clamp-3">{featured.excerpt}</p>}
                {featured.date && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4">
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(featured.date), "d MMM yyyy, HH:mm")}</span>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                    <span>{formatDistanceToNow(new Date(featured.date), { addSuffix: true })}</span>
                  </div>
                )}
              </div>
            </div>
          </Link>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rest.map((a) => (
            <Link key={a.id} to={a.href} className="group border border-border rounded-lg overflow-hidden bg-card hover:shadow-lg transition-all">
              <div className="relative aspect-[16/9] overflow-hidden">
                <img src={a.image} alt={a.title} loading="lazy" data-vertical={a.vertical ?? undefined} data-seed={a.id} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <Badge className="absolute top-3 left-3 bg-foreground/80 text-background text-xs">{a.label}</Badge>
              </div>
              <div className="p-4">
                <h3 className="font-serif font-bold text-foreground group-hover:text-secondary transition-colors line-clamp-2">{a.title}</h3>
                {a.excerpt && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{a.excerpt}</p>}
                {a.date && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(a.date), "d MMM yyyy")}</span>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                    <span>{formatDistanceToNow(new Date(a.date), { addSuffix: true })}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>

        {more && news.length > 0 && (
          <div className="flex justify-center mt-10">
            <Button variant="outline" onClick={() => setPage((p) => p + 1)}>Load more</Button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
