import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Scale, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cpiPath, fmtScore, homeSummary, rankLabel, yoy, type CpiEdition, type CpiResult, type Lang } from "@/lib/cpi";

/** Greece-homepage banner for the Corruption Perceptions Index; hidden until an edition is published. */
export function CpiGreeceCard({ lang }: { lang: Lang }) {
  const el = lang === "el";
  const { data } = useQuery({
    queryKey: ["cpi-home-card"],
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const [e, r] = await Promise.all([
        supabase.from("cpi_editions").select("*").order("edition_year", { ascending: false }).limit(3),
        supabase.from("cpi_results").select("*").in("country_iso3", ["CYP", "GRC"]),
      ]);
      const results = (r.data ?? []) as CpiResult[];
      const summary = homeSummary((e.data ?? []) as CpiEdition[], results);
      if (!summary?.greece || summary.greece.score == null) return null;
      return { ...summary, grChange: yoy(results, "GRC", summary.edition.edition_year) };
    },
  });
  if (!data) return null;
  const { edition, greece, cyprus, grChange } = data;
  const changeText = grChange == null ? null : grChange === 0
    ? (el ? "αμετάβλητη σε σχέση με πέρυσι" : "unchanged on last year")
    : `${grChange > 0 ? "+" : ""}${grChange} ${el ? "σε σχέση με πέρυσι" : "on last year"}`;
  return (
    <section className="mt-10">
      <div className="rounded-lg border border-border border-l-4 border-l-compliance bg-card p-6 flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex items-start gap-4 flex-1">
          <Scale className="h-8 w-8 text-compliance shrink-0 mt-1" />
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {el ? `Δείκτης Αντίληψης Διαφθοράς ${edition.edition_year}` : `Corruption Perceptions Index ${edition.edition_year}`}
            </p>
            <h2 className="font-serif text-2xl font-bold text-foreground mt-1" lang={lang}>
              {el
                ? `Η Ελλάδα σημειώνει ${fmtScore(greece.score, lang)}, ${rankLabel(greece, edition.countries_covered, lang)}`
                : `Greece scores ${fmtScore(greece.score, lang)}, ${rankLabel(greece, edition.countries_covered, lang)}`}
            </h2>
            <p className="text-sm text-muted-foreground mt-2" lang={lang}>
              {changeText && <>{changeText} · </>}
              {edition.eu_avg != null && <>{el ? "Μέσος όρος ΕΕ" : "EU average"} {edition.eu_avg}</>}
              {cyprus?.score != null && <> · {el ? "Κύπρος" : "Cyprus"} {cyprus.score}</>}
            </p>
            <p className="text-xs text-muted-foreground mt-2">{el ? "Πηγή" : "Source"}: Transparency International</p>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link to={cpiPath("greece", lang)} lang={lang}>
            {el ? "Δείτε τον πλήρη δείκτη" : "See the full index"} <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
