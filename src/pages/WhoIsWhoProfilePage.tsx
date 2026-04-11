import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Building2, Newspaper, Mic, Quote } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";

export default function WhoIsWhoProfilePage() {
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
  if (!person) return <div className="min-h-screen bg-background"><TopNavigation onSearch={() => {}} /><div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Profile not found</div></div>;

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation onSearch={() => {}} />

      {/* Premium editorial header */}
      <div className="relative bg-gradient-to-br from-primary via-primary/95 to-primary/85 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-20 w-96 h-96 bg-secondary rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-8 max-w-4xl mx-auto">
            <img src={person.photo || "/placeholder.svg"} alt={person.name} className="w-36 h-36 rounded-full object-cover border-4 border-secondary/30 shadow-2xl" />
            <div className="text-center md:text-left">
              <Badge className="bg-secondary/20 text-secondary border-secondary/30 mb-3">Who's Who</Badge>
              <h1 className="text-4xl font-serif font-bold">{person.name}</h1>
              <p className="text-xl text-white/80 mt-2">{person.title}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-4xl">
        {/* Quote */}
        {person.whoiswho_quote && (
          <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-8 mb-10 text-center">
            <Quote className="h-8 w-8 text-secondary mx-auto mb-3" />
            <blockquote className="text-xl font-serif italic text-foreground leading-relaxed">
              "{person.whoiswho_quote}"
            </blockquote>
            <p className="text-sm text-muted-foreground mt-3">— {person.name}</p>
          </div>
        )}

        {/* Biography */}
        {person.bio && (
          <section className="mb-10">
            <h2 className="text-xl font-serif font-bold text-foreground mb-4">Professional Biography</h2>
            <p className="text-muted-foreground leading-relaxed text-lg">{person.bio}</p>
          </section>
        )}

        {/* Companies */}
        {companies.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-serif font-bold text-foreground mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-secondary" /> Key Roles
            </h2>
            <div className="space-y-3">
              {companies.map((rel: any) => (
                <Link key={rel.id} to={`/companies/${rel.company?.slug}`} className="flex items-center gap-4 p-4 border border-border rounded-lg hover:shadow-md transition-all group bg-card">
                  <img src={rel.company?.logo || "/placeholder.svg"} alt={rel.company?.name} className="w-12 h-12 rounded-lg object-cover border border-border" />
                  <div>
                    <p className="font-semibold text-foreground group-hover:text-secondary transition-colors">{rel.company?.name}</p>
                    <p className="text-sm text-muted-foreground">{rel.role}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Articles */}
        {articles.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-serif font-bold text-foreground mb-4 flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-secondary" /> Featured Articles & Interviews
            </h2>
            <div className="space-y-3">
              {articles.map((a) => (
                <Link key={a.id} to={a.article_type === 'interview' ? `/interviews/${a.slug}` : `/news/${a.slug}`} className="flex gap-4 p-4 border border-border rounded-lg hover:shadow-md transition-all group bg-card">
                  {a.cover_image && <img src={a.cover_image} alt={a.title} className="w-20 h-16 rounded object-cover flex-shrink-0" />}
                  <div>
                    <Badge variant="outline" className="mb-1 text-xs">{a.article_type}</Badge>
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
