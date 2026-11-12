import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { ComplianceShell } from "@/components/compliance/ComplianceShell";
import { LanguageNote } from "@/components/compliance/ComplianceItemCard";
import { ct, DEADLINE_LABELS, DOC_TYPE_LABELS, formatDate, itemText, itemTitle, label, MEASURE_LABELS, PUBLIC_ITEM_COLUMNS, SECTOR_LABELS, TOPIC_LABELS, type ComplianceItem, type ComplianceRef } from "@/lib/compliance";
import type { Lang } from "@/lib/academy";
import NotFound from "./NotFound";

const UUID = /^[0-9a-f-]{36}$/i;

function Block({ title, item, field, lang }: { title: string; item: ComplianceItem; field: "summary" | "what_changed" | "action"; lang: Lang }) {
  const t = itemText(item, field, lang);
  if (!t.text) return null;
  return (
    <section className="mb-6">
      <h2 className="section-label text-foreground text-xs mb-2">{ct(title, lang)} <LanguageNote shownLang={t.shownLang} lang={lang} /></h2>
      <p className="text-[15px] leading-relaxed text-foreground font-serif">{t.text}</p>
    </section>
  );
}

export default function ComplianceItemPage() {
  const { slug = "" } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["compliance-item", slug],
    queryFn: async () => {
      const col = UUID.test(slug) ? "id" : "slug";
      const { data: item } = await supabase.from("compliance_items").select(PUBLIC_ITEM_COLUMNS).eq(col, slug).eq("status", "published").maybeSingle();
      if (!item) return null;
      const { data: refs } = await supabase.from("compliance_item_refs").select("*").eq("item_id", (item as any).id).order("published_at", { ascending: true });
      return { item: item as unknown as ComplianceItem, refs: (refs ?? []) as ComplianceRef[] };
    },
  });
  if (isLoading) return <div className="min-h-screen" />;
  if (!data) return <NotFound />;
  const { item, refs } = data;
  const dates: [string, string | null][] = [
    ["Source publication date", item.publication_date], ["Applies from", item.application_date], ["Effective", item.effective_date],
  ];

  return (
    <ComplianceShell title={item.authority}>
      {(lang) => (
        <article className="container mx-auto px-4 py-8 max-w-3xl">
          <SEOHead title={`${itemTitle(item, "en")} — ComplianceHub.cy`} description={(item.summary_en ?? item.official_title).slice(0, 158)} path={`/compliance/regulatory-updates/${item.slug}`} vertical="compliance" type="article"
            breadcrumbs={[{ name: "ComplianceHub", href: "/compliance" }, { name: "Regulatory Updates", href: "/compliance/regulatory-updates" }]} />
          <Link to="/compliance/regulatory-updates" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="h-3 w-3" />{ct("Back to Regulatory Updates", lang)}</Link>
          <div className="flex flex-wrap gap-1.5 items-center mb-3 text-[10px] uppercase tracking-wider">
            <span className="font-semibold text-secondary">{item.authority}</span>
            <Badge variant="outline" className="rounded-none text-[9px] uppercase tracking-wider">{label(DOC_TYPE_LABELS, item.document_type, lang)}</Badge>
            {item.official_id && <span className="text-muted-foreground normal-case">{item.official_id.replace(/^(CELEX:|post:|doc:)/, (m) => (m === "CELEX:" ? "CELEX " : ""))}</span>}
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground leading-tight mb-2">{itemTitle(item, lang)}</h1>
          <p className="text-xs text-muted-foreground mb-6"><span className="font-semibold">{ct("Official title", lang)}:</span> {item.official_title}</p>

          <div className="grid sm:grid-cols-3 gap-px bg-border border border-border mb-6">
            {dates.map(([l, d]) => (
              <div key={l} className="bg-card p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{ct(l, lang)}</p>
                <p className="text-sm font-semibold text-foreground">{d ? formatDate(d, lang) : "—"}</p>
              </div>
            ))}
          </div>
          {item.deadline_date && (
            <div className="border-l-4 border-secondary bg-muted/40 p-3 mb-6">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label(DEADLINE_LABELS, item.deadline_type ?? "other", lang)}</p>
              <p className="text-base font-bold text-foreground">{formatDate(item.deadline_date, lang)}</p>
              {item.deadline_note && <p className="text-xs text-muted-foreground mt-1">{item.deadline_note}</p>}
            </div>
          )}

          <Block title="Summary" item={item} field="summary" lang={lang} />
          <Block title="What changed" item={item} field="what_changed" lang={lang} />
          <Block title="Action or deadline stated by the source" item={item} field="action" lang={lang} />
          {!item.summary_en && !item.summary_el && <p className="text-sm text-muted-foreground mb-6">{ct("Summary not yet available — see the official document.", lang)}</p>}

          {(item.legal_act_ref || item.regime || item.measure_type || item.countries.length > 0) && (
            <dl className="grid sm:grid-cols-2 gap-3 text-sm mb-6 border border-border p-4">
              {item.legal_act_ref && <div><dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{ct("Legal act", lang)}</dt><dd>{item.legal_act_ref}</dd></div>}
              {item.regime && <div><dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{ct("Regime", lang)}</dt><dd>{item.regime}</dd></div>}
              {item.measure_type && <div><dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{ct("Measure", lang)}</dt><dd>{label(MEASURE_LABELS, item.measure_type, lang)}</dd></div>}
              {item.countries.length > 0 && <div><dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{ct("Country or territory", lang)}</dt><dd>{item.countries.join(", ")}</dd></div>}
            </dl>
          )}
          {item.audience && <p className="text-sm mb-4"><span className="section-label text-xs">{ct("Audience", lang)}:</span> {item.audience}</p>}
          {item.related_acts.length > 0 && <p className="text-sm mb-4"><span className="section-label text-xs">{ct("Related EU acts", lang)}:</span> {item.related_acts.join(", ")}</p>}

          {item.sectors.length > 0 && (
            <div className="mb-4"><h2 className="section-label text-xs mb-2">{ct("Affected sectors", lang)}</h2>
              <div className="flex flex-wrap gap-1.5">{item.sectors.map((s) => <Link key={s} to={`/compliance/regulatory-updates?sector=${s}`}><Badge variant="secondary" className="rounded-none font-normal">{label(SECTOR_LABELS, s, lang)}</Badge></Link>)}</div></div>
          )}
          {item.topics.length > 0 && (
            <div className="mb-6"><h2 className="section-label text-xs mb-2">{ct("Topics", lang)}</h2>
              <div className="flex flex-wrap gap-1.5">{item.topics.map((s) => <Link key={s} to={`/compliance/regulatory-updates?topic=${s}`}><Badge variant="outline" className="rounded-none font-normal">{label(TOPIC_LABELS, s, lang)}</Badge></Link>)}</div></div>
          )}

          <section className="border-t border-border pt-4">
            <h2 className="section-label text-xs mb-3">{ct("Official references", lang)}</h2>
            <ul className="space-y-2">
              <li><a href={item.canonical_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-secondary font-semibold hover:underline">{ct("Official document", lang)} ({item.authority}) <ExternalLink className="h-3.5 w-3.5" /></a></li>
              {refs.filter((r) => r.url !== item.canonical_url).map((r) => (
                <li key={r.id}><a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-secondary hover:underline">
                  {r.title ?? r.url} <span className="text-[10px] uppercase text-muted-foreground">{r.authority} · {r.language.toUpperCase()}</span> <ExternalLink className="h-3 w-3" />
                </a></li>
              ))}
            </ul>
          </section>
        </article>
      )}
    </ComplianceShell>
  );
}
