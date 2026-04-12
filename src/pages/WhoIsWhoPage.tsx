import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";

export default function WhoIsWhoPage() {
  const [people, setPeople] = useState<any[]>([]);
  const [relationships, setRelationships] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIndustry, setActiveIndustry] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("people").select("*").eq("is_whoiswho", true).order("name").then(({ data }) => {
      if (data) setPeople(data);
    });
    supabase.from("relationships").select("person_id, role, company_id, companies(name, industry_id, industries(name))").eq("is_current", true).then(({ data }) => {
      if (data) setRelationships(data);
    });
  }, []);

  const industryMap = useMemo(() => {
    const map: Record<string, string> = {};
    relationships.forEach((r: any) => {
      const industryName = r.companies?.industries?.name;
      if (industryName && r.person_id) {
        map[r.person_id] = industryName;
      }
    });
    return map;
  }, [relationships]);

  const companyMap = useMemo(() => {
    const map: Record<string, string> = {};
    relationships.forEach((r: any) => {
      if (r.companies?.name && r.person_id) {
        map[r.person_id] = r.companies.name;
      }
    });
    return map;
  }, [relationships]);

  const industries = useMemo(() => {
    const set = new Set<string>();
    Object.values(industryMap).forEach((v) => set.add(v));
    return Array.from(set).sort();
  }, [industryMap]);

  const filtered = useMemo(() => {
    return people.filter((p) => {
      const matchesSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (companyMap[p.id] || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesIndustry = !activeIndustry || industryMap[p.id] === activeIndustry;
      return matchesSearch && matchesIndustry;
    });
  }, [people, searchQuery, activeIndustry, industryMap, companyMap]);

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation onSearch={() => {}} />

      <div className="bg-gradient-to-br from-primary to-primary/90 text-white">
        <div className="container mx-auto px-4 py-16 text-center">
          <BookOpen className="h-10 w-10 mx-auto mb-4 text-secondary" />
          <h1 className="text-4xl font-serif font-bold mb-3">Who's Who</h1>
          <p className="text-white/70 max-w-2xl mx-auto text-lg">Premium editorial profiles of Cyprus' most influential business leaders, executives, and market figures.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, title, or company…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Industry Filter Chips */}
        {industries.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setActiveIndustry(null)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                !activeIndustry
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/40"
              }`}
            >
              <Filter className="h-3 w-3" />
              All
            </button>
            {industries.map((ind) => (
              <button
                key={ind}
                onClick={() => setActiveIndustry(activeIndustry === ind ? null : ind)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  activeIndustry === ind
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary/40"
                }`}
              >
                {ind}
              </button>
            ))}
          </div>
        )}

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-6">
          {filtered.length} {filtered.length === 1 ? "profile" : "profiles"} found
        </p>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p) => (
            <Link key={p.id} to={`/whoiswho/${p.slug}`} className="group border border-border rounded-xl overflow-hidden hover:shadow-xl transition-all bg-card">
              <div className="relative h-56 overflow-hidden">
                <img src={p.photo || "/placeholder.svg"} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl font-serif font-bold text-white">{p.name}</h3>
                  <p className="text-white/80 text-sm">{p.title}</p>
                </div>
              </div>
              <div className="p-5">
                {companyMap[p.id] && (
                  <Badge variant="outline" className="mb-2 text-xs">{companyMap[p.id]}</Badge>
                )}
                <p className="text-sm text-muted-foreground line-clamp-3">{p.bio}</p>
                {p.whoiswho_quote && (
                  <blockquote className="border-l-2 border-secondary pl-3 mt-3 text-xs italic text-foreground/70 line-clamp-2">
                    "{p.whoiswho_quote}"
                  </blockquote>
                )}
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">No profiles match your search.</p>
            <button onClick={() => { setSearchQuery(""); setActiveIndustry(null); }} className="mt-3 text-sm text-secondary hover:underline">
              Clear filters
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
