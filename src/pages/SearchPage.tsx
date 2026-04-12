import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, Building2, User, Newspaper, Mic, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [search, setSearch] = useState(query);
  const [companies, setCompanies] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);

  useEffect(() => {
    if (!query) return;
    const q = `%${query}%`;
    Promise.all([
      supabase.from("companies").select("id, name, slug, logo, description").ilike("name", q).limit(20),
      supabase.from("people").select("id, name, slug, photo, title, is_whoiswho").ilike("name", q).limit(20),
      supabase.from("directory_articles").select("id, title, slug, excerpt, article_type, cover_image").eq("is_published", true).ilike("title", q).limit(20),
    ]).then(([c, p, a]) => {
      if (c.data) setCompanies(c.data);
      if (p.data) setPeople(p.data);
      if (a.data) setArticles(a.data);
    });
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: search });
  };

  const total = companies.length + people.length + articles.length;
  const newsArticles = articles.filter(a => a.article_type === 'news' || a.article_type === 'insight');
  const interviewArticles = articles.filter(a => a.article_type === 'interview');
  const whoiswhoArticles = articles.filter(a => a.article_type === 'whoiswho');

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation onSearch={() => {}} />

      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-10">
          <h1 className="text-3xl font-serif font-bold text-foreground mb-4">Search</h1>
          <form onSubmit={handleSearch} className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search companies, people, news..." className="pl-11 h-12" />
          </form>
          {query && <p className="text-sm text-muted-foreground mt-3">{total} results for "{query}"</p>}
        </div>
      </div>

      {query && (
        <div className="container mx-auto px-4 py-8">
          <Tabs defaultValue="all">
            <TabsList className="mb-6">
              <TabsTrigger value="all">All ({total})</TabsTrigger>
              <TabsTrigger value="companies">Companies ({companies.length})</TabsTrigger>
              <TabsTrigger value="people">People ({people.length})</TabsTrigger>
              <TabsTrigger value="news">News ({newsArticles.length})</TabsTrigger>
              <TabsTrigger value="interviews">Interviews ({interviewArticles.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <div className="space-y-6">
                {companies.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3"><Building2 className="h-4 w-4 text-secondary" /> Companies</h3>
                    <div className="space-y-2">
                      {companies.slice(0, 5).map((c) => (
                        <Link key={c.id} to={`/companies/${c.slug}`} className="flex items-center gap-3 p-3 border border-border rounded-lg hover:shadow-md transition-all group bg-card">
                          <img src={c.logo || "/placeholder.svg"} alt={c.name} className="w-10 h-10 rounded-lg object-cover" />
                          <div>
                            <p className="font-medium text-foreground group-hover:text-secondary">{c.name}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{c.description}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {people.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3"><User className="h-4 w-4 text-secondary" /> People</h3>
                    <div className="space-y-2">
                      {people.slice(0, 5).map((p) => (
                        <Link key={p.id} to={p.is_whoiswho ? `/whoiswho/${p.slug}` : `/people/${p.slug}`} className="flex items-center gap-3 p-3 border border-border rounded-lg hover:shadow-md transition-all group bg-card">
                          <img src={p.photo || "/placeholder.svg"} alt={p.name} className="w-10 h-10 rounded-full object-cover" />
                          <div>
                            <p className="font-medium text-foreground group-hover:text-secondary">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.title}</p>
                          </div>
                          {p.is_whoiswho && <Badge className="ml-auto text-xs bg-secondary/10 text-secondary">Who's Who</Badge>}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {articles.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3"><Newspaper className="h-4 w-4 text-secondary" /> Articles</h3>
                    <div className="space-y-2">
                      {articles.slice(0, 5).map((a) => (
                        <Link key={a.id} to={a.article_type === 'interview' ? `/interviews/${a.slug}` : `/news/${a.slug}`} className="flex items-center gap-3 p-3 border border-border rounded-lg hover:shadow-md transition-all group bg-card">
                          {a.cover_image && <img src={a.cover_image} alt={a.title} className="w-16 h-12 rounded object-cover flex-shrink-0" />}
                          <div>
                            <Badge variant="outline" className="text-xs mb-1">{a.article_type}</Badge>
                            <p className="font-medium text-foreground group-hover:text-secondary line-clamp-1">{a.title}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="companies">
              <div className="space-y-2">
                {companies.map((c) => (
                  <Link key={c.id} to={`/companies/${c.slug}`} className="flex items-center gap-4 p-4 border border-border rounded-lg hover:shadow-md transition-all group bg-card">
                    <img src={c.logo || "/placeholder.svg"} alt={c.name} className="w-12 h-12 rounded-lg object-cover" />
                    <div>
                      <p className="font-semibold text-foreground group-hover:text-secondary">{c.name}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">{c.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="people">
              <div className="space-y-2">
                {people.map((p) => (
                  <Link key={p.id} to={p.is_whoiswho ? `/whoiswho/${p.slug}` : `/people/${p.slug}`} className="flex items-center gap-4 p-4 border border-border rounded-lg hover:shadow-md transition-all group bg-card">
                    <img src={p.photo || "/placeholder.svg"} alt={p.name} className="w-12 h-12 rounded-full object-cover" />
                    <div>
                      <p className="font-semibold text-foreground group-hover:text-secondary">{p.name}</p>
                      <p className="text-sm text-muted-foreground">{p.title}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="news">
              <div className="space-y-2">
                {newsArticles.map((a) => (
                  <Link key={a.id} to={`/news/${a.slug}`} className="flex items-center gap-4 p-4 border border-border rounded-lg hover:shadow-md transition-all group bg-card">
                    {a.cover_image && <img src={a.cover_image} alt={a.title} className="w-16 h-12 rounded object-cover flex-shrink-0" />}
                    <div>
                      <p className="font-semibold text-foreground group-hover:text-secondary">{a.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">{a.excerpt}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="interviews">
              <div className="space-y-2">
                {interviewArticles.map((a) => (
                  <Link key={a.id} to={`/interviews/${a.slug}`} className="flex items-center gap-4 p-4 border border-border rounded-lg hover:shadow-md transition-all group bg-card">
                    {a.cover_image && <img src={a.cover_image} alt={a.title} className="w-16 h-12 rounded object-cover flex-shrink-0" />}
                    <div>
                      <p className="font-semibold text-foreground group-hover:text-secondary">{a.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">{a.excerpt}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
      <Footer />
    </div>
  );
}
