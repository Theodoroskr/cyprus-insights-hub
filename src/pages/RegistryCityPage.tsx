import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Search, Building2, MapPin, Star, ChevronLeft, ChevronRight, Globe, Linkedin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";

const CITY_LABELS: Record<string, string> = {
  nicosia: "Nicosia",
  limassol: "Limassol",
  larnaca: "Larnaca",
  paphos: "Paphos",
  famagusta: "Famagusta",
};

const PAGE_SIZE = 25;

export default function RegistryCityPage() {
  const { citySlug } = useParams<{ citySlug: string }>();
  const [companies, setCompanies] = useState<any[]>([]);
  const [featured, setFeatured] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const cityLabel = CITY_LABELS[citySlug || ""] || citySlug;

  // Fetch featured
  useEffect(() => {
    if (!citySlug) return;
    const cityEnglish = CITY_LABELS[citySlug];
    if (cityEnglish) {
      supabase
        .from("featured_companies")
        .select("*")
        .eq("city", cityEnglish)
        .eq("is_featured", true)
        .order("featured_city_rank")
        .then(({ data }) => setFeatured(data || []));
    }
  }, [citySlug]);

  // Fetch companies
  useEffect(() => {
    if (!citySlug) return;
    setLoading(true);
    let query = supabase
      .from("directory_companies")
      .select("id, company_name, city, city_slug, activity_description, organisation_type, organisation_status", { count: "exact" })
      .eq("city_slug", citySlug);

    if (search) {
      query = query.or(`company_name.ilike.%${search}%,activity_description.ilike.%${search}%`);
    }
    if (statusFilter !== "all") {
      query = query.eq("organisation_status", statusFilter);
    }

    query
      .order("company_name")
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
      .then(({ data, count }) => {
        setCompanies(data || []);
        setTotal(count || 0);
        setLoading(false);
      });
  }, [citySlug, page, search, statusFilter]);

  useEffect(() => { setPage(0); }, [search, statusFilter]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-background select-none" onCopy={(e) => e.preventDefault()} onContextMenu={(e) => e.preventDefault()}>
      <SEOHead
        title={`Companies in ${cityLabel}, Cyprus`}
        description={`Browse ${total.toLocaleString()} registered companies in ${cityLabel}, Cyprus. Filter by industry and status.`}
        path={`/directory/${citySlug}`}
      />
      <TopNavigation onSearch={() => {}} />

      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link to="/directory" className="hover:text-secondary transition-colors">Directory</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">{cityLabel}</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground">{cityLabel}</h1>
          <p className="text-muted-foreground mt-1">{total.toLocaleString()} registered companies</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {featured.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-5 w-5 text-secondary" />
              <h2 className="text-lg font-serif font-bold text-foreground">Featured Companies</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featured.map((f) => (
                <div key={f.id} className="border-2 border-secondary/30 rounded-lg p-5 bg-secondary/5">
                  <h3 className="font-semibold text-foreground">{f.company_name}</h3>
                  {f.featured_reason && <p className="text-sm text-muted-foreground mt-1">{f.featured_reason}</p>}
                  <div className="flex items-center gap-3 mt-3">
                    {f.website && (
                      <a href={f.website} target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline text-xs flex items-center gap-1">
                        <Globe className="h-3 w-3" /> Website
                      </a>
                    )}
                    {f.linkedin && (
                      <a href={f.linkedin} target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline text-xs flex items-center gap-1">
                        <Linkedin className="h-3 w-3" /> LinkedIn
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 flex-shrink-0">
            <div className="sticky top-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter companies..." className="pl-10" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger><SelectValue placeholder="All Statuses" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Dissolved">Dissolved</SelectItem>
                    <SelectItem value="Reminder Letter Sent">Reminder Letter Sent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </aside>

          <main className="flex-1">
            <p className="text-sm text-muted-foreground mb-4">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total.toLocaleString()}
            </p>
            <div className="space-y-2">
              {companies.map((c) => (
                <Link
                  key={c.id}
                  to={`/directory/${c.id}`}
                  className="group flex items-center gap-4 p-4 border border-border rounded-lg bg-card hover:shadow-md hover:border-secondary/30 transition-all"
                >
                  <Building2 className="h-7 w-7 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground group-hover:text-secondary transition-colors text-sm">{c.company_name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{c.activity_description}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {c.organisation_status === "Active" && <Badge variant="outline" className="text-xs border-green-300 text-green-700">Active</Badge>}
                    {c.organisation_status === "Dissolved" && <Badge variant="outline" className="text-xs border-red-300 text-red-600">Dissolved</Badge>}
                    {c.organisation_type && <Badge variant="secondary" className="text-xs hidden md:inline-flex">{c.organisation_type}</Badge>}
                  </div>
                </Link>
              ))}
              {loading && <p className="text-center py-8 text-muted-foreground">Loading...</p>}
              {!loading && companies.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No companies found.</p>
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <span className="text-sm text-muted-foreground px-4">
                  Page {page + 1} of {totalPages.toLocaleString()}
                </span>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
