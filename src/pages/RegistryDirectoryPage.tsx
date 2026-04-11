import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Building2, MapPin, Star, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";

const CITY_META: Record<string, { label: string; lat: number; lng: number }> = {
  nicosia: { label: "Nicosia (Λευκωσία)", lat: 35.1856, lng: 33.3823 },
  limassol: { label: "Limassol (Λεμεσός)", lat: 34.6786, lng: 33.0413 },
  larnaca: { label: "Larnaca (Λάρνακα)", lat: 34.9229, lng: 33.6233 },
  paphos: { label: "Paphos (Πάφος)", lat: 34.7754, lng: 32.4218 },
  famagusta: { label: "Famagusta (Αμμόχωστος)", lat: 35.1174, lng: 33.9413 },
};

const MAIN_SLUGS = ["nicosia", "limassol", "larnaca", "paphos", "famagusta"];

export default function RegistryDirectoryPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [cityCounts, setCityCounts] = useState<Record<string, number>>({});
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    supabase
      .from("directory_companies")
      .select("city_slug", { count: "exact", head: false })
      .in("city_slug", MAIN_SLUGS)
      .then(({ data }) => {
        if (!data) return;
        const counts: Record<string, number> = {};
        data.forEach((r: any) => {
          counts[r.city_slug] = (counts[r.city_slug] || 0) + 1;
        });
        setCityCounts(counts);
        setTotalCompanies(Object.values(counts).reduce((a, b) => a + b, 0));
      });
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    setSearching(true);
    const term = `%${search.trim()}%`;
    const { data } = await supabase
      .from("directory_companies")
      .select("id, company_name, city, city_slug, activity_description, organisation_type")
      .or(`company_name.ilike.${term},activity_description.ilike.${term},city.ilike.${term}`)
      .limit(50);
    setSearchResults(data || []);
    setSearching(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation onSearch={() => {}} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary via-primary/95 to-primary/85 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24 text-center">
          <Badge className="bg-white/15 text-white border-white/20 mb-4 text-sm px-4 py-1.5 rounded-full">
            <Building2 className="h-3.5 w-3.5 mr-1.5" />
            {totalCompanies.toLocaleString()}+ Registered Companies
          </Badge>
          <h1 className="text-3xl md:text-5xl font-serif font-bold mb-4">Cyprus Company Registry</h1>
          <p className="text-white/70 max-w-xl mx-auto mb-8">
            Search the most comprehensive database of registered companies in Cyprus.
          </p>
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => { setSearch(e.target.value); if (!e.target.value) setSearchResults(null); }}
                placeholder="Search by company name, activity, or city..."
                className="pl-14 pr-32 h-14 text-base bg-white text-foreground border-0 rounded-full shadow-2xl"
              />
              <Button type="submit" disabled={searching} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-6 h-10 bg-secondary text-secondary-foreground hover:bg-secondary/90">
                {searching ? "..." : "Search"}
              </Button>
            </div>
          </form>
        </div>
      </section>

      <div className="container mx-auto px-4 py-10">
        {/* Search Results */}
        {searchResults !== null ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-serif font-bold text-foreground">
                {searchResults.length} results for "{search}"
              </h2>
              <Button variant="ghost" size="sm" onClick={() => { setSearchResults(null); setSearch(""); }}>
                Clear search
              </Button>
            </div>
            <div className="space-y-2">
              {searchResults.map((c) => (
                <Link
                  key={c.id}
                  to={`/registry/${c.id}`}
                  className="group flex items-center gap-4 p-4 border border-border rounded-lg bg-card hover:shadow-md hover:border-secondary/30 transition-all"
                >
                  <Building2 className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground group-hover:text-secondary transition-colors">{c.company_name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">{c.activity_description}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
                    {c.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.city}</span>}
                  </div>
                </Link>
              ))}
              {searchResults.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No companies found. Try a different search term.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* City Grid */
          <div>
            <h2 className="text-2xl font-serif font-bold text-foreground mb-2">Browse by City</h2>
            <p className="text-muted-foreground mb-8">Select a city to explore its registered companies</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {MAIN_SLUGS.map((slug) => {
                const meta = CITY_META[slug];
                const count = cityCounts[slug] || 0;
                return (
                  <Link
                    key={slug}
                    to={`/registry/city/${slug}`}
                    className="group relative border border-border rounded-xl p-8 bg-card hover:shadow-xl hover:border-secondary/40 transition-all overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-secondary/10 transition-colors" />
                    <MapPin className="h-8 w-8 text-secondary mb-4" />
                    <h3 className="text-xl font-serif font-bold text-foreground group-hover:text-secondary transition-colors">
                      {meta.label}
                    </h3>
                    <p className="text-3xl font-bold text-secondary mt-2">{count.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">registered companies</p>
                    <div className="flex items-center gap-1 mt-4 text-sm text-secondary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Browse companies <ArrowRight className="h-4 w-4" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
