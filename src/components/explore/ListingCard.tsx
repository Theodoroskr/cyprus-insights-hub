import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import type { Lang } from "@/lib/academy";
import { catLabel, pick, type Listing } from "@/lib/explore";

export function ListingCard({ l, lang }: { l: Listing; lang: Lang }) {
  return (
    <Link to={`/explore/place/${l.slug}`} className="group block border border-border bg-card p-4 hover:border-foreground transition-colors h-full">
      <p className="text-[10px] uppercase tracking-wider font-semibold text-secondary mb-1">{catLabel(l.category, lang)}</p>
      <h3 className="font-serif text-lg font-bold text-foreground group-hover:underline leading-snug">{pick(lang, l.name_en, l.name_el)}</h3>
      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><MapPin className="h-3 w-3" />{[l.locality, l.district].filter((x, i, a) => x && a.indexOf(x) === i).join(", ")}</p>
      <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{pick(lang, l.summary_en, l.summary_el)}</p>
    </Link>
  );
}
