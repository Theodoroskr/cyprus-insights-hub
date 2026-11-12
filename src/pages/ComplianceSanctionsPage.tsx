import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { ComplianceShell } from "@/components/compliance/ComplianceShell";
import { ComplianceItemCard, itemHref } from "@/components/compliance/ComplianceItemCard";
import { FilterBar, uniqueOptions, useUrlFilters } from "@/components/compliance/FilterBar";
import { OFFICIAL_SANCTIONS_TOOLS } from "@/components/compliance/staticContent";
import { useComplianceItems } from "@/hooks/useComplianceItems";
import { ct, diffFatf, FATF_LABELS, filterItems, formatDate, itemTitle, label, MEASURE_LABELS, type ComplianceItem, type FatfListing } from "@/lib/compliance";
import type { Lang } from "@/lib/academy";
import { Link } from "react-router-dom";

const VIEWS = [
  { id: "eu", label: "EU Sanctions Updates" },
  { id: "cyprus", label: "Cyprus Sanctions Guidance" },
  { id: "fatf", label: "FATF Country Risk" },
  { id: "tools", label: "Official Lists & Tools" },
];

function EuView({ lang }: { lang: Lang }) {
  const { data = [], isLoading } = useComplianceItems("eu_sanctions");
  const { get, set } = useUrlFilters();
  const from = get("from"), to = get("to");
  const shown = filterItems(data, { q: get("q"), authority: get("source") }).filter((i) =>
    (!get("regime") || i.regime === get("regime")) && (!get("measure") || i.measure_type === get("measure")) &&
    (!get("country") || i.countries.includes(get("country"))) &&
    (!from || (i.publication_date ?? "") >= from) && (!to || (i.publication_date ?? "") <= to));
  return (
    <>
      <FilterBar lang={lang} keep={["view"]} filters={[
        { key: "regime", allLabel: "All regimes", options: uniqueOptions(data.map((i) => i.regime)) },
        { key: "country", allLabel: "All countries", options: uniqueOptions(data.flatMap((i) => i.countries)) },
        { key: "measure", allLabel: "All measure types", options: uniqueOptions(data.map((i) => i.measure_type), (v) => label(MEASURE_LABELS, v, lang)) },
        { key: "source", allLabel: "All sources", options: uniqueOptions(data.map((i) => i.authority)) },
      ]} extra={<>
        <label className="text-xs text-muted-foreground flex items-center gap-1">{ct("From", lang)}<Input type="date" value={from} onChange={(e) => set("from", e.target.value)} className="h-9 w-36 rounded-none" /></label>
        <label className="text-xs text-muted-foreground flex items-center gap-1">{ct("To", lang)}<Input type="date" value={to} onChange={(e) => set("to", e.target.value)} className="h-9 w-36 rounded-none" /></label>
      </>} />
      <div className="overflow-x-auto mt-4 border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground text-left">
            <tr><th className="p-2">{ct("Published", lang)}</th><th className="p-2">{ct("Legal act", lang)}</th><th className="p-2">{ct("Regime", lang)}</th><th className="p-2">{ct("Measure", lang)}</th><th className="p-2">{ct("Effective", lang)}</th><th className="p-2"></th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? <tr><td className="p-4 text-muted-foreground" colSpan={6}>…</td></tr> : shown.length === 0 ? <tr><td className="p-4 text-muted-foreground" colSpan={6}>{ct("Nothing matches these filters yet.", lang)}</td></tr> :
              shown.map((i) => (
                <tr key={i.id} className="align-top">
                  <td className="p-2 whitespace-nowrap">{formatDate(i.publication_date, lang)}</td>
                  <td className="p-2 min-w-[16rem]">
                    <Link to={itemHref(i)} className="font-semibold text-foreground hover:text-secondary">{itemTitle(i, lang)}</Link>
                    <p className="text-[11px] text-muted-foreground">{i.legal_act_ref ?? i.official_id}</p>
                  </td>
                  <td className="p-2">{i.regime ?? "—"}{i.countries.length > 0 && <p className="text-[11px] text-muted-foreground">{i.countries.join(", ")}</p>}</td>
                  <td className="p-2">{i.measure_type ? label(MEASURE_LABELS, i.measure_type, lang) : "—"}</td>
                  <td className="p-2 whitespace-nowrap">{formatDate(i.effective_date ?? i.application_date, lang) || "—"}</td>
                  <td className="p-2"><a href={i.canonical_url} target="_blank" rel="noopener noreferrer" aria-label={ct("Official document", lang)} className="text-secondary"><ExternalLink className="h-4 w-4" /></a></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function CyprusView({ lang }: { lang: Lang }) {
  const { data = [], isLoading } = useComplianceItems("cy_sanctions");
  const { get } = useUrlFilters();
  const shown: ComplianceItem[] = filterItems(data, { q: get("q"), docType: get("type") });
  return (
    <>
      <FilterBar lang={lang} keep={["view"]} filters={[]} />
      <div className="max-w-4xl mt-2">
        {isLoading ? <p className="py-6 text-sm text-muted-foreground">…</p> : shown.length ? shown.map((i) => (
          <div key={i.id}>
            <ComplianceItemCard item={i} lang={lang} />
            {(i.audience || i.related_acts.length > 0) && (
              <p className="text-xs text-muted-foreground -mt-2 pb-3">{i.audience && <>{ct("Audience", lang)}: {i.audience}. </>}{i.related_acts.length > 0 && <>{ct("Related EU acts", lang)}: {i.related_acts.join(", ")}</>}</p>
            )}
          </div>
        )) : <p className="py-6 text-sm text-muted-foreground">{ct("Nothing matches these filters yet.", lang)}</p>}
      </div>
    </>
  );
}

interface Release { id: string; release_date: string; label: string; call_for_action_url: string | null; increased_monitoring_url: string | null; stated_removals: string[]; listings: FatfListing[] }

function FatfView({ lang }: { lang: Lang }) {
  const { data: releases = [], isLoading } = useQuery({
    queryKey: ["fatf-releases"],
    queryFn: async () => {
      const { data } = await supabase.from("fatf_releases").select("id, release_date, label, call_for_action_url, increased_monitoring_url, stated_removals, fatf_listings(country_name, country_code, category)")
        .eq("status", "published").order("release_date", { ascending: false }).limit(12);
      return (data ?? []).map((r: any) => ({ ...r, listings: r.fatf_listings ?? [] })) as Release[];
    },
  });
  if (isLoading) return <p className="text-sm text-muted-foreground">…</p>;
  const [cur, prev] = releases;
  if (!cur) return <p className="text-sm text-muted-foreground">{ct("Nothing matches these filters yet.", lang)}</p>;
  const changes = prev ? diffFatf(cur.listings, prev.listings) : [];
  return (
    <div className="space-y-6">
      <p className="text-xs border-l-4 border-warning bg-muted/40 p-3 text-foreground">{ct("FATF status is shown separately from EU sanctions: a FATF listing is not a sanction.", lang)}</p>
      <div>
        <h2 className="font-serif text-xl font-bold">{ct("Release", lang)}: {cur.label} <span className="text-sm font-normal text-muted-foreground">({formatDate(cur.release_date, lang)})</span></h2>
        <div className="flex gap-3 text-xs mt-1">
          {cur.call_for_action_url && <a href={cur.call_for_action_url} target="_blank" rel="noopener noreferrer" className="text-secondary inline-flex items-center gap-1">FATF — High-risk jurisdictions <ExternalLink className="h-3 w-3" /></a>}
          {cur.increased_monitoring_url && <a href={cur.increased_monitoring_url} target="_blank" rel="noopener noreferrer" className="text-secondary inline-flex items-center gap-1">FATF — Increased monitoring <ExternalLink className="h-3 w-3" /></a>}
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {(["countermeasures", "enhanced_due_diligence", "increased_monitoring"] as const).map((cat) => {
          const list = cur.listings.filter((l) => l.category === cat).sort((a, b) => a.country_name.localeCompare(b.country_name));
          return (
            <div key={cat} className="border border-border p-4">
              <h3 className="section-label text-xs mb-2">{label(FATF_LABELS, cat, lang)} <span className="text-muted-foreground">({list.length})</span></h3>
              <ul className="text-sm space-y-0.5">{list.map((l) => <li key={l.country_name}>{l.country_name}</li>)}</ul>
            </div>
          );
        })}
      </div>
      {prev && (
        <div className="border border-border p-4">
          <h3 className="section-label text-xs mb-1">{ct("Compared with the previous verified release", lang)} ({prev.label})</h3>
          {changes.length === 0 ? <p className="text-sm text-muted-foreground">{ct("No change", lang)}</p> : (
            <ul className="text-sm space-y-1 mt-2">
              {changes.map((c) => (
                <li key={`${c.kind}-${c.name}`}>
                  <Badge variant="outline" className={`rounded-none text-[9px] uppercase mr-2 ${c.kind === "added" ? "border-destructive text-destructive" : c.kind === "removed" ? "border-success text-success" : ""}`}>
                    {ct(c.kind === "added" ? "Added" : c.kind === "removed" ? "Removed" : "Category changed", lang)}
                  </Badge>
                  {c.name}{c.kind === "moved" ? `: ${label(FATF_LABELS, c.from, lang)} → ${label(FATF_LABELS, c.to, lang)}` : c.kind === "added" ? ` — ${label(FATF_LABELS, c.to, lang)}` : ` — ${label(FATF_LABELS, c.from, lang)}`}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {releases.length > 1 && (
        <div>
          <h3 className="section-label text-xs mb-2">{ct("Earlier releases", lang)}</h3>
          <ul className="text-sm text-muted-foreground space-y-0.5">{releases.slice(1).map((r) => <li key={r.id}>{r.label} — {r.listings.length}</li>)}</ul>
        </div>
      )}
    </div>
  );
}

function ToolsView({ lang }: { lang: Lang }) {
  return (
    <div className="grid sm:grid-cols-2 gap-4 max-w-4xl">
      {OFFICIAL_SANCTIONS_TOOLS.map((t) => (
        <a key={t.url} href={t.url} target="_blank" rel="noopener noreferrer" className="border border-border p-4 hover:border-secondary/50 group">
          <div className="flex items-center justify-between"><h3 className="font-serif font-bold group-hover:text-secondary">{lang === "el" ? t.nameEl : t.name}</h3><ExternalLink className="h-3.5 w-3.5 text-muted-foreground" /></div>
          <p className="text-xs text-muted-foreground mt-1">{lang === "el" ? t.descriptionEl : t.description}</p>
        </a>
      ))}
    </div>
  );
}

export default function ComplianceSanctionsPage() {
  const [params, setParams] = useSearchParams();
  const view = VIEWS.some((v) => v.id === params.get("view")) ? params.get("view")! : "eu";
  return (
    <ComplianceShell title="Sanctions & Country Risk" intro="EU restrictive-measures acts, Cyprus NSIU guidance, the FATF lists and the official screening tools — kept separate so each status is clear.">
      {(lang) => (
        <section className="container mx-auto px-4 py-6">
          <SEOHead title="Sanctions & Country Risk — ComplianceHub.cy" description="EU sanctions updates from the Official Journal, Cyprus NSIU sanctions guidance, the latest FATF high-risk and increased-monitoring lists, and official screening tools." path="/compliance/sanctions" vertical="compliance" />
          <div role="tablist" className="flex flex-wrap gap-0 border border-border w-fit mb-6">
            {VIEWS.map((v) => (
              <button key={v.id} role="tab" aria-selected={view === v.id} onClick={() => setParams({ view: v.id }, { replace: true })}
                className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider ${view === v.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
                {ct(v.label, lang)}
              </button>
            ))}
          </div>
          {view === "eu" ? <EuView lang={lang} /> : view === "cyprus" ? <CyprusView lang={lang} /> : view === "fatf" ? <FatfView lang={lang} /> : <ToolsView lang={lang} />}
        </section>
      )}
    </ComplianceShell>
  );
}
