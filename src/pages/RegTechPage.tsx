import { useState, useEffect } from "react";
import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { HubLayout } from "@/layouts/HubLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Cpu, Shield, Server, Globe, Lock, FileText, Calendar,
  ArrowRight, Landmark, Building2, Users, TrendingUp,
  CheckCircle2, Circle, ExternalLink, Gavel, Scale,
  type LucideIcon,
} from "lucide-react";
import { InsightBanner } from "@/components/banners/InsightBanner";
import { PremiumCTABanner } from "@/components/banners/PremiumCTABanner";
import { SectionSponsorStrip } from "@/components/SectionSponsorStrip";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

/* ─── Static Data ──────────────────────────────────────── */

const stats = [
  { label: "RegTech Vendors", value: "120+", icon: Cpu },
  { label: "Regulated Entities", value: "300+", icon: Shield },
  { label: "DORA Deadline", value: "Jul 2025", icon: Calendar },
  { label: "Compliance Cost Saved", value: "40%", icon: TrendingUp },
];

const vendorCategories = [
  {
    name: "KYC / Identity Verification",
    regulation: "AML 6AMLD",
    examples: ["Onfido", "Jumio", "Sumsub", "IDnow"],
    icon: Users,
  },
  {
    name: "Transaction Monitoring",
    regulation: "AML / MiFID II",
    examples: ["NICE Actimize", "Featurespace", "ComplyAdvantage", "Napier"],
    icon: Shield,
  },
  {
    name: "ICT Risk & DORA",
    regulation: "DORA",
    examples: ["ServiceNow GRC", "MetricStream", "Riskonnect", "LogicManager"],
    icon: Server,
  },
  {
    name: "Regulatory Reporting",
    regulation: "MiFID II / EMIR / SFTR",
    examples: ["Regnology", "Wolters Kluwer", "Broadridge", "TRAction"],
    icon: FileText,
  },
  {
    name: "Crypto & MiCA Compliance",
    regulation: "MiCA / Travel Rule",
    examples: ["Chainalysis", "Elliptic", "CipherTrace", "Notabene"],
    icon: Globe,
  },
  {
    name: "Policy & Controls Management",
    regulation: "GDPR / ISO 27001 / DORA",
    examples: ["OneTrust", "NAVEX", "Diligent", "Alyne"],
    icon: Lock,
  },
];

const doraChecklist = [
  "ICT risk management framework documented and board-approved",
  "ICT incident classification and reporting process in place",
  "TLPT (Threat-Led Penetration Testing) programme initiated",
  "ICT third-party register complete with risk tiering",
  "Contractual provisions updated for all critical ICT providers",
  "Business continuity and disaster recovery plans tested",
  "Information sharing arrangements with sector peers established",
];

const externalResources = [
  { name: "EBA RegTech Knowledge Hub", url: "https://www.eba.europa.eu/activities/financial-innovation/regtech", description: "European Banking Authority" },
  { name: "ESMA DORA Guidelines", url: "https://www.esma.europa.eu/policy-activities/digital-finance/dora", description: "European Securities & Markets Authority" },
  { name: "CySEC Innovation Hub", url: "https://www.cysec.gov.cy/en-GB/innovation-hub/", description: "Cyprus Securities & Exchange Commission" },
  { name: "EIC RegTech Programme", url: "https://eic.ec.europa.eu", description: "European Innovation Council" },
];

const whatRegtechCovers = [
  {
    title: "Compliance Automation",
    description: "Automated KYC/AML screening, regulatory reporting, and policy management that reduces manual workloads by up to 70%.",
    icon: Shield,
  },
  {
    title: "Risk Surveillance",
    description: "Real-time transaction monitoring, anomaly detection, and risk scoring powered by AI and machine learning models.",
    icon: TrendingUp,
  },
  {
    title: "ICT Resilience (DORA)",
    description: "Digital operational resilience tools covering ICT risk management, third-party oversight, and incident reporting frameworks.",
    icon: Server,
  },
];

const iconMap: Record<string, LucideIcon> = {
  FileText, Shield, Scale, Server, Globe, Lock, Cpu, Gavel, Landmark, Building2, TrendingUp,
};

const statusColorMap: Record<string, string> = {
  emerald: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30",
  amber: "text-amber-600 bg-amber-100 dark:bg-amber-900/30",
  red: "text-red-600 bg-red-100 dark:bg-red-900/30",
  blue: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
};

interface Regulation {
  id: string;
  name: string;
  icon: string;
  description: string;
  status: string;
  status_color: string;
  effective_date: string;
  impact: string;
  applies_to: string[];
  key_body: string;
}

/* ─── Component ────────────────────────────────────────── */

export default function RegTechPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "vendors" | "dora" | "frameworks" | "cyber">("overview");
  const [articles, setArticles] = useState<any[]>([]);
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [doraCompleted, setDoraCompleted] = useState<Set<number>>(new Set());

  useEffect(() => {
    supabase
      .from("cna_articles")
      .select("id, title, summary, image_url, published_at, vertical")
      .eq("status", "published")
      .in("vertical", ["regtech", "compliance", "fintech"])
      .order("published_at", { ascending: false })
      .limit(3)
      .then(({ data }) => {
        if (data) setArticles(data);
      });

    supabase
      .from("regulations")
      .select("*")
      .eq("active", true)
      .eq("hub_section", "regtech")
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (data) setRegulations(data as Regulation[]);
      });
  }, []);

  const toggleDoraItem = (index: number) => {
    setDoraCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });
  };

  const doraScore = Math.round((doraCompleted.size / doraChecklist.length) * 100);
  const doraColor = doraScore < 40 ? "bg-destructive" : doraScore < 70 ? "bg-warning" : "bg-success";
  const doraMessage =
    doraScore === 100
      ? "Full readiness achieved — ensure ongoing monitoring and annual reviews."
      : doraScore >= 70
        ? "Strong progress — focus on remaining items before the compliance deadline."
        : doraScore >= 40
          ? "Moderate readiness — several critical areas still need attention."
          : "Early stage — prioritise establishing your ICT risk framework and incident processes.";

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "vendors" as const, label: "Vendor Landscape" },
    { id: "dora" as const, label: "DORA Readiness" },
    { id: "cyber" as const, label: "Cyber & ICT Risk" },
    { id: "frameworks" as const, label: "Frameworks" },
  ];

  return (
    <HubLayout brand="regtechhub">
      <SEOHead
        title="RegTechHub.cy — Regulatory Technology Intelligence for Cyprus"
        description="DORA readiness, vendor landscape, and regulatory frameworks for RegTech in Cyprus. Compliance automation, risk surveillance & ICT resilience tools."
        path="/regtech"
      />

      {/* ─── Masthead ─────────────────────────────────────── */}
      <section className="relative border-b border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="h-[3px] bg-foreground" />
          <div className="py-6 text-center border-b border-border">
            <p className="section-label mb-2 text-secondary">Regulatory Technology Intelligence for Cyprus</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground font-serif tracking-tight">
              RegTechHub<span className="text-secondary">.cy</span>
            </h1>
            <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                {formattedDate}
              </span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>Cyprus Edition</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="text-regtech font-medium">LIVE</span>
            </div>
          </div>

          {/* Stats row */}
          <div className="py-6 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto border-b border-border">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <stat.icon className="h-4 w-4 text-regtech mx-auto mb-1.5" />
                <p className="text-2xl font-bold text-foreground font-serif">{stat.value}</p>
                <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SectionSponsorStrip sectionKey="regtechhub" />

      {/* ─── Tab Bar ──────────────────────────────────────── */}
      <div className="border-b border-border bg-card sticky top-14 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-0 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? "border-regtech text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════ TAB 1: OVERVIEW ═══════════════════ */}
      {activeTab === "overview" && (
        <>
          {/* Latest Articles */}
          {articles.length > 0 && (
            <section className="section-rule">
              <div className="container mx-auto px-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="section-label text-foreground text-sm">Latest RegTech Intelligence</h2>
                  <Badge variant="outline" className="gap-1 rounded-none text-[10px] uppercase tracking-wider">
                    <Cpu className="h-3 w-3" /> Live
                  </Badge>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  {articles.map((article) => (
                    <Link to={`/article/${article.id}`} key={article.id} className="group block border border-border rounded-lg overflow-hidden hover:border-regtech/40 transition-colors">
                      <div className="relative h-44 overflow-hidden">
                        <img
                          src={article.image_url || "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80"}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent" />
                        <span className="absolute top-3 left-3 section-label text-white drop-shadow bg-regtech/60 backdrop-blur-sm px-2 py-0.5">
                          {article.vertical === "regtech" ? "RegTech" : article.vertical === "compliance" ? "Compliance" : "FinTech"}
                        </span>
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-serif font-bold text-foreground mb-2 group-hover:text-regtech transition-colors leading-tight">
                          {article.title}
                        </h3>
                        <p className="article-body text-muted-foreground mb-3 line-clamp-2">{article.summary}</p>
                        <p className="byline">
                          {article.published_at ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true }) : ""}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* What RegTech Covers */}
          <section className="section-rule bg-muted/30">
            <div className="container mx-auto px-4 pb-8">
              <h2 className="section-label text-foreground text-sm mb-6">What RegTech Covers</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {whatRegtechCovers.map((item, i) => (
                  <Card key={i} className="rounded-none border-border hover:border-regtech/50 transition-colors">
                    <CardContent className="pt-6">
                      <div className="w-12 h-12 rounded-none bg-regtech/10 flex items-center justify-center mb-4">
                        <item.icon className="h-6 w-6 text-regtech" />
                      </div>
                      <h3 className="font-serif font-bold text-foreground mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Cross-hub links */}
          <section className="section-rule">
            <div className="container mx-auto px-4 pb-8">
              <h2 className="section-label text-foreground text-sm mb-6">Explore Related Hubs</h2>
              <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
                <Link to="/fintech" className="border border-border p-5 hover:border-fintech/50 transition-colors group">
                  <div className="flex items-center gap-3 mb-2">
                    <Landmark className="h-5 w-5 text-fintech" />
                    <h3 className="font-serif font-bold text-foreground group-hover:text-fintech transition-colors">FinTechHub.cy</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">Digital finance intelligence, MiCA updates & licensed EMI directory.</p>
                </Link>
                <Link to="/compliance" className="border border-border p-5 hover:border-compliance/50 transition-colors group">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="h-5 w-5 text-compliance" />
                    <h3 className="font-serif font-bold text-foreground group-hover:text-compliance transition-colors">ComplianceHub.cy</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">AML/KYC tools, GDPR checklists & regulatory calendar for Cyprus.</p>
                </Link>
              </div>
            </div>
          </section>

          {/* Insight Banner */}
          <div className="container mx-auto px-4 py-8">
            <InsightBanner
              text="DORA requires all financial entities to implement robust ICT risk management by July 2025. Assess your readiness now with our interactive checklist."
              ctaText="Start DORA Readiness Assessment"
              href="/regtech#dora"
            />
          </div>
        </>
      )}

      {/* ═══════════════════ TAB 2: VENDOR LANDSCAPE ═══════════════════ */}
      {activeTab === "vendors" && (
        <section id="vendors" className="section-rule">
          <div className="container mx-auto px-4 pb-8">
            <div className="mb-6">
              <h2 className="section-label text-foreground text-sm mb-1">RegTech Vendor Landscape</h2>
              <p className="text-xs text-muted-foreground">Key categories of regulatory technology solutions mapped to EU frameworks</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {vendorCategories.map((cat, i) => (
                <Card key={i} className="rounded-none border-border hover:border-regtech/50 hover:shadow-lg transition-all">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 rounded-none bg-foreground/5 flex items-center justify-center">
                        <cat.icon className="h-6 w-6 text-foreground" />
                      </div>
                      <Badge variant="outline" className="rounded-none text-[9px] uppercase tracking-wider border-regtech/30 text-regtech">
                        {cat.regulation}
                      </Badge>
                    </div>
                    <h3 className="font-serif font-semibold text-foreground mb-2">{cat.name}</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.examples.map((ex) => (
                        <span key={ex} className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground">
                          {ex}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Coming soon placeholder */}
            <div className="mt-6">
              <Link to="/directory" className="block border-2 border-dashed border-border p-6 text-center hover:border-regtech/40 transition-colors group">
                <Cpu className="h-8 w-8 text-muted-foreground mx-auto mb-2 group-hover:text-regtech transition-colors" />
                <h3 className="font-serif font-bold text-foreground mb-1">RegTech Vendor Directory — coming soon</h3>
                <p className="text-xs text-muted-foreground">Browse and compare RegTech solutions for Cyprus-regulated entities</p>
                <span className="inline-flex items-center gap-1 mt-3 text-[10px] uppercase tracking-wider text-regtech font-semibold">
                  Browse Directory <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════ TAB 3: DORA READINESS ═══════════════════ */}
      {activeTab === "dora" && (
        <section id="dora" className="section-rule">
          <div className="container mx-auto px-4 pb-8">
            <div className="mb-6">
              <h2 className="section-label text-foreground text-sm mb-1">DORA Readiness Self-Assessment</h2>
              <p className="text-xs text-muted-foreground">Click items to mark complete. For self-assessment only, not regulatory advice.</p>
            </div>

            <div className="max-w-2xl">
              {/* Score */}
              <div className="mb-6 p-5 border border-border bg-card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-serif font-bold text-foreground">Readiness Score</h3>
                  <span className="text-2xl font-bold text-foreground font-serif">{doraScore}%</span>
                </div>
                <Progress value={doraScore} className={`h-3 ${doraColor}`} />
                <p className="text-xs text-muted-foreground mt-3">{doraMessage}</p>
              </div>

              {/* Checklist */}
              <div className="space-y-0 border border-border bg-card divide-y divide-border">
                {doraChecklist.map((item, i) => {
                  const completed = doraCompleted.has(i);
                  return (
                    <button
                      key={i}
                      onClick={() => toggleDoraItem(i)}
                      className={`w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-muted/30 transition-colors ${
                        completed ? "bg-success/5" : ""
                      }`}
                    >
                      {completed ? (
                        <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      )}
                      <span className={`text-sm ${completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                        {item}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 mt-6">
                <Link to="/compliance">
                  <Button variant="outline" className="rounded-none text-xs uppercase tracking-wider font-semibold gap-1.5">
                    <Shield className="h-3.5 w-3.5" /> Full Compliance Tools
                  </Button>
                </Link>
                <Link to="/resources">
                  <Button variant="outline" className="rounded-none text-xs uppercase tracking-wider font-semibold gap-1.5">
                    <FileText className="h-3.5 w-3.5" /> DORA Resources
                  </Button>
                </Link>
              </div>

              <p className="text-[10px] text-muted-foreground mt-4 italic">
                Disclaimer: This checklist is for self-assessment and educational purposes only. It does not constitute legal, regulatory, or technology procurement advice.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════ TAB 4: FRAMEWORKS ═══════════════════ */}
      {activeTab === "frameworks" && (
        <section className="section-rule bg-muted/30">
          <div className="container mx-auto px-4 pb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="section-label text-foreground text-sm">Regulatory Frameworks</h2>
                <p className="text-xs text-muted-foreground mt-1">Key EU frameworks relevant to RegTech in Cyprus</p>
              </div>
              <Badge variant="outline" className="text-[9px] uppercase tracking-widest text-muted-foreground">
                <Calendar className="h-3 w-3 mr-1" /> Updated Q2 2026
              </Badge>
            </div>

            {regulations.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {regulations.map((reg) => {
                  const IconComponent = iconMap[reg.icon] || FileText;
                  const colorClass = statusColorMap[reg.status_color] || statusColorMap.emerald;
                  return (
                    <Card key={reg.id} className="hover:shadow-lg transition-all hover:border-regtech/50 cursor-pointer rounded-none border-border group">
                      <CardContent className="pt-5 pb-4 px-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-none bg-foreground/5 flex items-center justify-center shrink-0">
                              <IconComponent className="h-5 w-5 text-foreground" />
                            </div>
                            <div>
                              <h3 className="font-serif font-bold text-foreground text-base">{reg.name}</h3>
                              <p className="text-xs text-muted-foreground">{reg.description}</p>
                            </div>
                          </div>
                          <Badge className={`text-[9px] border-0 shrink-0 ${colorClass}`}>
                            {reg.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-3">{reg.impact}</p>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {reg.applies_to.map((entity) => (
                            <span key={entity} className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground">
                              {entity}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground/70 border-t border-border pt-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Effective: {reg.effective_date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Landmark className="h-3 w-3" /> {reg.key_body}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No regulatory frameworks published yet.</p>
            )}

            {/* External Resources */}
            <div className="mt-8">
              <h3 className="section-label text-foreground text-sm mb-4">External Resources</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {externalResources.map((link) => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-border p-4 hover:border-regtech/50 transition-colors group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-serif font-bold text-foreground group-hover:text-regtech transition-colors text-sm">{link.name}</h4>
                      <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-regtech transition-colors" />
                    </div>
                    <p className="text-xs text-muted-foreground">{link.description}</p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════ TAB 5: CYBER & ICT RISK ═══════════════════ */}
      {activeTab === "cyber" && (
        <section className="section-rule">
          <div className="container mx-auto px-4 pb-8">
            <div className="mb-6">
              <h2 className="section-label text-foreground text-sm mb-1">Cyber & ICT Risk Intelligence</h2>
              <p className="text-xs text-muted-foreground">Threat landscape, incident reporting, and ICT resilience for Cyprus-regulated entities</p>
            </div>

            {/* Threat landscape overview */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {[
                {
                  title: "ICT Incident Reporting",
                  description: "DORA mandates classification and reporting of major ICT incidents to CySEC within 4 hours of detection. Establish clear escalation paths and templates.",
                  icon: Shield,
                  tag: "DORA Art. 19",
                },
                {
                  title: "Third-Party ICT Risk",
                  description: "Maintain a register of all ICT third-party providers with risk tiering. Critical providers face direct ESA oversight under the DORA oversight framework.",
                  icon: Server,
                  tag: "DORA Art. 28-30",
                },
                {
                  title: "Threat-Led Penetration Testing",
                  description: "Significant financial entities must conduct TLPT at least every 3 years using qualified external testers following the TIBER-EU framework.",
                  icon: Lock,
                  tag: "DORA Art. 26-27",
                },
                {
                  title: "NIS2 Directive Impact",
                  description: "Cyprus transposition of NIS2 extends cybersecurity obligations to essential and important entities including certain financial infrastructure providers.",
                  icon: Globe,
                  tag: "NIS2",
                },
                {
                  title: "Cyber Threat Intelligence",
                  description: "Voluntary information-sharing arrangements with peers and authorities are encouraged under DORA to improve collective cyber resilience.",
                  icon: Cpu,
                  tag: "DORA Art. 45",
                },
                {
                  title: "Business Continuity",
                  description: "ICT business continuity policies must be tested annually, with recovery time objectives aligned to the criticality of business functions.",
                  icon: FileText,
                  tag: "DORA Art. 11-12",
                },
              ].map((item, i) => (
                <Card key={i} className="rounded-none border-border hover:border-regtech/50 transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-none bg-regtech/10 flex items-center justify-center">
                        <item.icon className="h-5 w-5 text-regtech" />
                      </div>
                      <Badge variant="outline" className="rounded-none text-[9px] uppercase tracking-wider border-regtech/30 text-regtech">
                        {item.tag}
                      </Badge>
                    </div>
                    <h3 className="font-serif font-semibold text-foreground mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Key deadlines */}
            <div className="border border-border bg-card p-5 mb-6">
              <h3 className="font-serif font-bold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-regtech" /> Key Cyber Compliance Deadlines
              </h3>
              <div className="space-y-3">
                {[
                  { date: "17 Jan 2025", event: "DORA applies to all financial entities in the EU", status: "In Force" },
                  { date: "17 Jul 2025", event: "First DORA incident reports due to national competent authorities", status: "Upcoming" },
                  { date: "17 Oct 2025", event: "NIS2 national transposition deadline for Cyprus", status: "Upcoming" },
                  { date: "17 Jan 2026", event: "Register of ICT third-party providers submitted to ESAs", status: "Upcoming" },
                ].map((dl, i) => (
                  <div key={i} className="flex items-center gap-4 py-2 border-b border-border last:border-0">
                    <span className="text-xs font-mono text-muted-foreground w-24 shrink-0">{dl.date}</span>
                    <span className="text-sm text-foreground flex-1">{dl.event}</span>
                    <Badge variant="outline" className={`text-[9px] rounded-none ${dl.status === "In Force" ? "text-emerald-600 border-emerald-300" : "text-amber-600 border-amber-300"}`}>
                      {dl.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Cross-link */}
            <div className="flex flex-wrap gap-3">
              <Link to="/compliance">
                <Button variant="outline" className="rounded-none text-xs uppercase tracking-wider font-semibold gap-1.5">
                  <Shield className="h-3.5 w-3.5" /> Compliance Hub
                </Button>
              </Link>
              <Link to="/resources">
                <Button variant="outline" className="rounded-none text-xs uppercase tracking-wider font-semibold gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> Cyber Resources
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Premium CTA */}
      <PremiumCTABanner />

      {/* Disclaimer */}
      <section className="py-8 border-t border-border">
        <div className="container mx-auto px-4">
          <p className="text-sm text-muted-foreground text-center">
            Information provided is for educational purposes only and does not constitute legal, regulatory, or technology procurement advice.
          </p>
        </div>
      </section>
    </HubLayout>
  );
}
