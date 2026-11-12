import { useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/SEOHead";
import { ComplianceShell } from "@/components/compliance/ComplianceShell";
import { itemHref } from "@/components/compliance/ComplianceItemCard";
import { FilterBar, uniqueOptions, useUrlFilters } from "@/components/compliance/FilterBar";
import { useComplianceItems } from "@/hooks/useComplianceItems";
import { ct, DEADLINE_LABELS, deadlineEntries, filterItems, formatDate, itemTitle, label, SECTOR_LABELS, type DeadlineEntry } from "@/lib/compliance";
import type { Lang } from "@/lib/academy";

const iso = (d: Date) => d.toISOString().slice(0, 10);

function Row({ e, lang }: { e: DeadlineEntry; lang: Lang }) {
  const i = e.item;
  return (
    <li className="py-3 grid sm:grid-cols-[8rem_1fr] gap-2 sm:gap-4">
      <div>
        <p className="text-sm font-bold text-foreground">{formatDate(e.date, lang)}</p>
        <Badge variant="outline" className="rounded-none text-[9px] uppercase tracking-wider mt-1">{label(DEADLINE_LABELS, e.type, lang)}</Badge>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-secondary font-semibold">{i.authority}{i.official_id && !/^(post|doc):/.test(i.official_id) ? ` · ${i.official_id.replace(/^CELEX:/, "CELEX ")}` : ""}</p>
        <Link to={itemHref(i)} className="font-serif font-semibold text-foreground hover:text-secondary leading-snug">{itemTitle(i, lang)}</Link>
        {i.deadline_note && e.kind === "deadline" && <p className="text-xs text-muted-foreground mt-0.5">{i.deadline_note}</p>}
        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
          {i.sectors.slice(0, 3).map((s) => <Badge key={s} variant="secondary" className="rounded-none text-[10px] font-normal">{label(SECTOR_LABELS, s, lang)}</Badge>)}
          <a href={i.canonical_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-secondary hover:underline">{ct("Official document", lang)} <ExternalLink className="h-3 w-3" /></a>
        </div>
      </div>
    </li>
  );
}

export default function ComplianceDeadlinesPage() {
  const { data = [], isLoading } = useComplianceItems();
  const { get } = useUrlFilters();
  const [showPast, setShowPast] = useState(false);
  const today = iso(new Date());
  const items = filterItems(data, { q: get("q"), authority: get("authority"), sector: get("sector") });
  const filterType = (e: DeadlineEntry) => !get("type") || e.type === get("type");
  const upcoming = deadlineEntries(items, today).filter(filterType);
  const past = deadlineEntries(items, iso(new Date(Date.now() - 90 * 864e5))).filter((e) => e.date < today).filter(filterType).reverse();
  const allEntries = deadlineEntries(data, "0000");

  const byMonth = new Map<string, DeadlineEntry[]>();
  for (const e of upcoming) { const k = e.date.slice(0, 7); byMonth.set(k, [...(byMonth.get(k) ?? []), e]); }

  return (
    <ComplianceShell title="Deadlines & Consultations" intro="Consultation closing dates, filing deadlines and application dates confirmed from the official documents.">
      {(lang) => (
        <section className="container mx-auto px-4 py-6">
          <SEOHead title="Deadlines & Consultations — ComplianceHub.cy" description="Upcoming Cyprus and EU compliance deadlines: consultation closures, regulatory filing dates and application dates, each linked to the official source." path="/compliance/deadlines" vertical="compliance" />
          <FilterBar lang={lang} filters={[
            { key: "type", allLabel: "All deadline types", options: uniqueOptions(allEntries.map((e) => e.type), (v) => label(DEADLINE_LABELS, v, lang)) },
            { key: "authority", allLabel: "All authorities", options: uniqueOptions(data.map((i) => i.authority)) },
            { key: "sector", allLabel: "All sectors", options: uniqueOptions(data.flatMap((i) => i.sectors), (v) => label(SECTOR_LABELS, v, lang)) },
          ]} />
          <div className="max-w-4xl mt-4">
            {isLoading ? <p className="text-sm text-muted-foreground py-6">…</p> : upcoming.length === 0 ? <p className="text-sm text-muted-foreground py-6">{ct("No upcoming deadlines have been confirmed yet.", lang)}</p> :
              [...byMonth].map(([m, list]) => (
                <div key={m} className="mb-6">
                  <h2 className="section-label text-xs border-b border-foreground pb-1">{new Date(`${m}-15T12:00:00Z`).toLocaleDateString(lang === "el" ? "el-GR" : "en-GB", { month: "long", year: "numeric" })}</h2>
                  <ul className="divide-y divide-border">{list.map((e) => <Row key={`${e.item.id}-${e.kind}`} e={e} lang={lang} />)}</ul>
                </div>
              ))}
            {past.length > 0 && (
              <div className="mt-8">
                <button onClick={() => setShowPast((v) => !v)} className="section-label text-xs text-muted-foreground hover:text-foreground">{ct("Recently passed", lang)} ({past.length}) {showPast ? "−" : "+"}</button>
                {showPast && <ul className="divide-y divide-border opacity-70">{past.map((e) => <Row key={`${e.item.id}-${e.kind}`} e={e} lang={lang} />)}</ul>}
              </div>
            )}
          </div>
        </section>
      )}
    </ComplianceShell>
  );
}
