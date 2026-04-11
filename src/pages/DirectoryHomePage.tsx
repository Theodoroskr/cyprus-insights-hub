import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Building2, Users, Newspaper, Mic, BookOpen, TrendingUp, ArrowRight, Globe, Shield, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";

export default function DirectoryHomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [companies, setCompanies] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [industries, setIndustries] = useState<any[]>([]);

  useEffect(() => {
    // Fetch in parallel
    Promise.all([
      supabase.from("companies").select("id, name, slug, logo, description, size, industry:industries(name)").limit(6),
      supabase.from("directory_articles").select("*").eq("article_type", "news").eq("is_published", true).order("published_at", { ascending: false }).limit(4),
      supabase.from("directory_articles").select("*").eq("article_type", "interview").eq("is_published", true).order("published_at", { ascending: false }).limit(3),
      supabase.from("people").select("*").eq("is_whoiswho", true).limit(6),
      supabase.from("industries").select("*").order("name"),
    ]).then(([c, a, i, p, ind]) => {
      if (c.data) setCompanies(c.data);
      if (a.data) setArticles(a.data);
      if (i.data) setInterviews(i.data);
      if (p.data) setPeople(p.data);
      if (ind.data) setIndustries(ind.data);
    });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation onSearch={() => {}} />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary via-primary/95 to-primary/85 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-secondary rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 py-20 md:py-28 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="bg-white/15 text-white border-white/20 mb-6 text-sm px-4 py-1.5 rounded-full">
              <Globe className="h-3.5 w-3.5 mr-1.5" />
              Cyprus Business Intelligence Platform
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold leading-tight mb-6">
              Find Companies. Discover People.{" "}
              <span className="text-secondary">Unlock Insights.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10 font-source-serif">
              Explore businesses, decision-makers, news, interviews, and company intelligence in one connected platform.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search companies, people, news, interviews..."
                  className="pl-14 pr-32 h-14 text-base bg-white text-foreground border-0 rounded-full shadow-2xl"
                />
                <Button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-6 h-10 bg-secondary text-secondary-foreground hover:bg-secondary/90">
                  Search
                </Button>
              </div>
            </form>

            {/* Quick links */}
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              {["KPMG Cyprus", "PwC Cyprus", "Professional Services", "Audit & Consulting"].map((q) => (
                <Link key={q} to={`/search?q=${encodeURIComponent(q)}`} className="text-sm text-white/60 hover:text-white border border-white/20 rounded-full px-4 py-1.5 transition-colors hover:border-white/40">
                  {q}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Browse Directory */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-serif font-bold text-foreground">Browse Directory</h2>
            <p className="text-muted-foreground mt-1">Explore companies across Cyprus and beyond</p>
          </div>
          <Link to="/directory">
            <Button variant="outline" className="gap-2">
              View All <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((c) => (
            <Link key={c.id} to={`/companies/${c.slug}`} className="group border border-border rounded-lg p-5 hover:shadow-lg hover:border-secondary/30 transition-all bg-card">
              <div className="flex items-start gap-4">
                <img src={c.logo || "/placeholder.svg"} alt={c.name} className="w-14 h-14 rounded-lg object-cover border border-border" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground group-hover:text-secondary transition-colors truncate">{c.name}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{(c as any).industry?.name || "General"}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{c.description}</p>
                </div>
              </div>
              {c.size && <Badge variant="outline" className="mt-3 text-xs">{c.size} employees</Badge>}
            </Link>
          ))}
        </div>
      </section>

      {/* Latest News */}
      <section className="bg-muted/30 border-y border-border">
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Newspaper className="h-5 w-5 text-secondary" />
              <h2 className="text-2xl font-serif font-bold text-foreground">Latest News</h2>
            </div>
            <Link to="/news">
              <Button variant="ghost" className="gap-2 text-secondary">View All <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {articles.map((a) => (
              <Link key={a.id} to={`/news/${a.slug}`} className="group bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all">
                <div className="relative h-44 overflow-hidden">
                  <img src={a.cover_image || "/placeholder.svg"} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent" />
                </div>
                <div className="p-4">
                  <h3 className="font-serif font-bold text-foreground leading-snug group-hover:text-secondary transition-colors line-clamp-2">{a.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{a.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Interviews */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Mic className="h-5 w-5 text-secondary" />
            <h2 className="text-2xl font-serif font-bold text-foreground">Featured Interviews</h2>
          </div>
          <Link to="/interviews">
            <Button variant="ghost" className="gap-2 text-secondary">View All <ArrowRight className="h-4 w-4" /></Button>
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {interviews.map((i) => (
            <Link key={i.id} to={`/interviews/${i.slug}`} className="group border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all bg-card">
              <div className="relative h-52 overflow-hidden">
                <img src={i.cover_image || "/placeholder.svg"} alt={i.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <Badge className="absolute top-3 left-3 bg-secondary text-secondary-foreground">Interview</Badge>
              </div>
              <div className="p-5">
                <h3 className="font-serif font-bold text-lg text-foreground leading-snug group-hover:text-secondary transition-colors">{i.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{i.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Who's Who */}
      <section className="bg-primary/5 border-y border-border">
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-secondary" />
              <h2 className="text-2xl font-serif font-bold text-foreground">Who's Who</h2>
            </div>
            <Link to="/whoiswho">
              <Button variant="ghost" className="gap-2 text-secondary">View All <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {people.map((p) => (
              <Link key={p.id} to={`/whoiswho/${p.slug}`} className="group flex items-center gap-4 bg-card border border-border rounded-lg p-5 hover:shadow-lg hover:border-secondary/30 transition-all">
                <img src={p.photo || "/placeholder.svg"} alt={p.name} className="w-16 h-16 rounded-full object-cover border-2 border-secondary/20" />
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground group-hover:text-secondary transition-colors">{p.name}</h3>
                  <p className="text-sm text-muted-foreground">{p.title}</p>
                  {p.whoiswho_quote && <p className="text-xs text-muted-foreground italic mt-1 line-clamp-1">"{p.whoiswho_quote}"</p>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl font-serif font-bold text-foreground mb-8">Browse by Industry</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {industries.map((ind) => (
            <Link key={ind.id} to={`/industries/${ind.slug}`} className="group border border-border rounded-lg p-5 text-center hover:shadow-md hover:border-secondary/30 transition-all bg-card">
              <Building2 className="h-8 w-8 mx-auto text-muted-foreground group-hover:text-secondary transition-colors mb-3" />
              <p className="font-medium text-sm text-foreground">{ind.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Infocredit CTA */}
      <section className="bg-gradient-to-r from-primary to-primary/90 text-white">
        <div className="container mx-auto px-4 py-16 text-center">
          <Shield className="h-10 w-10 mx-auto mb-4 text-secondary" />
          <h2 className="text-3xl font-serif font-bold mb-4">Need Deeper Insight?</h2>
          <p className="text-white/80 max-w-2xl mx-auto mb-8 text-lg">
            Purchase a full company report powered by Infocredit. Get credit reports, financials, directors & shareholders, and risk analysis.
          </p>
          <Link to="/directory">
            <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2 rounded-full px-8">
              Browse Companies <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <p className="text-white/50 text-sm mt-4">Powered by Infocredit</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
