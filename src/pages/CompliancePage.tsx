import { Link } from "react-router-dom";
import { ArrowRight, AlertTriangle, Gavel, ExternalLink } from "lucide-react";
import { HubNewsBlock } from "@/components/HubNewsBlock";
import { Card, CardContent } from "@/components/ui/card";
import { CountryRiskTable } from "@/components/compliance/CountryRiskTable";
import { Badge } from "@/components/ui/badge";
import { OperationaliseBanner } from "@/components/banners/OperationaliseBanner";
import { PremiumCTABanner } from "@/components/banners/PremiumCTABanner";
import { ComplianceShell } from "@/components/compliance/ComplianceShell";
import { ComplianceItemCard, DeadlineRow } from "@/components/compliance/ComplianceItemCard";
import { complianceAreas, regulatoryLinks } from "@/components/compliance/staticContent";
import { useComplianceItems } from "@/hooks/useComplianceItems";
import { ct, deadlineEntries } from "@/lib/compliance";
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
  const updates = items.filter((i) => i.sections.includes("updates")).slice(0, 5);
  const sanctions = items.filter((i) => i.sections.includes("eu_sanctions") || i.sections.includes("cy_sanctions")).slice(0, 5);
  const deadlines = deadlineEntries(items, today()).slice(0, 6);

  return (
    <ComplianceShell masthead title="ComplianceHub.cy" intro="Official regulatory updates, sanctions changes, FATF country risk and upcoming deadlines for Cyprus — each linked to the original document.">
      {(lang) => (
        <>
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

          <HubNewsBlock title="Compliance" verticals={COMPLIANCE_V} hubKey="compliance" />

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
              <h2 className="section-label text-foreground text-sm mb-6">Regulatory Frameworks</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {complianceAreas.map((area) => (
                  <Card key={area.name} className="rounded-none border-border h-full">
                    <CardContent className="pt-5">
                      <div className="flex items-start justify-between mb-2">
                        <area.icon className="h-5 w-5 text-foreground" />
                        <Badge variant="outline" className={`rounded-none text-[9px] uppercase tracking-wider ${area.status !== "active" ? "border-warning text-warning" : "border-success text-success"}`}>
                          {area.status === "changing" ? "Changing" : "Active"}
                        </Badge>
                      </div>
                      <h3 className="font-serif font-semibold text-foreground">{area.name}</h3>
                      <p className="text-xs text-muted-foreground mb-2">{area.description}</p>
                      <div className="text-[11px] text-muted-foreground border-t border-border pt-2 space-y-1">
                        <div className="flex items-center gap-1.5"><Gavel className="h-3 w-3 text-secondary" />{area.regulator}</div>
                        <p className="italic">{area.keyRegulation}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
