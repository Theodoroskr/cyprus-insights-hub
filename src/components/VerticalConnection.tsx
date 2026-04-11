import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Link2, ArrowRight, Newspaper, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface Connection {
  articleId: string;
  articleTitle: string;
  articleVertical: string;
  articleDate: string;
  personName: string;
  personTitle: string | null;
  personSlug: string;
  personPhoto: string | null;
  personIsWhoiswho: boolean;
}

export function VerticalConnection() {
  const [connections, setConnections] = useState<Connection[]>([]);

  useEffect(() => {
    // Fetch articles with linked people via article_people junction
    supabase
      .from("article_people")
      .select("article_id, person_id, people(name, title, slug, photo, is_whoiswho), directory_articles(id, title, article_type, published_at)")
      .limit(20)
      .then(({ data }) => {
        if (!data || data.length === 0) return;
        const mapped: Connection[] = [];
        for (const row of data as any[]) {
          if (row.directory_articles && row.people) {
            mapped.push({
              articleId: row.directory_articles.id,
              articleTitle: row.directory_articles.title,
              articleVertical: row.directory_articles.article_type || "news",
              articleDate: row.directory_articles.published_at
                ? new Date(row.directory_articles.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                : "",
              personName: row.people.name,
              personTitle: row.people.title,
              personSlug: row.people.slug,
              personPhoto: row.people.photo,
              personIsWhoiswho: row.people.is_whoiswho,
            });
          }
        }
        setConnections(mapped.slice(0, 6));
      });
  }, []);

  if (connections.length === 0) return null;

  return (
    <section className="py-8 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
            <Link2 className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-primary">Vertical Connection</h2>
            <p className="text-muted-foreground text-sm">News linked to key decision makers</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connections.map((c, index) => (
            <div key={index} className="bento-card group hover:border-secondary/40 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
              {/* News Part */}
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Newspaper className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <Badge variant="secondary" className="mb-2 text-xs">{c.articleVertical}</Badge>
                  <h4 className="font-medium text-sm text-primary leading-tight line-clamp-2">{c.articleTitle}</h4>
                  {c.articleDate && <p className="text-xs text-muted-foreground mt-1">{c.articleDate}</p>}
                </div>
              </div>

              {/* Connection Arrow */}
              <div className="flex items-center justify-center py-2">
                <div className="flex-1 h-px bg-border" />
                <div className="px-3">
                  <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center group-hover:bg-secondary/30 transition-colors">
                    <ArrowRight className="h-4 w-4 text-secondary" />
                  </div>
                </div>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Person Part */}
              <Link to={c.personIsWhoiswho ? `/whoiswho/${c.personSlug}` : `/people/${c.personSlug}`} className="flex items-center gap-3 mt-4">
                <img src={c.personPhoto || "/placeholder.svg"} alt={c.personName} className="w-12 h-12 rounded-full object-cover ring-2 ring-secondary/30" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-primary">{c.personName}</p>
                  {c.personTitle && <p className="text-xs text-muted-foreground">{c.personTitle}</p>}
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
