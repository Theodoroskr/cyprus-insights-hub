import { Link } from "react-router-dom";
import { BadgeCheck, Building2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Lang } from "@/lib/academy";
import { type Announcement, CY_TAG_LABEL, STAGE_LABEL, TYPE_LABEL, announcementDate, fmtDate, formatDealAmount, label, t } from "@/lib/announcements";

export function AnnouncementCard({ a, lang, compact = false }: { a: Announcement; lang: Lang; compact?: boolean }) {
  const href = `/company-announcements/${a.slug}`;
  const isDeal = a.section === "deals";
  return (
    <article className="group border border-border rounded-xl bg-card p-5 hover:border-secondary/50 hover:shadow-md transition-all">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
        <Badge variant="secondary" className="font-medium">{label(TYPE_LABEL, a.announcement_type, lang)}</Badge>
        {isDeal && a.deal_stage && <Badge variant="outline">{label(STAGE_LABEL, a.deal_stage, lang)}</Badge>}
        <time dateTime={announcementDate(a)}>{fmtDate(announcementDate(a), lang)}</time>
        {a.primary_verified && <span className="inline-flex items-center gap-1 text-secondary"><BadgeCheck className="h-3.5 w-3.5" />{t("verified", lang)}</span>}
      </div>
      <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
        <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        {a.company_name}
      </p>
      <h3 className="font-serif text-lg font-bold leading-snug mt-1">
        <Link to={href} className="text-foreground group-hover:text-secondary transition-colors">{a.title}</Link>
      </h3>
      {!compact && a.summary && <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{a.summary}</p>}
      {isDeal && (
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <dt className="text-muted-foreground">{t("amount", lang)}</dt><dd className="font-medium text-foreground">{formatDealAmount(a.amount, a.currency, lang)}</dd>
          {a.investors.length > 0 && <><dt className="text-muted-foreground">{t("investors", lang)}</dt><dd className="text-foreground line-clamp-1">{a.investors.join(", ")}</dd></>}
          {a.buyer && <><dt className="text-muted-foreground">{t("buyer", lang)}</dt><dd className="text-foreground">{a.buyer}</dd></>}
          {a.cyprus_location && <><dt className="text-muted-foreground">{t("location", lang)}</dt><dd className="text-foreground">{a.cyprus_location}</dd></>}
        </dl>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {a.cyprus_tags.map((tag) => <Badge key={tag} variant="outline" className="text-[10px]">{label(CY_TAG_LABEL, tag, lang)}</Badge>)}
        {a.sector && <Badge variant="outline" className="text-[10px]">{a.sector}</Badge>}
        {a.primary_source_url && (
          <a href={a.primary_source_url} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-secondary">
            {t("source", lang)} <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </article>
  );
}
