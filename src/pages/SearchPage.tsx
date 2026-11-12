import { useWhoIsWhoVisible } from "@/hooks/useIsAdmin";
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
import { safeTerm, searchSection, searchSource } from "@/lib/searchTerms";
import { storyImage } from "@/lib/fallbackImage";
import { formatDistanceToNow } from "date-fns";

const SECTION_LABEL: Record<string, string> = { compliance: "Compliance", fintech: "FinTech", regtech: "RegTech", sme: "SME", general: "Business" };

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [search, setSearch] = useState(query);
  const [companies, setCompanies] = useState<any[]>([]);
  const [allPeople, setPeople] = useState<any[]>([]);
  const { visible: showPeople } = useWhoIsWhoVisible();
  const people = showPeople ? allPeople : [];
  const [articles, setArticles] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);

  useEffect(() => {
    if (!query) return;
    const term = safeTerm(query);
    const q = `%${term}%`;
    const filters = [`title.ilike.${q}`, `summary.ilike.${q}`, `tags.cs.{"${term}"}`];
    const section = searchSection(term);
    const source = searchSource(term);
    if (section) filters.push(`vertical.eq.${section}`);
    if (source) filters.push(`source_id.like.${source}:*`);
    Promise.all([
      supabase.from("directory_companies").select("id, company_name, slug, city, activity_description, registration_no").or(`company_name.ilike.${q},registration_no.ilike.${q}`).limit(20),
      supabase.from("people").select("id, name, slug, photo, title, is_whoiswho").ilike("name", q).limit(20),
      supabase.from("directory_articles").select("id, title, slug, excerpt, article_type, cover_image").eq("is_published", true).ilike("title", q).limit(20),
      supabase.from("cna_articles").select("id, title, summary, image_url, vertical, published_at, body_markdown").eq("status", "published").or(filters.join(",")).order("published_at", { ascending: false }).limit(30),
    ]).then(([c, p, a, n]) => {
      setCompanies(c.data ?? []);
      setPeople(p.data ?? []);
      setArticles(a.data ?? []);
      setStories(n.data ?? []);
    });
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: search });
  };

  const total = companies.length + people.length + articles.length + stories.length;
  const newsArticles = articles.filter(a => a.article_type === 'news' || a.article_type === 'insight');
  const interviewArticles = articles.filter(a => a.article_type === 'interview');
  const whoiswhoArticles = articles.filter(a => a.article_type === 'whoiswho');

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={query ? `Search: ${query} | Cyprus Intelligence` : "Search | Cyprus Intelligence"} description="Search companies, people, and articles in the Cyprus business directory." />
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
              <TabsTrigger value="stories">News stories ({stories.length})</TabsTrigger>
              <TabsTrigger value="companies">Companies ({companies.length})</TabsTrigger>
              <TabsTrigger value="people">People ({people.length})</TabsTrigger>
              <TabsTrigger value="news">Directory articles ({newsArticles.length})</TabsTrigger>
              <TabsTrigger value="interviews">Interviews ({interviewArticles.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <div className="space-y-6">
                {stories.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3"><Newspaper className="h-4 w-4 text-secondary" /> News stories</h3>
                    <div className="space-y-2">
                      {stories.slice(0, 8).map((s) => (
                  <Link key={s.id} to={`/article/${s.id}`} className="flex items-center gap-4 p-3 border border-border rounded-lg hover:shadow-md transition-all group bg-card">
                    <img src={storyImage(s.image_url, s.vertical, s.id, s.body_markdown)} alt="" className="w-24 h-16 rounded object-cover flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider">{SECTION_LABEL[s.vertical] ?? s.vertical}</Badge>
                        <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(s.published_at), { addSuffix: true })}</span>
                      </div>
                      <p className="font-semibold text-foreground group-hover:text-secondary line-clamp-1">{s.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">{s.summary}</p>
                    </div>
                  </Link>
                ))}
                    </div>
                  </div>
                )}
                {companies.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3"><Building2 className="h-4 w-4 text-secondary" /> Companies</h3>
                    <div className="space-y-2">
                      {companies.slice(0, 5).map((c) => (
                        <Link key={c.id} to={`/directory/company/${c.slug}`} className="flex items-center gap-3 p-3 border border-border rounded-lg hover:shadow-md transition-all group bg-card">
                          <Building2 className="w-10 h-10 p-2 rounded-lg bg-muted text-muted-foreground flex-shrink-0" />
                          <div>
                            <p className="font-medium text-foreground group-hover:text-secondary">{c.company_name}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{[c.registration_no, c.city, c.activity_description].filter(Boolean).join(" · ")}</p>
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

            <TabsContent value="stories">
              <div className="space-y-2">
                {stories.map((s) => (
                  <Link key={s.id} to={`/article/${s.id}`} className="flex items-center gap-4 p-3 border border-border rounded-lg hover:shadow-md transition-all group bg-card">
                    <img src={storyImage(s.image_url, s.vertical, s.id, s.body_markdown)} alt="" className="w-24 h-16 rounded object-cover flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider">{SECTION_LABEL[s.vertical] ?? s.vertical}</Badge>
                        <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(s.published_at), { addSuffix: true })}</span>
                      </div>
                      <p className="font-semibold text-foreground group-hover:text-secondary line-clamp-1">{s.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">{s.summary}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="companies">
              <div className="space-y-2">
                {companies.map((c) => (
                  <Link key={c.id} to={`/directory/company/${c.slug}`} className="flex items-center gap-4 p-4 border border-border rounded-lg hover:shadow-md transition-all group bg-card">
                    <Building2 className="w-12 h-12 p-2.5 rounded-lg bg-muted text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground group-hover:text-secondary">{c.company_name}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">{[c.registration_no, c.city, c.activity_description].filter(Boolean).join(" · ")}</p>
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
