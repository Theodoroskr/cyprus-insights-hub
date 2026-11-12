import { Link } from "react-router-dom";
import { ExternalLink, CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Lang } from "@/lib/academy";
import { ct, DEADLINE_LABELS, DOC_TYPE_LABELS, formatDate, itemText, itemTitle, label, SECTOR_LABELS, type ComplianceItem } from "@/lib/compliance";

export function itemHref(i: Pick<ComplianceItem, "slug" | "id">) {
  return `/compliance/regulatory-updates/${encodeURIComponent(i.slug ?? i.id)}`;
}

export function LanguageNote({ shownLang, lang }: { shownLang: Lang | null; lang: Lang }) {
  if (!shownLang || shownLang === lang) return null;
  return <span className="text-[10px] uppercase tracking-wider text-muted-foreground border border-border px-1.5 py-0.5 ml-1">{ct(shownLang === "en" ? "Summary in English" : "Summary in Greek", lang)}</span>;
}

export function ComplianceItemCard({ item, lang, compact }: { item: ComplianceItem; lang: Lang; compact?: boolean }) {
  const s = itemText(item, "summary", lang);
  return (
    <article className="py-4 border-b border-border last:border-b-0">
      <div className="flex flex-wrap items-center gap-1.5 mb-1.5 text-[10px] uppercase tracking-wider">
        <span className="font-semibold text-secondary">{item.authority}</span>
        <span className="text-muted-foreground">·</span>
        <Badge variant="outline" className="rounded-none text-[9px] uppercase tracking-wider">{label(DOC_TYPE_LABELS, item.document_type, lang)}</Badge>
        {item.publication_date && <span className="text-muted-foreground">{ct("Published", lang)} {formatDate(item.publication_date, lang)}</span>}
        {item.deadline_date && <span className="text-foreground font-semibold">· {ct("Deadline", lang)} {formatDate(item.deadline_date, lang)}</span>}
      </div>
      <h3 className={`font-serif font-bold text-foreground leading-snug ${compact ? "text-sm" : "text-base"}`}>
        <Link to={itemHref(item)} className="hover:text-secondary transition-colors">{itemTitle(item, lang)}</Link>
      </h3>
      {!compact && (
        <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
          {s.text ?? ct("Summary not yet available — see the official document.", lang)}
          <LanguageNote shownLang={s.shownLang} lang={lang} />
        </p>
      )}
      <div className="flex flex-wrap items-center gap-1.5 mt-2">
        {!compact && item.sectors.slice(0, 3).map((x) => <Badge key={x} variant="secondary" className="rounded-none text-[10px] font-normal">{label(SECTOR_LABELS, x, lang)}</Badge>)}
        <a href={item.canonical_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-secondary hover:underline ml-auto">
          {ct("Official document", lang)} <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </article>
  );
}

export function DeadlineRow({ item, date, type, lang }: { item: ComplianceItem; date: string; type: string; lang: Lang }) {
  return (
    <li className="py-3 flex gap-3">
      <div className="w-16 shrink-0 text-center border border-border py-1">
        <CalendarClock className="h-3.5 w-3.5 mx-auto text-secondary" />
        <span className="block text-[11px] font-bold text-foreground leading-tight mt-0.5">{formatDate(date, lang)}</span>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label(DEADLINE_LABELS, type, lang)} · {item.authority}</p>
        <Link to={itemHref(item)} className="text-sm font-semibold text-foreground hover:text-secondary leading-snug line-clamp-2">{itemTitle(item, lang)}</Link>
      </div>
    </li>
  );
}
