import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Newspaper, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { format, formatDistanceToNow } from "date-fns";

export default function NewsListPage() {
  const [articles, setArticles] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("directory_articles").select("*").eq("is_published", true).in("article_type", ["news", "insight"]).order("published_at", { ascending: false })
      .then(({ data }) => { if (data) setArticles(data); });
  }, []);

  const featured = articles[0];
  const rest = articles.slice(1);

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
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        {/* Featured */}
        {featured && (
          <Link to={`/news/${featured.slug}`} className="group block mb-10">
            <div className="grid md:grid-cols-2 gap-6 border border-border rounded-xl overflow-hidden bg-card hover:shadow-xl transition-all">
              <div className="relative h-64 md:h-auto overflow-hidden">
                <img src={featured.cover_image || "/placeholder.svg"} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-8 flex flex-col justify-center">
                <Badge variant="outline" className="w-fit mb-3">{featured.article_type}</Badge>
                <h2 className="text-2xl font-serif font-bold text-foreground group-hover:text-secondary transition-colors leading-snug">{featured.title}</h2>
                <p className="text-muted-foreground mt-3">{featured.excerpt}</p>
                {featured.published_at && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4">
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(featured.published_at), "d MMM yyyy, HH:mm")}</span>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                    <span>{formatDistanceToNow(new Date(featured.published_at), { addSuffix: true })}</span>
                  </div>
                )}
              </div>
            </div>
          </Link>
        )}

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rest.map((a) => (
            <Link key={a.id} to={`/news/${a.slug}`} className="group border border-border rounded-lg overflow-hidden bg-card hover:shadow-lg transition-all">
              <div className="relative h-44 overflow-hidden">
                <img src={a.cover_image || "/placeholder.svg"} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <Badge className="absolute top-3 left-3 bg-foreground/80 text-background text-xs">{a.article_type}</Badge>
              </div>
              <div className="p-4">
                <h3 className="font-serif font-bold text-foreground group-hover:text-secondary transition-colors line-clamp-2">{a.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{a.excerpt}</p>
                {a.published_at && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(a.published_at), "d MMM yyyy")}</span>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                    <span>{formatDistanceToNow(new Date(a.published_at), { addSuffix: true })}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
