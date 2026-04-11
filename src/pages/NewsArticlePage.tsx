import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Building2, User, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { formatDistanceToNow } from "date-fns";

export default function NewsArticlePage() {
  const { slug } = useParams();
  const [article, setArticle] = useState<any>(null);
  const [linkedCompanies, setLinkedCompanies] = useState<any[]>([]);
  const [linkedPeople, setLinkedPeople] = useState<any[]>([]);
  const [relatedArticles, setRelatedArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    supabase.from("directory_articles").select("*").eq("slug", slug).single().then(async ({ data: art }) => {
      if (!art) { setLoading(false); return; }
      setArticle(art);
      const [compRes, pplRes, relRes] = await Promise.all([
        supabase.from("article_companies").select("company:companies(id, name, slug, logo)").eq("article_id", art.id),
        supabase.from("article_people").select("person:people(id, name, slug, photo, title)").eq("article_id", art.id),
        supabase.from("directory_articles").select("id, title, slug, cover_image, article_type").eq("is_published", true).neq("id", art.id).order("published_at", { ascending: false }).limit(4),
      ]);
      if (compRes.data) setLinkedCompanies(compRes.data.map((r: any) => r.company).filter(Boolean));
      if (pplRes.data) setLinkedPeople(pplRes.data.map((r: any) => r.person).filter(Boolean));
      if (relRes.data) setRelatedArticles(relRes.data);
      setLoading(false);
    });
  }, [slug]);

  if (loading) return <div className="min-h-screen bg-background"><TopNavigation onSearch={() => {}} /><div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading...</div></div>;
  if (!article) return <div className="min-h-screen bg-background"><TopNavigation onSearch={() => {}} /><div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Article not found</div></div>;

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation onSearch={() => {}} />

      {/* Hero */}
      {article.cover_image && (
        <div className="relative h-72 md:h-96 overflow-hidden">
          <img src={article.cover_image} alt={article.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/30 to-transparent" />
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-10">
          <article className="flex-1 max-w-3xl">
            <Link to="/news" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-secondary mb-4">
              <ArrowLeft className="h-4 w-4" /> Back to News
            </Link>
            <Badge variant="outline" className="mb-3">{article.article_type}</Badge>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground leading-tight">{article.title}</h1>
            {article.published_at && <p className="text-sm text-muted-foreground mt-3">{formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}</p>}

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-4">
              {linkedCompanies.map((c) => (
                <Link key={c.id} to={`/companies/${c.slug}`}>
                  <Badge variant="secondary" className="gap-1 cursor-pointer hover:bg-secondary/80"><Building2 className="h-3 w-3" />{c.name}</Badge>
                </Link>
              ))}
              {linkedPeople.map((p) => (
                <Link key={p.id} to={`/people/${p.slug}`}>
                  <Badge variant="outline" className="gap-1 cursor-pointer hover:bg-muted"><User className="h-3 w-3" />{p.name}</Badge>
                </Link>
              ))}
            </div>

            <div className="prose max-w-none mt-8">
              <p className="text-lg font-medium text-foreground mb-4">{article.excerpt}</p>
              <div className="text-muted-foreground leading-relaxed whitespace-pre-line">{article.content}</div>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="lg:w-80 flex-shrink-0 space-y-6">
            {/* Linked Companies */}
            {linkedCompanies.length > 0 && (
              <div className="border border-border rounded-lg p-5 bg-card">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Building2 className="h-4 w-4 text-secondary" /> Companies Mentioned</h3>
                <div className="space-y-2">
                  {linkedCompanies.map((c) => (
                    <Link key={c.id} to={`/companies/${c.slug}`} className="flex items-center gap-3 p-2 rounded hover:bg-muted transition-colors">
                      <img src={c.logo || "/placeholder.svg"} alt={c.name} className="w-8 h-8 rounded object-cover" />
                      <span className="text-sm font-medium text-foreground hover:text-secondary">{c.name}</span>
                    </Link>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-3 text-xs bg-secondary/5 border-secondary/20 text-secondary" onClick={() => {}}>
                  Get Company Report
                </Button>
              </div>
            )}

            {/* Linked People */}
            {linkedPeople.length > 0 && (
              <div className="border border-border rounded-lg p-5 bg-card">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><User className="h-4 w-4 text-secondary" /> People Mentioned</h3>
                <div className="space-y-2">
                  {linkedPeople.map((p) => (
                    <Link key={p.id} to={`/people/${p.slug}`} className="flex items-center gap-3 p-2 rounded hover:bg-muted transition-colors">
                      <img src={p.photo || "/placeholder.svg"} alt={p.name} className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <span className="text-sm font-medium text-foreground">{p.name}</span>
                        <p className="text-xs text-muted-foreground">{p.title}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <div className="border border-border rounded-lg p-5 bg-card">
                <h3 className="font-semibold text-foreground mb-3">Related Articles</h3>
                <div className="space-y-3">
                  {relatedArticles.map((a) => (
                    <Link key={a.id} to={`/news/${a.slug}`} className="block group">
                      <h4 className="text-sm font-medium text-foreground group-hover:text-secondary transition-colors line-clamp-2">{a.title}</h4>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  );
}
