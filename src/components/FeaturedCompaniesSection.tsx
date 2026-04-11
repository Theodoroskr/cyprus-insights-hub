import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Star, Globe, Linkedin, Building2, ArrowRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

const CITIES = ["Nicosia", "Limassol", "Larnaca", "Paphos", "Famagusta"];

interface FeaturedCompany {
  id: string;
  company_name: string;
  city: string;
  featured_city_rank: number | null;
  featured_reason: string | null;
  website: string | null;
  linkedin: string | null;
}

interface Props {
  compact?: boolean;
}

export function FeaturedCompaniesSection({ compact = false }: Props) {
  const [featured, setFeatured] = useState<FeaturedCompany[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("featured_companies")
      .select("*")
      .eq("is_featured", true)
      .order("featured_city_rank")
      .then(({ data }) => {
        setFeatured(data || []);
        setLoading(false);
      });
  }, []);

  const grouped = CITIES.reduce<Record<string, FeaturedCompany[]>>((acc, city) => {
    acc[city] = featured.filter((f) => f.city === city);
    return acc;
  }, {});

  if (loading || featured.length === 0) return null;

  return (
    <section className={compact ? "py-8" : "py-12"}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-secondary" />
            <h2 className={`font-serif font-bold text-foreground ${compact ? "text-lg" : "text-2xl"}`}>
              Featured Companies
            </h2>
          </div>
          {compact && (
            <Link to="/directory" className="text-sm text-secondary hover:underline flex items-center gap-1">
              View Directory <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        <Tabs defaultValue="Nicosia" className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap bg-muted/50 h-auto p-1 rounded-lg">
            {CITIES.map((city) => (
              <TabsTrigger
                key={city}
                value={city}
                className="text-sm px-4 py-2 data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground rounded-md whitespace-nowrap"
              >
                {city}
                <Badge variant="outline" className="ml-2 text-xs h-5 px-1.5">
                  {grouped[city]?.length || 0}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {CITIES.map((city) => (
            <TabsContent key={city} value={city} className="mt-4">
              {grouped[city]?.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No featured companies yet for {city}.</p>
              ) : (
                <div className={`grid gap-4 ${compact ? "md:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-2 lg:grid-cols-3"}`}>
                  {grouped[city]?.map((f, i) => (
                      <Link
                        key={f.id}
                        to={`/directory?q=${encodeURIComponent(f.company_name)}`}
                        className="border border-border rounded-lg p-5 bg-card hover:shadow-lg hover:border-secondary/30 transition-all relative overflow-hidden group cursor-pointer block"
                      >
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-secondary/10 text-secondary border-secondary/20 text-xs font-bold">
                            #{f.featured_city_rank || i + 1}
                          </Badge>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-secondary/20 transition-colors">
                            <Building2 className="h-5 w-5 text-secondary" />
                          </div>
                          <div className="flex-1 min-w-0 pr-8">
                            <h3 className="font-semibold text-foreground text-sm group-hover:text-secondary transition-colors">{f.company_name}</h3>
                            {f.featured_reason && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{f.featured_reason}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
                          {f.website && (
                            <a href={f.website} target="_blank" rel="noopener noreferrer" className="text-secondary text-xs flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <Globe className="h-3 w-3" /> Website
                            </a>
                          )}
                          {f.linkedin && (
                            <a href={f.linkedin} target="_blank" rel="noopener noreferrer" className="text-secondary text-xs flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <Linkedin className="h-3 w-3" /> LinkedIn
                            </a>
                          )}
                          {!f.website && !f.linkedin && (
                            <span className="text-xs text-muted-foreground">No links available</span>
                          )}
                          <span className="ml-auto text-xs text-secondary font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            View in Directory <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                      </Link>
                    ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
