import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X, Newspaper, User, BadgeCheck, Building2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

interface SearchResultsProps {
  query: string;
  onClose: () => void;
}

export function SearchResults({ query, onClose }: SearchResultsProps) {
  const [news, setNews] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    const q = `%${query}%`;

    Promise.all([
      supabase
        .from("cna_articles")
        .select("id, title, summary, vertical, published_at")
        .eq("status", "published")
        .or(`title.ilike.${q},summary.ilike.${q}`)
        .order("published_at", { ascending: false })
        .limit(10),
      supabase
        .from("people")
        .select("id, name, slug, title, photo, is_whoiswho")
        .or(`name.ilike.${q},title.ilike.${q}`)
        .order("name")
        .limit(10),
    ]).then(([newsRes, peopleRes]) => {
      if (newsRes.data) setNews(newsRes.data);
      if (peopleRes.data) setPeople(peopleRes.data);
      setLoading(false);
    });
  }, [query]);

  if (!query) return null;

  const verticalLabel = (v: string) => {
    const map: Record<string, string> = { compliance: "Compliance", fintech: "FinTech", sme: "SME", general: "Business" };
    return map[v] || v;
  };

  const totalResults = news.length + people.length;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="container mx-auto px-4 py-8 h-full overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-primary">Search Results</h2>
              <p className="text-muted-foreground">
                {loading ? "Searching…" : `${totalResults} results for `}
                "<span className="text-secondary font-medium">{query}</span>"
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {loading ? (
            <div className="py-16 text-center text-muted-foreground">Searching…</div>
          ) : totalResults === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <p className="text-lg">No results found.</p>
              <p className="text-sm mt-2">Try a different search term.</p>
            </div>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="all">All ({totalResults})</TabsTrigger>
                <TabsTrigger value="news">News ({news.length})</TabsTrigger>
                <TabsTrigger value="people">People ({people.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-6">
                {news.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Newspaper className="h-4 w-4 text-secondary" />
                      <h3 className="font-semibold text-primary">News</h3>
                    </div>
                    <div className="space-y-3">
                      {news.map((item) => (
                        <Link key={item.id} to={`/article/${item.id}`} className="block bento-card p-4 hover:border-secondary/40 cursor-pointer">
                          <Badge variant="outline" className="mb-2">{verticalLabel(item.vertical)}</Badge>
                          <h4 className="font-medium text-primary mb-1">{item.title}</h4>
                          {item.summary && <p className="text-sm text-muted-foreground line-clamp-2">{item.summary}</p>}
                          {item.published_at && (
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(item.published_at).toLocaleDateString("en-GB")}
                            </p>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {people.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <User className="h-4 w-4 text-secondary" />
                      <h3 className="font-semibold text-primary">People</h3>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {people.map((person) => (
                        <Link key={person.id} to={person.is_whoiswho ? `/whoiswho/${person.slug}` : `/people/${person.slug}`} className="block bento-card p-4 hover:border-secondary/40 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <img src={person.photo || "/placeholder.svg"} alt={person.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-secondary/30" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-primary truncate">{person.name}</p>
                              {person.title && <p className="text-xs text-muted-foreground">{person.title}</p>}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="news" className="space-y-3">
                {news.map((item) => (
                  <Link key={item.id} to={`/article/${item.id}`} className="block bento-card p-4 hover:border-secondary/40 cursor-pointer">
                    <Badge variant="outline" className="mb-2">{verticalLabel(item.vertical)}</Badge>
                    <h4 className="font-medium text-primary mb-1">{item.title}</h4>
                    {item.summary && <p className="text-sm text-muted-foreground">{item.summary}</p>}
                  </Link>
                ))}
              </TabsContent>

              <TabsContent value="people" className="grid sm:grid-cols-2 gap-3">
                {people.map((person) => (
                  <Link key={person.id} to={person.is_whoiswho ? `/whoiswho/${person.slug}` : `/people/${person.slug}`} className="block bento-card p-4 hover:border-secondary/40 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <img src={person.photo || "/placeholder.svg"} alt={person.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-secondary/30" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-primary truncate">{person.name}</p>
                        {person.title && <p className="text-xs text-muted-foreground">{person.title}</p>}
                      </div>
                    </div>
                  </Link>
                ))}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
