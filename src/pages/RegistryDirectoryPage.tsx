import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Search, Building2, MapPin, Star, ArrowRight, Factory } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FeaturedCompaniesSection } from "@/components/FeaturedCompaniesSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";

const CITY_META: Record<string, { label: string }> = {
  nicosia: { label: "Nicosia" },
  limassol: { label: "Limassol" },
  larnaca: { label: "Larnaca" },
  paphos: { label: "Paphos" },
  famagusta: { label: "Famagusta" },
};

const MAIN_SLUGS = ["nicosia", "limassol", "larnaca", "paphos", "famagusta"];

const INDUSTRY_FILTERS: { code: string; label: string }[] = [
  { code: "47", label: "Retail Trade" },
  { code: "70", label: "Management Consulting" },
  { code: "46", label: "Wholesale Trade" },
  { code: "43", label: "Construction" },
  { code: "56", label: "Food & Beverage" },
  { code: "62", label: "IT & Software" },
  { code: "41", label: "Building Development" },
  { code: "64", label: "Financial Services" },
  { code: "86", label: "Healthcare" },
  { code: "69", label: "Legal & Accounting" },
  { code: "68", label: "Real Estate" },
  { code: "71", label: "Architecture & Engineering" },
  { code: "85", label: "Education" },
  { code: "96", label: "Personal Services" },
  { code: "45", label: "Motor Vehicles" },
];

export default function RegistryDirectoryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [cityCounts, setCityCounts] = useState<Record<string, number>>({});
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [filterResults, setFilterResults] = useState<any[] | null>(null);
  const [filterLoading, setFilterLoading] = useState(false);

  useEffect(() => {
    const fetchCounts = async () => {
      const counts: Record<string, number> = {};
      await Promise.all(
        MAIN_SLUGS.map(async (slug) => {
          const { count } = await supabase
            .from("directory_companies")
            .select("id", { count: "exact", head: true })
            .eq("city_slug", slug);
          counts[slug] = count || 0;
        })
      );
      setCityCounts(counts);
      setTotalCompanies(Object.values(counts).reduce((a, b) => a + b, 0));
    };
    fetchCounts();
  }, []);

  // Auto-search if ?q= param is present
  useEffect(() => {
    const q = searchParams.get("q");
    if (q && q.trim()) {
      setSearch(q);
      const doSearch = async () => {
        setSearching(true);
        setSelectedIndustry(null);
        setSelectedCity(null);
        setFilterResults(null);
        const term = `%${q.trim()}%`;
        const { data } = await supabase
          .from("directory_companies")
          .select("id, company_name, city, city_slug, activity_description, organisation_type")
          .or(`company_name.ilike.${term},activity_description.ilike.${term},city.ilike.${term}`)
          .limit(50);
        setSearchResults(data || []);
        setSearching(false);
      };
      doSearch();
    }
  }, [searchParams]);

  // Run combined filter whenever city or industry changes
  const runFilter = async (city: string | null, industry: string | null) => {
    if (!city && !industry) {
      setFilterResults(null);
      return;
    }
    setFilterLoading(true);
    setSearchResults(null);
    setSearch("");
    let query = supabase
      .from("directory_companies")
      .select("id, company_name, city, city_slug, activity_description, nace_code")
      .order("company_name")
      .limit(50);
    if (city) query = query.eq("city_slug", city);
    if (industry) query = query.like("nace_code", `${industry}%`);
    const { data } = await query;
    setFilterResults(data || []);
    setFilterLoading(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    setSearching(true);
    setSelectedIndustry(null);
    setSelectedCity(null);
    setFilterResults(null);
    const term = `%${search.trim()}%`;
    const { data } = await supabase
      .from("directory_companies")
      .select("id, company_name, city, city_slug, activity_description, organisation_type")
      .or(`company_name.ilike.${term},activity_description.ilike.${term},city.ilike.${term}`)
      .limit(50);
    setSearchResults(data || []);
    setSearching(false);
  };

  const handleCityClick = (slug: string) => {
    const next = selectedCity === slug ? null : slug;
    setSelectedCity(next);
    runFilter(next, selectedIndustry);
  };

  const handleIndustryClick = (code: string) => {
    const next = selectedIndustry === code ? null : code;
    setSelectedIndustry(next);
    runFilter(selectedCity, next);
  };

  const showingResults = searchResults !== null || filterResults !== null;
  const resultsToShow = searchResults || filterResults || [];

  const buildLabel = () => {
    if (searchResults) return `${searchResults.length} results for "${search}"`;
    const parts: string[] = [];
    if (selectedIndustry) parts.push(INDUSTRY_FILTERS.find(i => i.code === selectedIndustry)?.label || "");
    if (selectedCity) parts.push(`in ${CITY_META[selectedCity]?.label || selectedCity}`);
    return `${filterResults?.length || 0} ${parts.length ? parts.join(" ") : ""} companies`;
  };
  const resultsLabel = buildLabel();

  return (
    <div className="min-h-screen bg-background select-none" onCopy={(e) => e.preventDefault()} onContextMenu={(e) => e.preventDefault()}>
      <SEOHead
        title="Cyprus Company Registry Directory"
        description={`Search ${totalCompanies.toLocaleString()}+ registered companies in Cyprus by city, industry, and name. Official registry data.`}
        path="/directory"
      />
      <TopNavigation onSearch={() => {}} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary via-primary/95 to-primary/85 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24 text-center">
          <Badge className="bg-white/15 text-white border-white/20 mb-4 text-sm px-4 py-1.5 rounded-full">
            <Building2 className="h-3.5 w-3.5 mr-1.5" />
            60,000+ Registered Companies
          </Badge>
          <h1 className="text-3xl md:text-5xl font-serif font-bold mb-4">Cyprus Company Directory</h1>
          <p className="text-white/70 max-w-xl mx-auto mb-8">
            Search the most comprehensive database of registered companies in Cyprus.
          </p>
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => { setSearch(e.target.value); if (!e.target.value) { setSearchResults(null); } }}
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
        {/* Combined Filter Bar */}
        <div className="mb-8 space-y-4">
          <div>
            <h2 className="text-lg font-serif font-bold text-foreground mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-secondary" />
              Browse by City
            </h2>
            <div className="flex flex-wrap gap-2">
              {MAIN_SLUGS.map((slug) => {
                const meta = CITY_META[slug];
                const count = cityCounts[slug] || 0;
                return (
                  <button
                    key={slug}
                    onClick={() => handleCityClick(slug)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                      selectedCity === slug
                        ? "bg-secondary text-secondary-foreground border-secondary"
                        : "border-border bg-card hover:bg-secondary/10 hover:border-secondary/40 text-foreground"
                    }`}
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="font-medium text-sm">{meta.label}</span>
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 rounded-full">
                      {count.toLocaleString()}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-serif font-bold text-foreground mb-3 flex items-center gap-2">
              <Factory className="h-4 w-4 text-secondary" />
              Filter by Industry
            </h2>
            <div className="flex flex-wrap gap-2">
              {INDUSTRY_FILTERS.map((ind) => (
                <button
                  key={ind.code}
                  onClick={() => handleIndustryClick(ind.code)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-sm transition-all ${
                    selectedIndustry === ind.code
                      ? "bg-secondary text-secondary-foreground border-secondary"
                      : "border-border bg-card hover:bg-secondary/10 hover:border-secondary/40 text-foreground"
                  }`}
                >
                  {ind.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active filter summary */}
          {(selectedCity || selectedIndustry) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
              <span>Showing:</span>
              {selectedIndustry && (
                <Badge variant="outline" className="gap-1">
                  {INDUSTRY_FILTERS.find(i => i.code === selectedIndustry)?.label}
                  <button onClick={() => handleIndustryClick(selectedIndustry)} className="ml-1 hover:text-destructive">×</button>
                </Badge>
              )}
              {selectedCity && (
                <Badge variant="outline" className="gap-1">
                  {CITY_META[selectedCity]?.label}
                  <button onClick={() => handleCityClick(selectedCity)} className="ml-1 hover:text-destructive">×</button>
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Results (search or filter) */}
        {showingResults ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-serif font-bold text-foreground">
                {filterLoading ? "Loading..." : resultsLabel}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => { setSearchResults(null); setFilterResults(null); setSearch(""); setSelectedIndustry(null); setSelectedCity(null); }}>
                Clear
              </Button>
            </div>
            <div className="space-y-2">
              {resultsToShow.map((c) => (
                <Link
                  key={c.id}
                  to={`/directory/${c.id}`}
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
              {resultsToShow.length === 0 && !filterLoading && (
                <div className="text-center py-16 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No companies found.</p>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Featured Companies */}
        <FeaturedCompaniesSection />
      </div>

      <Footer />
    </div>
  );
}
