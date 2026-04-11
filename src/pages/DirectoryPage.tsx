import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  Search, Building2, ArrowRight, MapPin, Users, BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DirectoryPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [industries, setIndustries] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"companies" | "people">("companies");

  useEffect(() => {
    Promise.all([
      supabase.from("companies").select("id, name, slug, logo, description, size, industry:industries(name), location:locations(name)").order("name"),
      supabase.from("people").select("id, name, slug, photo, title, is_whoiswho").eq("is_whoiswho", true).order("name"),
      supabase.from("industries").select("id, name, slug").order("name"),
    ]).then(([c, p, ind]) => {
      if (c.data) setCompanies(c.data);
      if (p.data) setPeople(p.data);
      if (ind.data) setIndustries(ind.data);
    });
  }, []);

  const filteredCompanies = companies.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPeople = people.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation onSearch={(q) => setSearch(q)} />

      {/* Hero */}
      <section className="bg-primary py-14 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-3 font-serif">
            Business Directory
          </h1>
          <p className="text-base md:text-lg text-primary-foreground/80 max-w-2xl mx-auto mb-6">
            The definitive directory of Cyprus's companies, leaders, and professionals.
          </p>
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search companies or people…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-background/95 border-border/50 h-11"
            />
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="py-5 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setActiveTab("companies")}
              className={`px-5 py-2 rounded-full text-sm font-medium border transition-colors flex items-center gap-2 ${
                activeTab === "companies"
                  ? "bg-secondary text-secondary-foreground border-secondary"
                  : "bg-transparent text-muted-foreground border-border hover:border-secondary/40"
              }`}
            >
              <Building2 className="h-4 w-4" /> Companies ({filteredCompanies.length})
            </button>
            <button
              onClick={() => setActiveTab("people")}
              className={`px-5 py-2 rounded-full text-sm font-medium border transition-colors flex items-center gap-2 ${
                activeTab === "people"
                  ? "bg-secondary text-secondary-foreground border-secondary"
                  : "bg-transparent text-muted-foreground border-border hover:border-secondary/40"
              }`}
            >
              <Users className="h-4 w-4" /> People ({filteredPeople.length})
            </button>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-10 md:py-14">
        <div className="container mx-auto px-4">
          {activeTab === "companies" && (
            <>
              {filteredCompanies.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-muted-foreground">No companies found.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCompanies.map((c) => (
                    <Link
                      key={c.id}
                      to={`/companies/${c.slug}`}
                      className="group border border-border rounded-lg p-5 hover:shadow-lg hover:border-secondary/30 transition-all bg-card"
                    >
                      <div className="flex items-start gap-4">
                        <img src={c.logo || "/placeholder.svg"} alt={c.name} className="w-14 h-14 rounded-lg object-cover border border-border flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground group-hover:text-secondary transition-colors truncate">{c.name}</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            {(c as any).industry?.name && <span>{(c as any).industry.name}</span>}
                            {(c as any).location?.name && (
                              <>
                                <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/40" />
                                <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{(c as any).location.name}</span>
                              </>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{c.description}</p>
                        </div>
                      </div>
                      {c.size && <Badge variant="outline" className="mt-3 text-xs">{c.size} employees</Badge>}
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === "people" && (
            <>
              {filteredPeople.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-muted-foreground">No people found.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {filteredPeople.map((p) => (
                    <Link
                      key={p.id}
                      to={`/whoiswho/${p.slug}`}
                      className="group border border-border rounded-xl overflow-hidden hover:shadow-lg hover:border-secondary/30 transition-all bg-card"
                    >
                      <div className="relative h-48 overflow-hidden">
                        <img src={p.photo || "/placeholder.svg"} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-4 right-4">
                          <h3 className="text-lg font-serif font-bold text-white">{p.name}</h3>
                          <p className="text-white/80 text-xs line-clamp-1">{p.title}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Industries */}
      {activeTab === "companies" && industries.length > 0 && (
        <section className="border-t border-border bg-muted/20">
          <div className="container mx-auto px-4 py-12">
            <h2 className="text-xl font-serif font-bold text-foreground mb-6">Browse by Industry</h2>
            <div className="flex flex-wrap gap-2">
              {industries.map((ind) => (
                <Link key={ind.id} to={`/industries/${ind.slug}`}>
                  <Badge variant="outline" className="px-4 py-2 text-sm hover:bg-secondary/10 hover:border-secondary/30 transition-colors cursor-pointer">
                    {ind.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
