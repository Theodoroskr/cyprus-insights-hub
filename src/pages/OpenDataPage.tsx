import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Database, ExternalLink, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function OpenDataPage() {
  const { data: sources = [], isLoading } = useQuery({
    queryKey: ["open-data-public"],
    queryFn: async () => (await supabase.from("open_data_sources").select("*").eq("enabled", true).order("module").order("title_en")).data ?? [],
  });

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation onSearch={() => {}} />
      <SEOHead title="Cyprus Open Data Sources | BusinessHub" description="The official Cyprus government and regulator datasets behind BusinessHub's real estate, tourism, trade and directory intelligence." path="/open-data" />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Database className="h-4 w-4" /> Open Data · Ανοικτά Δεδομένα</div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold">Official data sources</h1>
          <p className="text-muted-foreground max-w-3xl">Every figure on our intelligence dashboards comes from an official Cyprus source. Here is what we use, how often we check it and where to find the original.</p>
        </header>
        {isLoading ? <p className="text-muted-foreground">Loading…</p> : (
          <div className="grid md:grid-cols-2 gap-4">
            {sources.map((s) => (
              <Card key={s.id}>
                <CardContent className="p-5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-semibold">{s.title_en}</h2>
                      {s.title_el && <p className="text-xs italic text-muted-foreground">{s.title_el}</p>}
                    </div>
                    {s.format && <Badge variant="secondary" className="shrink-0">{s.format}</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{s.publisher}{s.licence ? ` · ${s.licence}` : ""} · checked {s.check_frequency}</p>
                  {s.latest_period && <p className="text-sm">Latest period: <strong>{new Date(s.latest_period).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</strong></p>}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {s.dashboard_path && <Button asChild size="sm"><Link to={s.dashboard_path}>Open dashboard <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link></Button>}
                    {(s.portal_url || s.upstream_url) && (
                      <Button asChild size="sm" variant="outline">
                        <a href={s.portal_url ?? s.upstream_url!} target="_blank" rel="noopener noreferrer">Official source <ExternalLink className="h-3.5 w-3.5 ml-1" /></a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
