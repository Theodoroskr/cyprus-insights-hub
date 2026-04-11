import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Building2, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { formatDistanceToNow } from "date-fns";

export default function InterviewArticlePage() {
  const { slug } = useParams();
  const [article, setArticle] = useState<any>(null);
  const [linkedCompanies, setLinkedCompanies] = useState<any[]>([]);
  const [linkedPeople, setLinkedPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    supabase.from("directory_articles").select("*").eq("slug", slug).single().then(async ({ data: art }) => {
      if (!art) { setLoading(false); return; }
      setArticle(art);
      const [compRes, pplRes] = await Promise.all([
        supabase.from("article_companies").select("company:companies(id, name, slug, logo)").eq("article_id", art.id),
        supabase.from("article_people").select("person:people(id, name, slug, photo, title)").eq("article_id", art.id),
      ]);
      if (compRes.data) setLinkedCompanies(compRes.data.map((r: any) => r.company).filter(Boolean));
      if (pplRes.data) setLinkedPeople(pplRes.data.map((r: any) => r.person).filter(Boolean));
      setLoading(false);
    });
  }, [slug]);

  if (loading) return <div className="min-h-screen bg-background"><TopNavigation onSearch={() => {}} /><div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading...</div></div>;
  if (!article) return <div className="min-h-screen bg-background"><TopNavigation onSearch={() => {}} /><div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Interview not found</div></div>;

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation onSearch={() => {}} />

      {article.cover_image && (
        <div className="relative h-72 md:h-96 overflow-hidden">
          <img src={article.cover_image} alt={article.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/30 to-transparent" />
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/interviews" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-secondary mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Interviews
        </Link>
        <Badge className="bg-secondary text-secondary-foreground mb-3">Interview</Badge>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground leading-tight">{article.title}</h1>
        {article.published_at && <p className="text-sm text-muted-foreground mt-3">{formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}</p>}

        {/* Featured person & company */}
        <div className="flex flex-wrap gap-3 mt-4">
          {linkedPeople.map((p) => (
            <Link key={p.id} to={`/people/${p.slug}`}>
              <Badge variant="outline" className="gap-1.5 py-1.5 cursor-pointer hover:bg-muted">
                <img src={p.photo || "/placeholder.svg"} alt={p.name} className="w-5 h-5 rounded-full object-cover" />
                {p.name}
              </Badge>
            </Link>
          ))}
          {linkedCompanies.map((c) => (
            <Link key={c.id} to={`/companies/${c.slug}`}>
              <Badge variant="secondary" className="gap-1 cursor-pointer"><Building2 className="h-3 w-3" />{c.name}</Badge>
            </Link>
          ))}
        </div>

        <div className="prose max-w-none mt-8">
          <p className="text-lg font-medium text-foreground mb-4">{article.excerpt}</p>
          <div className="text-muted-foreground leading-relaxed whitespace-pre-line">{article.content}</div>
        </div>

        {/* Related profiles */}
        {(linkedPeople.length > 0 || linkedCompanies.length > 0) && (
          <div className="border-t border-border mt-10 pt-8">
            <h3 className="font-serif font-bold text-foreground mb-4">Related Profiles</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {linkedPeople.map((p) => (
                <Link key={p.id} to={`/people/${p.slug}`} className="flex items-center gap-3 p-4 border border-border rounded-lg hover:shadow-md transition-all group bg-card">
                  <img src={p.photo || "/placeholder.svg"} alt={p.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="font-medium text-foreground group-hover:text-secondary">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.title}</p>
                  </div>
                </Link>
              ))}
              {linkedCompanies.map((c) => (
                <Link key={c.id} to={`/companies/${c.slug}`} className="flex items-center gap-3 p-4 border border-border rounded-lg hover:shadow-md transition-all group bg-card">
                  <img src={c.logo || "/placeholder.svg"} alt={c.name} className="w-10 h-10 rounded-lg object-cover" />
                  <p className="font-medium text-foreground group-hover:text-secondary">{c.name}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
