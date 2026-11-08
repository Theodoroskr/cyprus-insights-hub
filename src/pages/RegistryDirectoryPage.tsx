import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, Building2, MapPin, Factory, ShieldCheck, ChevronLeft, ChevronRight, Hash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FeaturedCompaniesSection } from "@/components/FeaturedCompaniesSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import {
  DIRECTORY_PAGE_SIZE,
  companyCardBadges,
  pageCount,
  pageRange,
  parseRegistrationNumber,
  safeSearchTerm,
  visiblePages,
  type CompanyBadge,
} from "@/lib/directorySearch";

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

type Reg = { cysec: boolean; cbc: boolean; icpac: boolean; bar: boolean; cifa: boolean };
type Query =
  | { kind: "search"; q: string; aliasIds: string[] }
  | { kind: "filter"; city: string | null; industry: string | null; reg: Reg };

const CARD_FIELDS =
  "id, slug, company_name, city, activity_description, organisation_status, registration_no, cysec_licensed, cysec_status, cbc_supervised, cbc_status, icpac_registered, bar_member, cifa_member";

const BADGE_TONE: Record<CompanyBadge["tone"], string> = {
  regulated: "border-secondary/40 bg-secondary/10 text-secondary",
  member: "border-primary/30 bg-primary/5 text-primary",
  status: "border-border bg-muted text-muted-foreground",
  former: "border-destructive/30 bg-destructive/5 text-destructive",
};

export default function RegistryDirectoryPage() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [cityCounts, setCityCounts] = useState<Record<string, number>>({});
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [regFilters, setRegFilters] = useState<Reg>({ cysec: false, cbc: false, icpac: false, bar: false, cifa: false });
  const [query, setQuery] = useState<Query | null>(null);
  const [page, setPage] = useState(1);
  const [results, setResults] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

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

  // Load the current page whenever the query or page changes
  useEffect(() => {
    if (!query) { setResults([]); setTotal(0); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [from, to] = pageRange(page);
      let q = supabase.from("directory_companies").select(CARD_FIELDS, { count: "exact" });
      if (query.kind === "search") {
        const term = `%${query.q}%`;
        const ors = [`company_name.ilike.${term}`, `activity_description.ilike.${term}`, `city.ilike.${term}`];
        const regNo = parseRegistrationNumber(query.q);
        if (regNo) ors.push(`registration_no.eq.${regNo}`);
        if (query.aliasIds.length) ors.push(`id.in.(${query.aliasIds.join(",")})`);
        q = q.or(ors.join(","));
      } else {
        if (query.city) q = q.eq("city_slug", query.city);
        if (query.industry) q = q.like("nace_code", `${query.industry}%`);
        if (query.reg.cysec) q = q.eq("cysec_licensed", true);
        if (query.reg.cbc) q = q.eq("cbc_supervised", true);
        if (query.reg.icpac) q = q.eq("icpac_registered", true);
        if (query.reg.bar) q = q.eq("bar_member", true);
        if (query.reg.cifa) q = q.eq("cifa_member", true);
      }
      const { data, count } = await q.order("company_name").order("id").range(from, to);
      if (cancelled) return;
      setResults(data || []);
      setTotal(count || 0);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [query, page]);

  const startSearch = async (raw: string) => {
    const q = safeSearchTerm(raw);
    if (!q) return;
    setSelectedIndustry(null);
    setSelectedCity(null);
    setLoading(true);
    // Trading names, former names and brand aliases (e.g. "Hellenic Bank", "eToro")
    const { data: aliases } = await supabase
      .from("company_aliases")
      .select("directory_company_id")
      .ilike("alias", `%${q}%`)
      .limit(50);
    const aliasIds = [...new Set((aliases || []).map((a) => a.directory_company_id))];
    setPage(1);
    setQuery({ kind: "search", q, aliasIds });
  };

  // Auto-search if ?q= param is present
  useEffect(() => {
    const q = searchParams.get("q");
    if (q && q.trim()) {
      setSearch(q);
      startSearch(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const runFilter = (city: string | null, industry: string | null, reg: Reg) => {
    setSearch("");
    setPage(1);
    const hasReg = Object.values(reg).some(Boolean);
    setQuery(city || industry || hasReg ? { kind: "filter", city, industry, reg } : null);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    startSearch(search);
  };

  const handleCityClick = (slug: string) => {
    const next = selectedCity === slug ? null : slug;
    setSelectedCity(next);
    runFilter(next, selectedIndustry, regFilters);
  };

  const handleIndustryClick = (code: string) => {
    const next = selectedIndustry === code ? null : code;
    setSelectedIndustry(next);
    runFilter(selectedCity, next, regFilters);
  };

  const handleRegFilterClick = (key: keyof Reg) => {
    const next = { ...regFilters, [key]: !regFilters[key] };
    setRegFilters(next);
    runFilter(selectedCity, selectedIndustry, next);
  };

  const clearAll = () => {
    setQuery(null);
    setSearch("");
    setSelectedIndustry(null);
    setSelectedCity(null);
    setRegFilters({ cysec: false, cbc: false, icpac: false, bar: false, cifa: false });
    setPage(1);
  };

  const goToPage = (p: number) => {
    setPage(p);
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const totalPages = pageCount(total);
  const showingResults = query !== null;

  const buildLabel = () => {
    const n = total.toLocaleString();
    if (query?.kind === "search") return `${n} ${total === 1 ? "result" : "results"} for "${query.q}"`;
    const parts: string[] = [];
    if (selectedIndustry) parts.push(INDUSTRY_FILTERS.find(i => i.code === selectedIndustry)?.label || "");
    if (selectedCity) parts.push(`in ${CITY_META[selectedCity]?.label || selectedCity}`);
    return `${n} ${parts.length ? parts.join(" ") + " " : ""}${total === 1 ? "company" : "companies"}`;
  };
  const resultsLabel = buildLabel();

  return (
    <div className="min-h-screen bg-background select-none" onCopy={(e) => e.preventDefault()} onContextMenu={(e) => e.preventDefault()}>
      <SEOHead
        title="Cyprus Company Registry Directory"
        description={`Search ${totalCompanies.toLocaleString()}+ registered companies in Cyprus by city, industry, and name. Official registry data.`}
        path="/directory"
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Directory", href: "/directory" },
        ]}
      />
      <TopNavigation onSearch={() => {}} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary via-primary/95 to-primary/85 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24 text-center">
          <Badge className="bg-white/15 text-white border-white/20 mb-4 text-sm px-4 py-1.5 rounded-full">
            <Building2 className="h-3.5 w-3.5 mr-1.5" />
            {totalCompanies > 0 ? `${(Math.floor(totalCompanies / 1000) * 1000).toLocaleString()}+` : "54,000+"} Registered Companies
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
                onChange={(e) => { setSearch(e.target.value); if (!e.target.value && query?.kind === "search") { setQuery(null); } }}
                placeholder="Company name, trading name, registration no. (e.g. HE 6771)…"
                className="pl-14 pr-32 h-14 text-base bg-white text-foreground border-0 rounded-full shadow-2xl"
              />
              <Button type="submit" disabled={loading} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-6 h-10 bg-secondary text-secondary-foreground hover:bg-secondary/90">
                {loading && query?.kind === "search" ? "..." : "Search"}
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

          {/* Regulatory Filters */}
          <div>
            <h2 className="text-lg font-serif font-bold text-foreground mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-secondary" />
              Regulatory Status
            </h2>
            <div className="flex flex-wrap gap-2">
              {[
                { key: "cysec" as const, label: "CySEC Licensed" },
                { key: "cbc" as const, label: "CBC Supervised" },
                { key: "icpac" as const, label: "ICPAC Registered" },
                { key: "bar" as const, label: "Bar Association" },
                { key: "cifa" as const, label: "CIFA Member" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => handleRegFilterClick(f.key)}
                  className={`text-[11px] px-3 py-1.5 border font-semibold uppercase tracking-wider transition-colors ${
                    regFilters[f.key]
                      ? "border-secondary bg-secondary/10 text-secondary"
                      : "border-border text-muted-foreground hover:border-secondary/50"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

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
          <div ref={resultsRef} className="scroll-mt-24">
            <div className="flex items-center justify-between mb-6 gap-4">
              <div>
                <h2 className="text-xl font-serif font-bold text-foreground">
                  {loading && results.length === 0 ? "Loading..." : resultsLabel}
                </h2>
                {total > DIRECTORY_PAGE_SIZE && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Showing {(pageRange(page)[0] + 1).toLocaleString()}–{Math.min(pageRange(page)[1] + 1, total).toLocaleString()} · Page {page} of {totalPages.toLocaleString()}
                  </p>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={clearAll}>Clear</Button>
            </div>
            <div className={`space-y-2 transition-opacity ${loading ? "opacity-50" : ""}`}>
              {results.map((c) => {
                const badges = companyCardBadges(c);
                return (
                  <Link
                    key={c.id}
                    to={`/directory/company/${c.slug || c.id}`}
                    className="group flex items-center gap-4 p-4 border border-border rounded-lg bg-card hover:shadow-md hover:border-secondary/30 transition-all"
                  >
                    <Building2 className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground group-hover:text-secondary transition-colors">{c.company_name}</h3>
                      {c.activity_description && <p className="text-sm text-muted-foreground line-clamp-1">{c.activity_description}</p>}
                      {badges.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {badges.map((b) => (
                            <span key={b.key} className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 border rounded ${BADGE_TONE[b.tone]}`}>
                              {b.tone === "regulated" && <ShieldCheck className="h-3 w-3" />}
                              {b.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="hidden sm:flex flex-col items-end gap-1 text-xs text-muted-foreground flex-shrink-0">
                      {c.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.city}</span>}
                      {c.registration_no && <span className="flex items-center gap-1"><Hash className="h-3 w-3" />HE {c.registration_no}</span>}
                    </div>
                  </Link>
                );
              })}
              {results.length === 0 && !loading && (
                <div className="text-center py-16 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No companies found.</p>
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <nav aria-label="Results pages" className="flex items-center justify-center gap-1 mt-8 flex-wrap">
                <Button variant="outline" size="sm" disabled={page === 1 || loading} onClick={() => goToPage(page - 1)} aria-label="Previous page">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {visiblePages(page, totalPages).map((p, i) =>
                  p === null ? (
                    <span key={`gap-${i}`} className="px-2 text-muted-foreground">…</span>
                  ) : (
                    <Button
                      key={p}
                      variant={p === page ? "default" : "outline"}
                      size="sm"
                      disabled={loading}
                      onClick={() => goToPage(p)}
                      aria-current={p === page ? "page" : undefined}
                      className="min-w-9"
                    >
                      {p.toLocaleString()}
                    </Button>
                  )
                )}
                <Button variant="outline" size="sm" disabled={page === totalPages || loading} onClick={() => goToPage(page + 1)} aria-label="Next page">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </nav>
            )}
          </div>
        ) : null}

        {/* Featured Companies */}
        <FeaturedCompaniesSection />
      </div>

      <Footer />
    </div>
  );
}
