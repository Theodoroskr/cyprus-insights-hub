import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Building2, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";

export default function IndustryPage() {
  const { slug } = useParams();
  const [industry, setIndustry] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    supabase.from("industries").select("*").eq("slug", slug).single().then(async ({ data: ind }) => {
      if (!ind) { setLoading(false); return; }
      setIndustry(ind);
      const [compRes, artRes] = await Promise.all([
        supabase.from("companies").select("*, location:locations(name)").eq("industry_id", ind.id),
        supabase.from("article_industries").select("article:directory_articles(*)").eq("industry_id", ind.id),
      ]);
      if (compRes.data) setCompanies(compRes.data);
      if (artRes.data) setArticles(artRes.data.map((r: any) => r.article).filter(Boolean));
      setLoading(false);
    });
  }, [slug]);

  if (loading) return <div className="min-h-screen bg-background"><TopNavigation onSearch={() => {}} /><div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading...</div></div>;
  if (!industry) return <div className="min-h-screen bg-background"><TopNavigation onSearch={() => {}} /><div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Industry not found</div></div>;

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation onSearch={() => {}} />
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-10">
          <Link to="/directory" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-secondary mb-4"><ArrowLeft className="h-4 w-4" /> Directory</Link>
          <h1 className="text-3xl font-serif font-bold text-foreground">{industry.name}</h1>
          <p className="text-muted-foreground mt-2">{companies.length} companies • {articles.length} articles</p>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-xl font-serif font-bold text-foreground mb-4">Companies</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {companies.map((c) => (
            <Link key={c.id} to={`/companies/${c.slug}`} className="group flex items-center gap-4 p-4 border border-border rounded-lg bg-card hover:shadow-md transition-all">
              <img src={c.logo || "/placeholder.svg"} alt={c.name} className="w-12 h-12 rounded-lg object-cover" />
              <div>
                <p className="font-semibold text-foreground group-hover:text-secondary">{c.name}</p>
                <p className="text-xs text-muted-foreground">{(c as any).location?.name}</p>
              </div>
            </Link>
          ))}
        </div>
        {articles.length > 0 && (
          <>
            <h2 className="text-xl font-serif font-bold text-foreground mb-4">Related Articles</h2>
            <div className="space-y-3">
              {articles.map((a) => (
                <Link key={a.id} to={`/news/${a.slug}`} className="flex gap-4 p-4 border border-border rounded-lg bg-card hover:shadow-md transition-all group">
                  {a.cover_image && <img src={a.cover_image} alt={a.title} className="w-20 h-16 rounded object-cover flex-shrink-0" />}
                  <div>
                    <h4 className="font-serif font-bold text-foreground group-hover:text-secondary">{a.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{a.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
