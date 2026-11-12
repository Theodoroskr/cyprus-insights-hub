import { SEOHead } from "@/components/SEOHead";
import { ComplianceShell } from "@/components/compliance/ComplianceShell";
import { ComplianceItemCard } from "@/components/compliance/ComplianceItemCard";
import { FilterBar, uniqueOptions, useUrlFilters } from "@/components/compliance/FilterBar";
import { useComplianceItems } from "@/hooks/useComplianceItems";
import { ct, DOC_TYPE_LABELS, filterItems, JURISDICTION_LABELS, label, SECTOR_LABELS, TOPIC_LABELS } from "@/lib/compliance";

export default function ComplianceUpdatesPage() {
  const { data = [], isLoading } = useComplianceItems("updates");
  const { get } = useUrlFilters();
  const shown = filterItems(data, { q: get("q"), authority: get("authority"), jurisdiction: get("jurisdiction"), sector: get("sector"), topic: get("topic"), docType: get("type") });
  return (
    <ComplianceShell title="Regulatory Updates" intro="Circulars, guidance, consultations and new rules from Cypriot and EU authorities, summarised and linked to the official source.">
      {(lang) => (
        <>
          <SEOHead title="Regulatory Updates — ComplianceHub.cy" description="Latest CySEC, Central Bank of Cyprus, AMLA and EU regulatory updates for Cyprus firms, with plain-language summaries and links to the official documents." path="/compliance/regulatory-updates" vertical="compliance" />
          <section className="container mx-auto px-4 py-6">
            <FilterBar lang={lang} filters={[
              { key: "authority", allLabel: "All authorities", options: uniqueOptions(data.map((i) => i.authority)) },
              { key: "jurisdiction", allLabel: "All jurisdictions", options: uniqueOptions(data.map((i) => i.jurisdiction), (v) => label(JURISDICTION_LABELS, v, lang)) },
              { key: "sector", allLabel: "All sectors", options: uniqueOptions(data.flatMap((i) => i.sectors), (v) => label(SECTOR_LABELS, v, lang)) },
              { key: "topic", allLabel: "All topics", options: uniqueOptions(data.flatMap((i) => i.topics), (v) => label(TOPIC_LABELS, v, lang)) },
              { key: "type", allLabel: "All document types", options: uniqueOptions(data.map((i) => i.document_type), (v) => label(DOC_TYPE_LABELS, v, lang)) },
            ]} />
            <p className="text-xs text-muted-foreground mt-3">{shown.length} / {data.length}</p>
            <div className="max-w-4xl mt-2">
              {isLoading ? <p className="py-8 text-sm text-muted-foreground">…</p> : shown.length ? shown.map((i) => <ComplianceItemCard key={i.id} item={i} lang={lang} />) : <p className="py-8 text-sm text-muted-foreground">{ct("Nothing matches these filters yet.", lang)}</p>}
            </div>
          </section>
        </>
      )}
    </ComplianceShell>
  );
}
