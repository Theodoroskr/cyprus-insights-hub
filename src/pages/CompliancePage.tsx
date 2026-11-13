import { Link } from "react-router-dom";
import { ArrowRight, AlertTriangle, Gavel, ExternalLink, CalendarClock } from "lucide-react";
import { HubNewsBlock } from "@/components/HubNewsBlock";
import { Card, CardContent } from "@/components/ui/card";
import { CountryRiskTable } from "@/components/compliance/CountryRiskTable";
import { Badge } from "@/components/ui/badge";
import { OperationaliseBanner } from "@/components/banners/OperationaliseBanner";
import { PremiumCTABanner } from "@/components/banners/PremiumCTABanner";
import { ComplianceShell } from "@/components/compliance/ComplianceShell";
import { HubLeadStories } from "@/components/hub/HubLeadStories";

import { ComplianceItemCard, DeadlineRow } from "@/components/compliance/ComplianceItemCard";
import { complianceAreas, regulatoryLinks, FRAMEWORKS_REVIEWED_AT, type FrameworkAccent } from "@/components/compliance/staticContent";

const FW_STYLE: Record<FrameworkAccent, { bar: string; tint: string; iconBg: string; text: string }> = {
  aml: { bar: "bg-fw-aml", tint: "hover:bg-fw-aml/5", iconBg: "bg-fw-aml/10", text: "text-fw-aml" },
  gdpr: { bar: "bg-fw-gdpr", tint: "hover:bg-fw-gdpr/5", iconBg: "bg-fw-gdpr/10", text: "text-fw-gdpr" },
  mifid: { bar: "bg-fw-mifid", tint: "hover:bg-fw-mifid/5", iconBg: "bg-fw-mifid/10", text: "text-fw-mifid" },
  tax: { bar: "bg-fw-tax", tint: "hover:bg-fw-tax/5", iconBg: "bg-fw-tax/10", text: "text-fw-tax" },
  dora: { bar: "bg-fw-dora", tint: "hover:bg-fw-dora/5", iconBg: "bg-fw-dora/10", text: "text-fw-dora" },
  mica: { bar: "bg-fw-mica", tint: "hover:bg-fw-mica/5", iconBg: "bg-fw-mica/10", text: "text-fw-mica" },
  nis2: { bar: "bg-fw-nis2", tint: "hover:bg-fw-nis2/5", iconBg: "bg-fw-nis2/10", text: "text-fw-nis2" },
  ai: { bar: "bg-fw-ai", tint: "hover:bg-fw-ai/5", iconBg: "bg-fw-ai/10", text: "text-fw-ai" },
};
import { useComplianceItems } from "@/hooks/useComplianceItems";
import { ct, deadlineEntries, formatDate } from "@/lib/compliance";
import type { Lang } from "@/lib/academy";

const COMPLIANCE_V = ["compliance"];
const today = () => new Date().toISOString().slice(0, 10);

function Column({ title, to, lang, children }: { title: string; to: string; lang: Lang; children: React.ReactNode }) {
  return (
    <div className="border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="section-label text-foreground text-sm">{ct(title, lang)}</h2>
        <Link to={to} className="text-[10px] uppercase tracking-wider text-secondary font-semibold inline-flex items-center gap-1">{ct("View all", lang)} <ArrowRight className="h-3 w-3" /></Link>
      </div>
      {children}
    </div>
  );
}

const Empty = ({ text }: { text: string }) => <p className="text-sm text-muted-foreground py-6">{text}</p>;

export default function CompliancePage() {
  const { data: items = [], isLoading } = useComplianceItems();
  const sanctions = items.filter((i) => i.sections.includes("eu_sanctions") || i.sections.includes("cy_sanctions")).slice(0, 5);
  // a record can sit in several sections; on the overview show it once
  const updates = items.filter((i) => i.sections.includes("updates") && !sanctions.some((s) => s.id === i.id)).slice(0, 5);
  const deadlines = deadlineEntries(items, today()).slice(0, 6);

  return (
    <ComplianceShell masthead title="ComplianceHub.cy" intro="Official regulatory updates, sanctions changes, FATF country risk and upcoming deadlines for Cyprus — each linked to the original document.">
      {(lang) => (
        <>
          <HubLeadStories verticals={COMPLIANCE_V} />
          <section className="container mx-auto px-4 py-8 grid lg:grid-cols-3 gap-4">
            <Column title="Latest regulatory updates" to="/compliance/regulatory-updates" lang={lang}>
              {isLoading ? <Empty text="…" /> : updates.length ? updates.map((i) => <ComplianceItemCard key={i.id} item={i} lang={lang} compact />) : <Empty text={ct("Nothing matches these filters yet.", lang)} />}
            </Column>
            <Column title="Recent sanctions changes" to="/compliance/sanctions" lang={lang}>
              {isLoading ? <Empty text="…" /> : sanctions.length ? sanctions.map((i) => <ComplianceItemCard key={i.id} item={i} lang={lang} compact />) : <Empty text={ct("Nothing matches these filters yet.", lang)} />}
            </Column>
            <Column title="Upcoming deadlines" to="/compliance/deadlines" lang={lang}>
              {isLoading ? <Empty text="…" /> : deadlines.length ? (
                <ul className="divide-y divide-border">
                  {deadlines.map((d) => <DeadlineRow key={`${d.item.id}-${d.kind}`} item={d.item} date={d.date} type={d.type} lang={lang} />)}
                </ul>
              ) : <Empty text={ct("No upcoming deadlines have been confirmed yet.", lang)} />}
            </Column>
          </section>


          <section className="section-rule">
            <div className="container mx-auto px-4 pb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="section-label text-foreground text-sm">Basel AML Country Risk Index</h2>
                <Badge variant="outline" className="gap-1 rounded-none text-[10px] uppercase tracking-wider"><AlertTriangle className="h-3 w-3" /> 25 Countries</Badge>
              </div>
              <CountryRiskTable />
              <p className="text-xs text-muted-foreground mt-3">
                {lang === "el" ? "Για τις επίσημες λίστες της FATF δείτε " : "For the official FATF lists see "}
                <Link to="/compliance/sanctions?view=fatf" className="text-secondary underline">{ct("FATF Country Risk", lang)}</Link>.
              </p>
            </div>
          </section>

          <section id="aml" className="section-rule bg-muted/30">
            <div className="container mx-auto px-4 pb-8">
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-6">
                <h2 className="section-label text-foreground text-sm">{lang === "el" ? "Ρυθμιστικά Πλαίσια" : "Regulatory Frameworks"}</h2>
                <p className="text-[11px] text-muted-foreground">{lang === "el" ? "Τελευταίος έλεγχος" : "Last reviewed"} {formatDate(FRAMEWORKS_REVIEWED_AT, lang)}</p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {complianceAreas.map((area) => {
                  const c = FW_STYLE[area.accent];
                  return (
                    <a key={area.name} href={area.sourceUrl} target="_blank" rel="noopener noreferrer"
                      className={`group relative flex flex-col h-full overflow-hidden border border-border bg-card ${c.tint} transition-all duration-200 hover:-translate-y-1 hover:shadow-lg`}>
                      <span className={`absolute inset-x-0 top-0 h-1 ${c.bar} opacity-80 group-hover:h-1.5 group-hover:opacity-100 transition-all`} />
                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${c.iconBg}`}><area.icon className={`h-5 w-5 ${c.text}`} /></span>
                          {area.status === "changing" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-warning px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-warning-foreground">
                              <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning-foreground opacity-60" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-warning-foreground" /></span>
                              {lang === "el" ? "Αλλάζει" : "Changing"}
                            </span>
                          ) : (
                            <span className="rounded-full bg-success px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-success-foreground">{lang === "el" ? "Σε ισχύ" : "Active"}</span>
                          )}
                        </div>
                        <h3 className={`font-serif text-lg font-bold text-foreground`}>{area.name}</h3>
                        <p className="text-xs text-muted-foreground mb-3">{lang === "el" ? area.description_el : area.description}</p>
                        <p className={`inline-flex self-start items-center gap-1 rounded-sm px-2 py-1 text-[11px] font-semibold ${c.iconBg} ${c.text} mb-3`}><CalendarClock className="h-3 w-3" />{area.keyDate}</p>
                        <div className="mt-auto text-[11px] text-muted-foreground border-t border-border pt-2 space-y-1">
                          <div className="flex items-center gap-1.5"><Gavel className={`h-3 w-3 ${c.text}`} />{area.regulator}</div>
                          <p className="italic">{area.keyRegulation}</p>
                          <p className={`flex items-center gap-1 font-semibold ${c.text}`}>{lang === "el" ? "Επίσημη πηγή" : "Official source"}<ExternalLink className="h-3 w-3" /></p>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="section-rule">
            <div className="container mx-auto px-4 pb-8">
              <h2 className="section-label text-foreground text-sm mb-6">Regulatory Authorities</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {regulatoryLinks.map((link) => (
                  <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" className="border border-border p-4 hover:border-secondary/50 transition-colors group">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-serif font-bold text-foreground group-hover:text-secondary">{link.name}</h3>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">{link.description}</p>
                  </a>
                ))}
              </div>
            </div>
          </section>

          <div className="container mx-auto px-4 py-8"><OperationaliseBanner /></div>
          <PremiumCTABanner />
        </>
      )}
    </ComplianceShell>
  );
}
