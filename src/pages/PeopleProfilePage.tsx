import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Building2, Newspaper, Mic } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";

export default function PeopleProfilePage() {
  const { slug } = useParams();
  const [person, setPerson] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    supabase.from("people").select("*").eq("slug", slug).single().then(async ({ data: p }) => {
      if (!p) { setLoading(false); return; }
      setPerson(p);
      const [relRes, artRes] = await Promise.all([
        supabase.from("relationships").select("*, company:companies(*, industry:industries(name))").eq("person_id", p.id),
        supabase.from("article_people").select("article:directory_articles(*)").eq("person_id", p.id),
      ]);
      if (relRes.data) setCompanies(relRes.data);
      if (artRes.data) setArticles(artRes.data.map((r: any) => r.article).filter(Boolean));
      setLoading(false);
    });
  }, [slug]);

  if (loading) return <div className="min-h-screen bg-background"><TopNavigation onSearch={() => {}} /><div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading...</div></div>;
  if (!person) return <div className="min-h-screen bg-background"><TopNavigation onSearch={() => {}} /><div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Person not found</div></div>;

  const newsArticles = articles.filter(a => a.article_type === 'news' || a.article_type === 'insight');
  const interviewArticles = articles.filter(a => a.article_type === 'interview');
  const whoiswhoArticles = articles.filter(a => a.article_type === 'whoiswho');

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation onSearch={() => {}} />

      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-10">
          <div className="flex items-start gap-6">
            <img src={person.photo || "/placeholder.svg"} alt={person.name} className="w-24 h-24 rounded-full object-cover border-2 border-secondary/20" />
            <div>
              <h1 className="text-3xl font-serif font-bold text-foreground">{person.name}</h1>
              <p className="text-lg text-muted-foreground mt-1">{person.title}</p>
              {person.is_whoiswho && <Badge className="mt-2 bg-secondary/10 text-secondary border-secondary/20">Who's Who</Badge>}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Biography */}
        {person.bio && (
          <section className="mb-10">
            <h2 className="text-xl font-serif font-bold text-foreground mb-4">Biography</h2>
            <p className="text-muted-foreground leading-relaxed">{person.bio}</p>
            {person.whoiswho_quote && (
              <blockquote className="border-l-4 border-secondary pl-4 mt-4 italic text-foreground/80">
                "{person.whoiswho_quote}"
              </blockquote>
            )}
          </section>
        )}

        {/* Associated Companies */}
        {companies.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-serif font-bold text-foreground mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-secondary" /> Associated Companies
            </h2>
            <div className="space-y-3">
              {companies.map((rel: any) => (
                <Link key={rel.id} to={`/companies/${rel.company?.slug}`} className="flex items-center gap-4 p-4 border border-border rounded-lg hover:shadow-md transition-all group bg-card">
                  <img src={rel.company?.logo || "/placeholder.svg"} alt={rel.company?.name} className="w-12 h-12 rounded-lg object-cover border border-border" />
                  <div>
                    <p className="font-semibold text-foreground group-hover:text-secondary transition-colors">{rel.company?.name}</p>
                    <p className="text-sm text-muted-foreground">{rel.role} • {rel.company?.industry?.name}</p>
                  </div>
                  {rel.is_current && <Badge className="ml-auto bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Current</Badge>}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* News Mentions */}
        {newsArticles.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-serif font-bold text-foreground mb-4 flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-secondary" /> News Mentions
            </h2>
            <div className="space-y-3">
              {newsArticles.map((a) => (
                <Link key={a.id} to={`/news/${a.slug}`} className="flex gap-4 p-4 border border-border rounded-lg hover:shadow-md transition-all group bg-card">
                  {a.cover_image && <img src={a.cover_image} alt={a.title} className="w-20 h-16 rounded object-cover flex-shrink-0" />}
                  <div>
                    <h4 className="font-serif font-bold text-foreground group-hover:text-secondary transition-colors">{a.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{a.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Interviews */}
        {interviewArticles.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-serif font-bold text-foreground mb-4 flex items-center gap-2">
              <Mic className="h-5 w-5 text-secondary" /> Interviews
            </h2>
            <div className="space-y-3">
              {interviewArticles.map((a) => (
                <Link key={a.id} to={`/interviews/${a.slug}`} className="flex gap-4 p-4 border border-border rounded-lg hover:shadow-md transition-all group bg-card">
                  {a.cover_image && <img src={a.cover_image} alt={a.title} className="w-20 h-16 rounded object-cover flex-shrink-0" />}
                  <div>
                    <Badge variant="outline" className="mb-1">Interview</Badge>
                    <h4 className="font-serif font-bold text-foreground group-hover:text-secondary transition-colors">{a.title}</h4>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
      <Footer />
    </div>
  );
}
