import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, Building2, MapPin, Users, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";

export default function CompanyDirectoryPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [industries, setIndustries] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [sizeFilter, setSizeFilter] = useState("all");

  useEffect(() => {
    Promise.all([
      supabase.from("companies").select("*, industry:industries(id, name, slug), location:locations(id, name, slug)").order("name"),
      supabase.from("industries").select("*").order("name"),
      supabase.from("locations").select("*").order("name"),
    ]).then(([c, i, l]) => {
      if (c.data) setCompanies(c.data);
      if (i.data) setIndustries(i.data);
      if (l.data) setLocations(l.data);
    });
  }, []);

  const filtered = useMemo(() => {
    return companies.filter((c) => {
      const matchesSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase());
      const matchesIndustry = industryFilter === "all" || c.industry_id === industryFilter;
      const matchesLocation = locationFilter === "all" || c.location_id === locationFilter;
      const matchesSize = sizeFilter === "all" || c.size === sizeFilter;
      return matchesSearch && matchesIndustry && matchesLocation && matchesSize;
    });
  }, [companies, search, industryFilter, locationFilter, sizeFilter]);

  const hasFilters = industryFilter !== "all" || locationFilter !== "all" || sizeFilter !== "all" || search;

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation onSearch={() => {}} />

      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-10">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">Business Directory</h1>
          <p className="text-muted-foreground mt-2">Browse and discover companies across Cyprus</p>
          <div className="relative max-w-xl mt-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search companies..." className="pl-11 h-12 rounded-lg" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="sticky top-4 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground flex items-center gap-2"><Filter className="h-4 w-4" /> Filters</h3>
                {hasFilters && (
                  <Button variant="ghost" size="sm" onClick={() => { setIndustryFilter("all"); setLocationFilter("all"); setSizeFilter("all"); setSearch(""); }} className="text-xs text-muted-foreground">
                    <X className="h-3 w-3 mr-1" /> Clear
                  </Button>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Industry</label>
                <Select value={industryFilter} onValueChange={setIndustryFilter}>
                  <SelectTrigger><SelectValue placeholder="All Industries" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Industries</SelectItem>
                    {industries.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Location</label>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger><SelectValue placeholder="All Locations" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Company Size</label>
                <Select value={sizeFilter} onValueChange={setSizeFilter}>
                  <SelectTrigger><SelectValue placeholder="All Sizes" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sizes</SelectItem>
                    <SelectItem value="1-49">1-49</SelectItem>
                    <SelectItem value="50-199">50-199</SelectItem>
                    <SelectItem value="200-499">200-499</SelectItem>
                    <SelectItem value="500-999">500-999</SelectItem>
                    <SelectItem value="1000+">1000+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </aside>

          {/* Main List */}
          <main className="flex-1">
            <p className="text-sm text-muted-foreground mb-4">{filtered.length} companies found</p>
            <div className="space-y-3">
              {filtered.map((c) => (
                <Link key={c.id} to={`/companies/${c.slug}`} className="group flex items-center gap-5 p-5 border border-border rounded-lg bg-card hover:shadow-md hover:border-secondary/30 transition-all">
                  <img src={c.logo || "/placeholder.svg"} alt={c.name} className="w-16 h-16 rounded-lg object-cover border border-border flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-foreground group-hover:text-secondary transition-colors">{c.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{c.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      {(c as any).industry && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{(c as any).industry.name}</span>}
                      {(c as any).location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{(c as any).location.name}</span>}
                      {c.size && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{c.size}</span>}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="flex-shrink-0">View Profile</Button>
                </Link>
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No companies found matching your criteria.</p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
