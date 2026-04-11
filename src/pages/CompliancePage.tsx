import { useState, useEffect } from "react";
import { SectionSponsorStrip } from "@/components/SectionSponsorStrip";
import { Link } from "react-router-dom";
import { HubLayout } from "@/layouts/HubLayout";
import { Card, CardContent } from "@/components/ui/card";
import { CountryRiskTable } from "@/components/compliance/CountryRiskTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  FileSearch,
  Scale,
  Globe,
  Calendar,
  FileText,
  AlertTriangle,
  BookOpen,
  Download,
  ExternalLink,
  Gavel,
  ClipboardCheck,
  Building2,
  Users,
  Lock,
} from "lucide-react";
import { OperationaliseBanner } from "@/components/banners/OperationaliseBanner";
import { PremiumCTABanner } from "@/components/banners/PremiumCTABanner";
import { GDPRComplianceChecker } from "@/components/sme/GDPRComplianceChecker";
import { supabase } from "@/integrations/supabase/client";

const complianceAreas = [
  { 
    name: "AML/KYC", 
    icon: Shield, 
    description: "Anti-Money Laundering & Know Your Customer",
    regulator: "CySEC / MOKAS",
    keyRegulation: "Prevention & Suppression of Money Laundering Law",
    status: "active",
  },
  { 
    name: "GDPR", 
    icon: FileSearch, 
    description: "Data Protection & Privacy Compliance",
    regulator: "Commissioner for Personal Data Protection",
    keyRegulation: "EU Regulation 2016/679",
    status: "active",
  },
  { 
    name: "MiFID II", 
    icon: Scale, 
    description: "Markets in Financial Instruments",
    regulator: "CySEC",
    keyRegulation: "EU Directive 2014/65/EU",
    status: "active",
  },
  { 
    name: "FATCA/CRS", 
    icon: Globe, 
    description: "Tax Reporting & Exchange of Information",
    regulator: "Tax Department",
    keyRegulation: "Common Reporting Standard",
    status: "active",
  },
  {
    name: "DORA",
    icon: Lock,
    description: "Digital Operational Resilience Act",
    regulator: "CySEC / CBC",
    keyRegulation: "EU Regulation 2022/2554",
    status: "upcoming",
  },
  {
    name: "MiCA",
    icon: Building2,
    description: "Markets in Crypto-Assets Regulation",
    regulator: "CySEC",
    keyRegulation: "EU Regulation 2023/1114",
    status: "active",
  },
];

const regulatoryCalendar = [
  { date: "Q2 2026", event: "CySEC AML/CFT supervisory priorities update", category: "AML" },
  { date: "Jul 2026", event: "DORA — full compliance deadline for ICT third-party risk", category: "DORA" },
  { date: "Sep 2026", event: "MiCA — transitional period ends for existing CASPs", category: "MiCA" },
  { date: "Oct 2026", event: "CBC Annual Compliance Conference", category: "General" },
  { date: "Q4 2026", event: "NIS2 Directive — national transposition deadline", category: "Cyber" },
  { date: "Jan 2027", event: "EU AML Authority (AMLA) — operational start", category: "AML" },
];

const documentTemplates = [
  { name: "AML Risk Assessment Template", category: "AML/KYC", icon: Shield },
  { name: "GDPR Data Processing Agreement", category: "GDPR", icon: FileSearch },
  { name: "DPIA Template (Cyprus)", category: "GDPR", icon: ClipboardCheck },
  { name: "KYC Customer Due Diligence Form", category: "AML/KYC", icon: Users },
  { name: "Suspicious Transaction Report Guide", category: "AML/KYC", icon: AlertTriangle },
  { name: "Data Breach Notification Template", category: "GDPR", icon: FileText },
];

const regulatoryLinks = [
  { name: "CySEC", url: "https://www.cysec.gov.cy", description: "Cyprus Securities & Exchange Commission" },
  { name: "CBC", url: "https://www.centralbank.cy", description: "Central Bank of Cyprus" },
  { name: "MOKAS", url: "https://www.law.gov.cy/mokas", description: "Unit for Combating Money Laundering" },
  { name: "Data Protection Commissioner", url: "https://www.dataprotection.gov.cy", description: "Personal Data Protection" },
];

export default function CompliancePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [articles, setArticles] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "tools" | "templates" | "calendar">("overview");

  useEffect(() => {
    supabase
      .from("cna_articles")
      .select("id, title, summary, image_url, published_at, vertical")
      .eq("status", "published")
      .eq("vertical", "compliance")
      .order("published_at", { ascending: false })
      .limit(6)
      .then(({ data }) => {
        if (data) setArticles(data);
      });
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "tools" as const, label: "Compliance Tools" },
    { id: "templates" as const, label: "Document Templates" },
    { id: "calendar" as const, label: "Regulatory Calendar" },
  ];

  return (
    <HubLayout brand="compliancehub" onSearch={handleSearch}>
      {/* Editorial Masthead Hero */}
      <section className="relative border-b border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="h-[3px] bg-foreground" />
          <div className="py-6 text-center border-b border-border">
            <p className="section-label mb-2 text-secondary">Regulatory Intelligence & Risk Management</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground font-serif tracking-tight">
              ComplianceHub<span className="text-secondary">.cy</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-lg mx-auto">
              Comprehensive compliance tools, document templates, regulatory calendar & guidance for Cyprus
            </p>
            <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                {formattedDate}
              </span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>Cyprus Edition</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="text-secondary font-medium">LIVE</span>
            </div>
          </div>
        </div>
      </section>

      <SectionSponsorStrip sectionKey="compliancehub" />

      <div className="border-b border-border bg-card sticky top-14 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-0 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? "border-secondary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <>
          {/* Latest Compliance Articles */}
          {articles.length > 0 && (
            <section id="alerts" className="section-rule">
              <div className="container mx-auto px-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="section-label text-foreground text-sm">Latest Compliance Intelligence</h2>
                  <Badge variant="outline" className="gap-1 rounded-none text-[10px] uppercase tracking-wider">
                    <Clock className="h-3 w-3" />
                    Live Updates
                  </Badge>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  {articles.map((article) => (
                    <Link to={`/article/${article.id}`} key={article.id}>
                      <article className="border border-border rounded-lg overflow-hidden group cursor-pointer hover:border-secondary/40 transition-colors">
                        {article.image_url && (
                          <div className="relative h-40 overflow-hidden">
                            <img src={article.image_url} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-t from-primary/50 to-transparent" />
                          </div>
                        )}
                        <div className="p-4">
                          <h3 className="text-lg font-serif font-bold text-foreground mb-2 group-hover:text-secondary transition-colors">
                            {article.title}
                          </h3>
                          {article.summary && <p className="article-body text-muted-foreground mb-2 line-clamp-2">{article.summary}</p>}
                          {article.published_at && (
                            <p className="byline">{new Date(article.published_at).toLocaleDateString("en-GB")}</p>
                          )}
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Country Risk Index */}
          <section className="section-rule">
            <div className="container mx-auto px-4 pb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="section-label text-foreground text-sm">Basel AML Country Risk Index</h2>
                <Badge variant="outline" className="gap-1 rounded-none text-[10px] uppercase tracking-wider">
                  <AlertTriangle className="h-3 w-3" />
                  25 Countries
                </Badge>
              </div>
              <CountryRiskTable />
            </div>
          </section>

          {/* Compliance Areas — Enhanced */}
          <section id="aml" className="section-rule bg-muted/30">
            <div className="container mx-auto px-4 pb-8">
              <h2 className="section-label text-foreground text-sm mb-6">Regulatory Frameworks</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {complianceAreas.map((area, index) => (
                  <Card key={index} className="hover:shadow-lg transition-all hover:border-secondary/50 h-full rounded-none border-border">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-12 h-12 rounded-none bg-foreground/5 flex items-center justify-center">
                          <area.icon className="h-6 w-6 text-foreground" />
                        </div>
                        <Badge
                          variant="outline"
                          className={`rounded-none text-[9px] uppercase tracking-wider ${
                            area.status === "upcoming"
                              ? "border-warning text-warning"
                              : "border-success text-success"
                          }`}
                        >
                          {area.status === "upcoming" ? "Upcoming" : "Active"}
                        </Badge>
                      </div>
                      <h3 className="font-serif font-semibold text-foreground mb-1">{area.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{area.description}</p>
                      <div className="space-y-1 text-xs text-muted-foreground border-t border-border pt-3">
                        <div className="flex items-center gap-1.5">
                          <Gavel className="h-3 w-3 text-secondary" />
                          <span>{area.regulator}</span>
                        </div>
                        <p className="text-[10px] italic">{area.keyRegulation}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Regulatory Links */}
          <section className="section-rule">
            <div className="container mx-auto px-4 pb-8">
              <h2 className="section-label text-foreground text-sm mb-6">Cyprus Regulatory Authorities</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {regulatoryLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-border p-4 hover:border-secondary/50 transition-colors group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-serif font-bold text-foreground group-hover:text-secondary transition-colors">{link.name}</h4>
                      <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-secondary transition-colors" />
                    </div>
                    <p className="text-xs text-muted-foreground">{link.description}</p>
                  </a>
                ))}
              </div>
            </div>
          </section>

          <div className="container mx-auto px-4 py-8">
            <OperationaliseBanner />
          </div>
        </>
      )}

      {/* TOOLS TAB */}
      {activeTab === "tools" && (
        <section className="section-rule">
          <div className="container mx-auto px-4 pb-8">
            <div className="mb-6">
              <h2 className="section-label text-foreground text-sm mb-1">Interactive Compliance Tools</h2>
              <p className="text-xs text-muted-foreground">Self-assessment diagnostics tailored for Cyprus-registered businesses</p>
            </div>
            <div className="max-w-3xl">
              <GDPRComplianceChecker />
            </div>
            <div className="mt-8 grid sm:grid-cols-2 gap-4 max-w-3xl">
              <Link to="/sme">
                <Card className="rounded-none border-border hover:border-secondary/50 transition-colors cursor-pointer h-full">
                  <CardContent className="pt-6">
                    <ClipboardCheck className="h-8 w-8 text-foreground mb-3" />
                    <h3 className="font-serif font-bold text-foreground mb-1">Digital Maturity Assessment</h3>
                    <p className="text-xs text-muted-foreground">Evaluate your digital transformation readiness across 5 key dimensions.</p>
                    <div className="flex items-center gap-1 mt-3 text-[10px] uppercase tracking-wider text-secondary font-semibold">
                      Open Tool <ArrowRight className="h-3 w-3" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/sme">
                <Card className="rounded-none border-border hover:border-secondary/50 transition-colors cursor-pointer h-full">
                  <CardContent className="pt-6">
                    <Globe className="h-8 w-8 text-foreground mb-3" />
                    <h3 className="font-serif font-bold text-foreground mb-1">EU Funding Eligibility</h3>
                    <p className="text-xs text-muted-foreground">Check if your business qualifies for EU & national funding programmes.</p>
                    <div className="flex items-center gap-1 mt-3 text-[10px] uppercase tracking-wider text-secondary font-semibold">
                      Open Tool <ArrowRight className="h-3 w-3" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* TEMPLATES TAB */}
      {activeTab === "templates" && (
        <section className="section-rule">
          <div className="container mx-auto px-4 pb-8">
            <div className="mb-6">
              <h2 className="section-label text-foreground text-sm mb-1">Document Templates & Checklists</h2>
              <p className="text-xs text-muted-foreground">Ready-to-use compliance documents for Cyprus businesses</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-0">
              {documentTemplates.map((doc, i) => (
                <div
                  key={i}
                  className={`py-5 px-4 group cursor-pointer hover:bg-muted/30 transition-colors border-b border-border ${
                    i % 3 !== 2 ? "lg:border-r" : ""
                  } ${i % 2 !== 0 ? "sm:border-r lg:border-r-0" : ""}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="rounded-none text-[10px] uppercase tracking-wider font-sans border-muted-foreground/30">
                      {doc.category}
                    </Badge>
                  </div>
                  <div className="flex items-start gap-3">
                    <doc.icon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif font-bold text-foreground leading-snug mb-1 group-hover:text-secondary transition-colors">
                        {doc.name}
                      </h3>
                      <div className="flex items-center gap-1 text-[10px] text-secondary font-semibold uppercase tracking-wider">
                        <Download className="h-3 w-3" />
                        Coming Soon
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link to="/resources">
                <Button variant="outline" className="rounded-none gap-2 text-xs uppercase tracking-wider">
                  <BookOpen className="h-3.5 w-3.5" />
                  Browse Full Resource Hub
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CALENDAR TAB */}
      {activeTab === "calendar" && (
        <section className="section-rule">
          <div className="container mx-auto px-4 pb-8">
            <div className="mb-6">
              <h2 className="section-label text-foreground text-sm mb-1">Regulatory Calendar</h2>
              <p className="text-xs text-muted-foreground">Key compliance deadlines and events for Cyprus businesses</p>
            </div>
            <div className="max-w-2xl">
              <div className="divide-y divide-border border border-border">
                {regulatoryCalendar.map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors">
                    <div className="w-20 shrink-0">
                      <span className="text-xs font-bold text-secondary uppercase tracking-wider">{item.date}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-snug">{item.event}</p>
                      <Badge variant="outline" className="rounded-none text-[9px] uppercase tracking-wider mt-2 border-muted-foreground/30">
                        {item.category}
                      </Badge>
                    </div>
                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <PremiumCTABanner />

      {/* Disclaimer */}
      <section className="py-8 border-t border-border">
        <div className="container mx-auto px-4">
          <p className="text-sm text-muted-foreground text-center">
            Information provided is for educational purposes only and does not constitute legal or regulatory advice.
          </p>
        </div>
      </section>
    </HubLayout>
  );
}
