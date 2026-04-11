import { useState } from "react";
import { Link } from "react-router-dom";
import { HubLayout } from "@/layouts/HubLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DigitalMaturityAssessment } from "@/components/sme/DigitalMaturityAssessment";
import { CyprusVATCalculator } from "@/components/sme/CyprusVATCalculator";
import { EUFundingEligibility } from "@/components/sme/EUFundingEligibility";
import { GDPRComplianceChecker } from "@/components/sme/GDPRComplianceChecker";
import {
  Calendar,
  ArrowRight,
  Euro,
  CheckCircle2,
  ExternalLink,
  Building2,
  Users,
  FileText,
  Shield,
  Globe,
  TrendingUp,
  Briefcase,
  Calculator,
  ClipboardCheck,
  Lightbulb,
  Target,
  BookOpen,
  Award,
  MapPin,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ─── EU Funding Programmes ───
const fundingProgrammes = [
  {
    id: "horizon",
    name: "Horizon Europe",
    budget: "€95.5 billion",
    period: "2021–2027",
    description: "The EU's key research and innovation programme. SMEs can participate via EIC Accelerator, collaborative projects, and innovation actions.",
    eligibility: ["Registered EU SME", "Fewer than 250 employees", "Innovation-driven project"],
    link: "https://ec.europa.eu/info/horizon-europe_en",
    category: "Innovation",
    status: "Open",
  },
  {
    id: "cosme",
    name: "Single Market Programme (COSME)",
    budget: "€4.2 billion",
    period: "2021–2027",
    description: "Supports SME competitiveness, access to markets, and entrepreneurship. Includes the Enterprise Europe Network and Erasmus for Young Entrepreneurs.",
    eligibility: ["Any EU-registered SME", "Cross-border ambition", "Growth-stage or scaling"],
    link: "https://ec.europa.eu/growth/smes/cosme_en",
    category: "Competitiveness",
    status: "Open",
  },
  {
    id: "digital-europe",
    name: "Digital Europe Programme",
    budget: "€7.5 billion",
    period: "2021–2027",
    description: "Funds digital transformation for SMEs including AI adoption, cybersecurity, and digital skills training.",
    eligibility: ["Digital transformation project", "EU-based SME", "Tech adoption focus"],
    link: "https://digital-strategy.ec.europa.eu/en/activities/digital-programme",
    category: "Digital",
    status: "Open",
  },
  {
    id: "eic",
    name: "EIC Accelerator",
    budget: "Up to €2.5M grant + €15M equity",
    period: "Rolling",
    description: "Blended finance for high-impact startups and SMEs with breakthrough innovations. Grants plus equity investment.",
    eligibility: ["High-impact innovation", "TRL 5–8", "Scalable business model"],
    link: "https://eic.ec.europa.eu/eic-funding-opportunities/eic-accelerator_en",
    category: "Innovation",
    status: "Open",
  },
  {
    id: "life",
    name: "LIFE Programme",
    budget: "€5.4 billion",
    period: "2021–2027",
    description: "EU's funding instrument for the environment and climate action. SMEs developing green tech or circular economy solutions are eligible.",
    eligibility: ["Environmental innovation", "Climate action project", "EU-based entity"],
    link: "https://cinea.ec.europa.eu/programmes/life_en",
    category: "Green",
    status: "Open",
  },
  {
    id: "structural",
    name: "Cyprus Structural Funds",
    budget: "€1.8 billion (Cyprus allocation)",
    period: "2021–2027",
    description: "EU Cohesion Policy funds managed nationally. Includes grants for SME digitalisation, green transition, and competitiveness.",
    eligibility: ["Cyprus-registered SME", "Project in Cyprus", "Co-financing capability"],
    link: "https://www.structuralfunds.org.cy",
    category: "National",
    status: "Open",
  },
];

// ─── Regulatory Checklists ───
const checklists = [
  {
    id: "new-company",
    title: "Starting a Business in Cyprus",
    items: [
      { text: "Register company name with Department of Registrar", done: false },
      { text: "Prepare Memorandum & Articles of Association", done: false },
      { text: "Register with Tax Department (TIN)", done: false },
      { text: "Register for VAT (if turnover > €15,600)", done: false },
      { text: "Register with Social Insurance Services", done: false },
      { text: "Open corporate bank account", done: false },
      { text: "Register for GESY (National Health System)", done: false },
      { text: "Obtain municipal licence (if applicable)", done: false },
      { text: "Register with Cyprus Chamber of Commerce", done: false },
      { text: "Set up accounting and audit framework", done: false },
    ],
  },
  {
    id: "tax-compliance",
    title: "Annual Tax & Reporting Obligations",
    items: [
      { text: "File annual corporate tax return (TD4)", done: false },
      { text: "Submit audited financial statements", done: false },
      { text: "Pay provisional tax (two instalments)", done: false },
      { text: "File quarterly VAT returns", done: false },
      { text: "Submit Annual Report to Registrar of Companies", done: false },
      { text: "File employer's Social Insurance contributions monthly", done: false },
      { text: "Submit Defence Fund declarations", done: false },
      { text: "FATCA/CRS reporting (if applicable)", done: false },
    ],
  },
  {
    id: "gdpr",
    title: "GDPR Compliance for SMEs",
    items: [
      { text: "Appoint Data Protection Officer (if required)", done: false },
      { text: "Create privacy policy and cookie consent", done: false },
      { text: "Maintain records of processing activities", done: false },
      { text: "Implement data breach notification procedures", done: false },
      { text: "Conduct Data Protection Impact Assessments", done: false },
      { text: "Ensure lawful basis for processing personal data", done: false },
      { text: "Establish data subject rights procedures", done: false },
    ],
  },
  {
    id: "employment",
    title: "Employment Law Essentials",
    items: [
      { text: "Provide written employment contracts", done: false },
      { text: "Register employees with Social Insurance", done: false },
      { text: "Comply with minimum wage requirements", done: false },
      { text: "Maintain health & safety workplace standards", done: false },
      { text: "Comply with annual leave entitlements (20+ days)", done: false },
      { text: "Implement anti-discrimination policies", done: false },
      { text: "Follow termination and severance procedures", done: false },
    ],
  },
];

// ─── EU Support Tools ───
const euTools = [
  {
    name: "Your Europe — Business",
    description: "Official EU portal for starting, running, and closing a business in the EU. Covers tax, employment, product requirements, and public contracts.",
    url: "https://europa.eu/youreurope/business/index_en.htm",
    icon: Globe,
    category: "Portal",
  },
  {
    name: "Access2Finance",
    description: "Find EU-supported loans, guarantees, and venture capital near you. Over €200 billion available through financial intermediaries.",
    url: "https://europa.eu/youreurope/business/finance-funding/getting-funding/access-finance/index_en.htm",
    icon: Euro,
    category: "Finance",
  },
  {
    name: "Enterprise Europe Network",
    description: "Free business support for internationalisation. Find partners, get advice on EU regulations, and access innovation support.",
    url: "https://een.ec.europa.eu/",
    icon: Users,
    category: "Network",
  },
  {
    name: "SME Test / Think Small First",
    description: "EU impact assessments ensure new regulations consider SME impacts. Track how EU legislation affects your business.",
    url: "https://ec.europa.eu/growth/smes/sme-strategy/sme-test_en",
    icon: ClipboardCheck,
    category: "Policy",
  },
  {
    name: "Intellectual Property SME Fund",
    description: "Get up to €1,500 to protect your trademarks and designs. EU co-funded vouchers for IP registration.",
    url: "https://euipo.europa.eu/ohimportal/en/online-services/sme-fund",
    icon: Award,
    category: "IP",
  },
  {
    name: "EU Funding & Tenders Portal",
    description: "Single entry point for participants in EU funding programmes. Search for open calls and submit proposals.",
    url: "https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/home",
    icon: Target,
    category: "Funding",
  },
  {
    name: "SOLVIT",
    description: "Free EU dispute resolution for cross-border business problems caused by national authorities misapplying EU rules.",
    url: "https://ec.europa.eu/solvit/index_en.htm",
    icon: Shield,
    category: "Resolution",
  },
  {
    name: "eTranslation",
    description: "Free machine translation service for EU SMEs. Translate business documents across all EU languages.",
    url: "https://ec.europa.eu/cefdigital/wiki/display/CEFDIGITAL/eTranslation",
    icon: BookOpen,
    category: "Tools",
  },
];

// ─── SME Readiness Scorer ───
const readinessQuestions = [
  { id: "registered", question: "Is your company registered with the Department of Registrar?", weight: 15 },
  { id: "tin", question: "Do you have a Tax Identification Number (TIN)?", weight: 10 },
  { id: "vat", question: "Are you VAT registered (or confirmed exempt)?", weight: 10 },
  { id: "accounts", question: "Do you have audited financial statements?", weight: 10 },
  { id: "gdpr", question: "Do you have a GDPR-compliant privacy policy?", weight: 10 },
  { id: "insurance", question: "Are employees registered with Social Insurance?", weight: 10 },
  { id: "bank", question: "Do you have a corporate bank account?", weight: 5 },
  { id: "contracts", question: "Do all employees have written contracts?", weight: 10 },
  { id: "aml", question: "Do you have AML procedures (if in regulated sector)?", weight: 10 },
  { id: "digital", question: "Do you have a website and digital presence?", weight: 5 },
  { id: "ip", question: "Have you registered any trademarks or IP?", weight: 5 },
];

// ─── SME Directory ───
const smeDirectory = [
  { name: "Cyprus Chamber of Commerce & Industry", type: "Chamber", location: "Nicosia", url: "https://ccci.org.cy", services: ["Networking", "Trade missions", "Certificates of origin"] },
  { name: "Enterprise Europe Network Cyprus", type: "EU Network", location: "Nicosia", url: "https://een.ec.europa.eu", services: ["Partner search", "EU funding advice", "Innovation support"] },
  { name: "CYTA Business Solutions", type: "Telecom", location: "Island-wide", url: "https://cyta.com.cy", services: ["Connectivity", "Cloud", "Cybersecurity"] },
  { name: "Research & Innovation Foundation", type: "Gov Agency", location: "Nicosia", url: "https://research.org.cy", services: ["National grants", "Horizon Europe NCP", "Innovation support"] },
  { name: "Cyprus Investment Promotion Agency (CIPA)", type: "Gov Agency", location: "Nicosia", url: "https://investcyprus.org.cy", services: ["Investment facilitation", "Business setup", "Incentives"] },
  { name: "Ministry of Energy, Commerce & Industry", type: "Ministry", location: "Nicosia", url: "https://meci.gov.cy", services: ["SME policy", "Industrial licensing", "Trade"] },
  { name: "Deloitte Cyprus", type: "Advisory", location: "Nicosia / Limassol", url: "https://www2.deloitte.com/cy", services: ["Audit", "Tax", "Consulting", "EU grants"] },
  { name: "Grant Thornton Cyprus", type: "Advisory", location: "Limassol", url: "https://www.grantthornton.com.cy", services: ["Audit", "Tax advisory", "Business consulting"] },
];

export default function SMEPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFunding, setExpandedFunding] = useState<string | null>(null);
  const [expandedChecklist, setExpandedChecklist] = useState<string>("new-company");
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
  const [readinessAnswers, setReadinessAnswers] = useState<Record<string, boolean>>({});
  const [showReadinessResult, setShowReadinessResult] = useState(false);
  const [fundingFilter, setFundingFilter] = useState<string>("All");

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    console.log("Search:", query);
  };

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const toggleCheckItem = (checklistId: string, itemIndex: number) => {
    const key = `${checklistId}-${itemIndex}`;
    setChecklistState((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getChecklistProgress = (checklistId: string, itemCount: number) => {
    let completed = 0;
    for (let i = 0; i < itemCount; i++) {
      if (checklistState[`${checklistId}-${i}`]) completed++;
    }
    return Math.round((completed / itemCount) * 100);
  };

  const readinessScore = readinessQuestions.reduce((score, q) => {
    return score + (readinessAnswers[q.id] ? q.weight : 0);
  }, 0);

  const fundingCategories = ["All", ...new Set(fundingProgrammes.map((f) => f.category))];
  const filteredFunding = fundingFilter === "All" ? fundingProgrammes : fundingProgrammes.filter((f) => f.category === fundingFilter);

  return (
    <HubLayout brand="smehub" onSearch={handleSearch}>
      {/* Editorial Masthead */}
      <section className="relative border-b border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="h-[3px] bg-foreground" />
          <div className="py-6 text-center border-b border-border">
            <p className="section-label mb-2 text-secondary">Tools & Intelligence for Cyprus SMEs</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground font-serif tracking-tight">
              SMEHub<span className="text-secondary">.cy</span>
            </h1>
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

          {/* Quick Stats */}
          <div className="py-6 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto border-b border-border">
            {[
              { icon: Building2, value: "50,000+", label: "Active SMEs" },
              { icon: Euro, value: "€110B+", label: "EU Funds Available" },
              { icon: Briefcase, value: "6", label: "EU Programmes" },
              { icon: Users, value: "70%", label: "Private Employment" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <stat.icon className="h-4 w-4 text-secondary mx-auto mb-1.5" />
                <p className="text-2xl font-bold text-foreground font-serif">{stat.value}</p>
                <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sticky Section Navigation */}
      <div className="border-b border-border bg-card sticky top-14 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-0 overflow-x-auto">
            {[
              { label: "Funding", href: "#funding" },
              { label: "Checklists", href: "#checklists" },
              { label: "Interactive Tools", href: "#tools" },
              { label: "EU Resources", href: "#eu-tools" },
              { label: "Readiness", href: "#readiness" },
              { label: "Directory", href: "#directory" },
            ].map((item, i) => (
              <a
                key={item.href}
                href={item.href}
                className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] whitespace-nowrap transition-colors border-b-2 border-transparent text-muted-foreground hover:text-foreground hover:border-secondary`}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          SECTION 1: EU FUNDING MATCHMAKER
          ═══════════════════════════════════════════════ */}
      <section id="funding" className="section-rule">
        <div className="container mx-auto px-4 pb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-label text-foreground text-sm">EU Funding Matchmaker</h2>
            <span className="section-label text-secondary">{filteredFunding.length} programmes</span>
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            {fundingCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFundingFilter(cat)}
                className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.1em] font-semibold transition-colors border ${
                  fundingFilter === cat
                    ? "bg-foreground text-background border-foreground"
                    : "bg-transparent text-muted-foreground border-border hover:border-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Funding cards */}
          <div className="space-y-0 divide-y divide-border border-t border-b border-border">
            {filteredFunding.map((prog) => (
              <div key={prog.id} className="group">
                <button
                  onClick={() => setExpandedFunding(expandedFunding === prog.id ? null : prog.id)}
                  className="w-full text-left py-5 px-4 hover:bg-muted/30 transition-colors flex items-start justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className="rounded-none bg-foreground/5 text-foreground text-[10px] uppercase tracking-wider border border-border">
                        {prog.category}
                      </Badge>
                      <Badge className="rounded-none bg-success/10 text-success text-[10px] uppercase tracking-wider border border-success/20">
                        {prog.status}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-serif font-bold text-foreground group-hover:text-secondary transition-colors">
                      {prog.name}
                    </h3>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Euro className="h-3 w-3" />{prog.budget}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{prog.period}</span>
                    </div>
                  </div>
                  {expandedFunding === prog.id ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
                  )}
                </button>

                {expandedFunding === prog.id && (
                  <div className="px-4 pb-5 animate-fade-in">
                    <p className="article-body text-sm mb-4">{prog.description}</p>
                    <div className="mb-4">
                      <span className="section-label text-xs">Eligibility Requirements</span>
                      <ul className="mt-2 space-y-1.5">
                        {prog.eligibility.map((req, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                            <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <a
                      href={prog.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:underline"
                    >
                      Apply / Learn More <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 2: REGULATORY CHECKLISTS
          ═══════════════════════════════════════════════ */}
      <section id="checklists" className="section-rule bg-muted/30">
        <div className="container mx-auto px-4 pb-8">
          <h2 className="section-label text-foreground text-sm mb-6">Regulatory Checklists</h2>

          <div className="grid lg:grid-cols-12 gap-6">
            {/* Checklist selector */}
            <div className="lg:col-span-4">
              <div className="space-y-0 divide-y divide-border border border-border bg-card">
                {checklists.map((cl) => {
                  const progress = getChecklistProgress(cl.id, cl.items.length);
                  return (
                    <button
                      key={cl.id}
                      onClick={() => setExpandedChecklist(cl.id)}
                      className={`w-full text-left px-4 py-4 transition-colors ${
                        expandedChecklist === cl.id ? "bg-muted/50" : "hover:bg-muted/30"
                      }`}
                    >
                      <h4 className="font-serif font-bold text-sm text-foreground mb-1">{cl.title}</h4>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-border overflow-hidden">
                          <div
                            className="h-full bg-success transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground font-semibold">{progress}%</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active checklist */}
            <div className="lg:col-span-8">
              {checklists
                .filter((cl) => cl.id === expandedChecklist)
                .map((cl) => (
                  <div key={cl.id} className="border border-border bg-card">
                    <div className="px-5 py-4 border-b-2 border-foreground">
                      <h3 className="font-serif font-bold text-lg text-foreground">{cl.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{cl.items.length} items · Track your progress</p>
                    </div>
                    <div className="divide-y divide-border">
                      {cl.items.map((item, i) => {
                        const checked = !!checklistState[`${cl.id}-${i}`];
                        return (
                          <label
                            key={i}
                            className="flex items-start gap-3 px-5 py-3.5 cursor-pointer hover:bg-muted/30 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleCheckItem(cl.id, i)}
                              className="mt-0.5 h-4 w-4 rounded-none border-border accent-secondary"
                            />
                            <span className={`text-sm ${checked ? "line-through text-muted-foreground" : "text-foreground"}`}>
                              {item.text}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 3: INTERACTIVE TOOLS
          ═══════════════════════════════════════════════ */}
      <section id="tools" className="section-rule bg-muted/30">
        <div className="container mx-auto px-4 pb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-label text-foreground text-sm">Interactive Business Tools</h2>
            <span className="section-label text-secondary">4 tools</span>
          </div>

          <div className="space-y-8">
            {/* Row 1: Digital Maturity + VAT Calculator */}
            <div className="grid lg:grid-cols-2 gap-6">
              <DigitalMaturityAssessment />
              <CyprusVATCalculator />
            </div>

            {/* Row 2: Funding Eligibility */}
            <EUFundingEligibility />

            {/* Row 3: GDPR Checker */}
            <GDPRComplianceChecker />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 4: EU SUPPORT TOOLS DIRECTORY
          ═══════════════════════════════════════════════ */}
      <section id="eu-tools" className="section-rule">
        <div className="container mx-auto px-4 pb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-label text-foreground text-sm">EU Support Tools for SMEs</h2>
            <a
              href="https://europa.eu/youreurope/business/index_en.htm"
              target="_blank"
              rel="noopener noreferrer"
              className="section-label text-secondary flex items-center gap-1 hover:underline"
            >
              Your Europe Portal <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {euTools.map((tool, i) => (
              <a
                key={i}
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-border bg-card hover:border-secondary/50 hover:shadow-lg transition-all p-5 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-foreground/5 flex items-center justify-center">
                    <tool.icon className="h-5 w-5 text-foreground" />
                  </div>
                  <Badge className="rounded-none bg-foreground/5 text-muted-foreground text-[9px] uppercase tracking-wider border border-border">
                    {tool.category}
                  </Badge>
                </div>
                <h3 className="font-serif font-bold text-sm text-foreground mb-2 group-hover:text-secondary transition-colors leading-snug">
                  {tool.name}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{tool.description}</p>
                <div className="mt-3 flex items-center gap-1 text-[10px] uppercase tracking-wider text-secondary font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Visit <ExternalLink className="h-3 w-3" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 4: SME READINESS SCORER
          ═══════════════════════════════════════════════ */}
      <section id="readiness" className="section-rule bg-muted/30">
        <div className="container mx-auto px-4 pb-8">
          <h2 className="section-label text-foreground text-sm mb-2">SME Readiness Scorer</h2>
          <p className="article-body text-sm mb-6 max-w-2xl">
            Assess your business readiness across key regulatory and operational areas. Answer the questions below to get your compliance score.
          </p>

          <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <div className="border border-border bg-card divide-y divide-border">
                {readinessQuestions.map((q) => (
                  <label
                    key={q.id}
                    className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  >
                    <span className="text-sm text-foreground flex-1 mr-4">{q.question}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{q.weight}pts</span>
                      <input
                        type="checkbox"
                        checked={!!readinessAnswers[q.id]}
                        onChange={() => {
                          setReadinessAnswers((prev) => ({ ...prev, [q.id]: !prev[q.id] }));
                          setShowReadinessResult(true);
                        }}
                        className="h-4 w-4 rounded-none border-border accent-secondary"
                      />
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="border border-border bg-card p-6 sticky top-32">
                <h3 className="section-label text-xs mb-4">Your Score</h3>
                <div className="text-center mb-4">
                  <p className="text-5xl font-serif font-bold text-foreground">{readinessScore}</p>
                  <p className="text-sm text-muted-foreground">out of 100</p>
                </div>
                <div className="w-full h-3 bg-border overflow-hidden mb-4">
                  <div
                    className={`h-full transition-all duration-500 ${
                      readinessScore >= 80 ? "bg-success" : readinessScore >= 50 ? "bg-warning" : "bg-destructive"
                    }`}
                    style={{ width: `${readinessScore}%` }}
                  />
                </div>
                <p className="text-sm font-serif font-semibold text-foreground mb-2">
                  {readinessScore >= 80
                    ? "Excellent — Your business is well-prepared"
                    : readinessScore >= 50
                    ? "Good progress — Some areas need attention"
                    : "Early stage — Key compliance gaps to address"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {readinessScore < 80 && "Review the checklists above to address outstanding requirements."}
                </p>
                {readinessScore >= 50 && (
                  <a href="#funding" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:underline">
                    Explore funding options <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 5: SME DIRECTORY
          ═══════════════════════════════════════════════ */}
      <section id="directory" className="section-rule">
        <div className="container mx-auto px-4 pb-8">
          <h2 className="section-label text-foreground text-sm mb-6">SME Support Directory</h2>

          <div className="border border-border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-foreground">
                    <th className="text-left p-4 text-[10px] uppercase tracking-[0.1em] font-semibold text-muted-foreground">Organisation</th>
                    <th className="text-left p-4 text-[10px] uppercase tracking-[0.1em] font-semibold text-muted-foreground hidden md:table-cell">Type</th>
                    <th className="text-left p-4 text-[10px] uppercase tracking-[0.1em] font-semibold text-muted-foreground hidden lg:table-cell">Location</th>
                    <th className="text-left p-4 text-[10px] uppercase tracking-[0.1em] font-semibold text-muted-foreground">Services</th>
                    <th className="text-left p-4 text-[10px] uppercase tracking-[0.1em] font-semibold text-muted-foreground">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {smeDirectory.map((org, i) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="p-4 font-serif font-semibold text-foreground text-sm">{org.name}</td>
                      <td className="p-4 hidden md:table-cell">
                        <Badge variant="outline" className="rounded-none text-[10px] uppercase tracking-wider">{org.type}</Badge>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground hidden lg:table-cell">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{org.location}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {org.services.slice(0, 3).map((s, j) => (
                            <span key={j} className="text-[10px] bg-foreground/5 px-2 py-0.5 text-muted-foreground">{s}</span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">
                        <a
                          href={org.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-secondary hover:underline"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-rule">
        <div className="container mx-auto px-4 pb-8">
          <div className="navy-gradient text-primary-foreground py-10 px-8 text-center">
            <h2 className="text-2xl md:text-3xl font-serif font-bold mb-4">Need Personalised SME Guidance?</h2>
            <p className="text-primary-foreground/70 mb-6 max-w-xl mx-auto article-body text-base">
              Connect with verified consultants, accountants, and EU funding advisors through our directory.
            </p>
            <Link to="/directory">
              <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2 rounded-none font-sans text-sm font-semibold tracking-wide uppercase">
                Find an Advisor
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 border-t border-border">
        <div className="container mx-auto px-4">
          <p className="text-sm text-muted-foreground text-center">
            Information provided is for guidance purposes only and does not constitute legal, tax, or financial advice.
            Always consult qualified professionals for your specific circumstances.
          </p>
        </div>
      </section>
    </HubLayout>
  );
}
