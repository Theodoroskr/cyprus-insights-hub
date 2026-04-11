import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Users, ArrowRight, Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export function DirectoryPreview() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from("companies").select("id, name, slug, logo, description, size, industry:industries(name), location:locations(name)").limit(6),
      supabase.from("people").select("id, name, slug, photo, title, is_whoiswho").eq("is_whoiswho", true).limit(4),
    ]).then(([c, p]) => {
      if (c.data) setCompanies(c.data);
      if (p.data) setPeople(p.data);
    });
  }, []);

  return (
    <section className="section-rule section-rule-thick">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-2">
          <span className="section-label">Intelligence Directory</span>
          <div className="flex-1 h-px bg-border" />
          <Link to="/directory">
            <Button variant="ghost" size="sm" className="gap-1 text-secondary text-xs">
              Explore Directory <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Find companies, discover people, and unlock business insights across Cyprus.
        </p>

        {/* Search CTA */}
        <Link to="/search" className="block mb-8">
          <div className="flex items-center gap-3 border border-border rounded-lg p-4 bg-muted/30 hover:border-secondary/40 hover:shadow-sm transition-all cursor-pointer">
            <Search className="h-5 w-5 text-muted-foreground" />
            <span className="text-muted-foreground">Search companies, people, news, interviews…</span>
            <Button size="sm" className="ml-auto bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full px-5">Search</Button>
          </div>
        </Link>

        {/* Companies Grid */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-4 w-4 text-secondary" />
            <h3 className="font-serif font-bold text-foreground">Popular Companies</h3>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {companies.map((c) => (
              <Link
                key={c.id}
                to={`/companies/${c.slug}`}
                className="group flex items-start gap-3 p-4 border border-border rounded-lg bg-card hover:shadow-md hover:border-secondary/30 transition-all"
              >
                <img src={c.logo || "/placeholder.svg"} alt={c.name} className="w-11 h-11 rounded-lg object-cover border border-border flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-sm text-foreground group-hover:text-secondary transition-colors truncate">{c.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    {(c as any).industry?.name && <span>{(c as any).industry.name}</span>}
                    {(c as any).location?.name && (
                      <>
                        <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/40" />
                        <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{(c as any).location.name}</span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Who's Who */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-secondary" />
            <h3 className="font-serif font-bold text-foreground">Who's Who</h3>
            <Link to="/whoiswho" className="ml-auto text-xs text-secondary hover:underline">View All</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {people.map((p) => (
              <Link
                key={p.id}
                to={`/whoiswho/${p.slug}`}
                className="group flex flex-col items-center text-center p-4 border border-border rounded-lg bg-card hover:shadow-md hover:border-secondary/30 transition-all"
              >
                <img src={p.photo || "/placeholder.svg"} alt={p.name} className="w-14 h-14 rounded-full object-cover border-2 border-secondary/20 mb-2" />
                <p className="font-semibold text-sm text-foreground group-hover:text-secondary transition-colors">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.title}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Browse CTA */}
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/directory"><Button variant="outline" className="gap-2"><Building2 className="h-4 w-4" /> Browse Directory</Button></Link>
          <Link to="/news"><Button variant="ghost" className="gap-2 text-secondary">Latest News <ArrowRight className="h-4 w-4" /></Button></Link>
          <Link to="/interviews"><Button variant="ghost" className="gap-2 text-secondary">Interviews <ArrowRight className="h-4 w-4" /></Button></Link>
        </div>
      </div>
    </section>
  );
}
