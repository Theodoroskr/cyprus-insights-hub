import { Link } from "react-router-dom";
import { CalendarClock, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDeadline, formatEur, INSTRUMENTS, lbl, SECTORS, type Lang } from "@/lib/funding";

export interface CallCardData {
  slug: string | null; title_en: string; title_el?: string | null; issuer: string; programme?: string | null;
  eligibility_summary?: string | null; instrument_type: string; sectors: string[] | null; deadline_date: string | null;
  deadline_time?: string | null; application_url?: string | null; official_url: string; total_budget_eur?: number | null; call_reference?: string | null;
}

export function FundingCard({ c, lang, preview = false }: { c: CallCardData; lang: Lang; preview?: boolean }) {
  const title = lang === "el" && c.title_el ? c.title_el : c.title_en;
  const budget = formatEur(c.total_budget_eur);
  return (
    <article className="border border-border bg-card rounded-lg p-5 flex flex-col gap-3 h-full">
      <div className="flex flex-wrap gap-1.5">
        <Badge className="bg-secondary text-secondary-foreground">{lbl(INSTRUMENTS, c.instrument_type, lang)}</Badge>
        {(c.sectors ?? []).filter((s) => s !== "other").slice(0, 2).map((s) => <Badge key={s} variant="outline">{lbl(SECTORS, s, lang)}</Badge>)}
      </div>
      <h3 className="font-serif text-lg font-bold leading-snug text-foreground">
        {c.slug ? <Link to={`/funding/${c.slug}`} className="hover:text-secondary">{title}</Link> : title}
      </h3>
      <p className="text-sm text-muted-foreground">{c.issuer}{c.programme ? ` · ${c.programme}` : ""}{c.call_reference ? ` · ${c.call_reference}` : ""}</p>
      {c.eligibility_summary && <p className="text-sm text-foreground/90 line-clamp-3">{c.eligibility_summary}</p>}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
          <CalendarClock className="h-4 w-4 text-secondary" />{formatDeadline(c.deadline_date, c.deadline_time, lang)}
        </span>
        {budget && !preview && <span className="text-sm text-muted-foreground">{lang === "el" ? "Προϋπολογισμός" : "Budget"} {budget}</span>}
        <a href={c.application_url || c.official_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-secondary hover:underline">
          {lang === "el" ? "Επίσημη αίτηση" : "Official application"} <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </article>
  );
}
