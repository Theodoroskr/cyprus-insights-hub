import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Scale, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cpiPath, fmtScore, homeSummary, rankLabel, type CpiEdition, type CpiResult } from "@/lib/cpi";

export function CpiHomeCard() {
  const { data } = useQuery({
    queryKey: ["cpi-home-card"],
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const [e, r] = await Promise.all([
        supabase.from("cpi_editions").select("*").order("edition_year", { ascending: false }).limit(3),
        supabase.from("cpi_results").select("*").in("country_iso3", ["CYP", "GRC"]),
      ]);
      return homeSummary((e.data ?? []) as CpiEdition[], (r.data ?? []) as CpiResult[]);
    },
  });
  if (!data) return null;
  const { edition, cyprus, greece, change } = data;
  const changeText = change == null ? null : change === 0 ? "unchanged on last year" : `${change > 0 ? "+" : ""}${change} on last year`;
  return (
    <section className="container mx-auto px-4 py-8">
      <div className="rounded-lg border border-border border-l-4 border-l-compliance bg-card p-6 flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex items-start gap-4 flex-1">
          <Scale className="h-8 w-8 text-compliance shrink-0 mt-1" />
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Corruption Perceptions Index {edition.edition_year}</p>
            <h2 className="font-serif text-2xl font-bold text-foreground mt-1">
              Cyprus scores {fmtScore(cyprus.score)}, {rankLabel(cyprus, edition.countries_covered)}
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              {changeText && <>{changeText} · </>}
              {edition.eu_avg != null && <>EU average {edition.eu_avg}</>}
              {greece?.score != null && <> · Greece {greece.score}</>}
            </p>
            <p className="text-xs text-muted-foreground mt-2">Source: Transparency International</p>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link to={cpiPath("cyprus")}>See the full index <ArrowRight className="h-4 w-4 ml-1" /></Link>
        </Button>
      </div>
    </section>
  );
}
