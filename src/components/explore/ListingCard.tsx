import { Link } from "react-router-dom";
import { MapPin, AlertTriangle } from "lucide-react";
import type { Lang } from "@/lib/academy";
import { catLabel, needsCoords, pick, placeLine, type Listing } from "@/lib/explore";

/** One card per listing; it always opens the listing's single canonical page. */
export function ListingCard({ l, lang, editor = false, extra }: { l: Listing; lang: Lang; editor?: boolean; extra?: string | null }) {
  return (
    <Link to={`/explore/place/${l.slug}${lang === "el" ? "?lang=el" : ""}`} className="group block border border-border bg-card p-4 hover:border-foreground transition-colors h-full">
      <p className="text-[10px] uppercase tracking-wider font-semibold text-secondary mb-1">{catLabel(l.category, lang)}</p>
      <h3 className="font-serif text-lg font-bold text-foreground group-hover:underline leading-snug">{pick(lang, l.name_en, l.name_el)}</h3>
      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><MapPin className="h-3 w-3" />{placeLine(l, lang)}</p>
      {extra && <p className="text-xs font-semibold text-foreground mt-1">{extra}</p>}
      <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{pick(lang, l.summary_en, l.summary_el)}</p>
      {editor && needsCoords(l) && (
        <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-destructive"><AlertTriangle className="h-3 w-3" />Editors: add verified coordinates</p>
      )}
    </Link>
  );
}
