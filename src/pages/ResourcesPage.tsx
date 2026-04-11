import { useState } from "react";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { FileText, Shield, Globe, Euro, Building, Clock, ArrowRight, BookOpen, Download, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const tabs = ["All", "Guides", "Regulatory", "EU Funding", "Reports"] as const;
type Tab = typeof tabs[number];

interface Resource {
  id: string;
  title: string;
  summary: string;
  category: Tab;
  date: string;
  readTime: string;
  author: string;
  featured?: boolean;
  image?: string;
  type: "article" | "report" | "guide";
}

const resources: Resource[] = [
  {
    id: "1",
    title: "The Complete Guide to MiCA Compliance for Cyprus-Based Crypto Firms",
    summary: "A comprehensive walkthrough of the Markets in Crypto-Assets regulation and what it means for firms operating from Cyprus as their EU gateway.",
    category: "Regulatory",
    date: "March 28, 2026",
    readTime: "12 min read",
    author: "ComplianceHub Editorial",
    featured: true,
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
    type: "guide",
  },
  {
    id: "2",
    title: "EU Funding Opportunities for Cypriot SMEs: 2026 Edition",
    summary: "Navigating Horizon Europe, Digital Europe Programme, and structural funds available to small and medium enterprises in Cyprus.",
    category: "EU Funding",
    date: "March 25, 2026",
    readTime: "8 min read",
    author: "EU Desk",
    type: "report",
  },
  {
    id: "3",
    title: "AML/KYC Obligations: A Practical Checklist for New Licensees",
    summary: "Step-by-step compliance checklist for firms recently licensed by CySEC, covering customer due diligence, transaction monitoring, and reporting.",
    category: "Regulatory",
    date: "March 22, 2026",
    readTime: "6 min read",
    author: "ComplianceHub Editorial",
    type: "guide",
  },
  {
    id: "4",
    title: "Cyprus as a FinTech Hub: Market Entry Strategy",
    summary: "Why international fintech firms are choosing Cyprus and how to structure operations for maximum regulatory and tax efficiency.",
    category: "Guides",
    date: "March 20, 2026",
    readTime: "10 min read",
    author: "FinTechHub Editorial",
    type: "guide",
  },
  {
    id: "5",
    title: "DORA Implementation Timeline and Key Requirements",
    summary: "The Digital Operational Resilience Act deadline is approaching. Here's what financial entities in Cyprus need to prepare.",
    category: "Regulatory",
    date: "March 18, 2026",
    readTime: "7 min read",
    author: "ComplianceHub Editorial",
    type: "article",
  },
  {
    id: "6",
    title: "Annual Corporate Governance Report: Best Practices 2026",
    summary: "Reviewing substance requirements, board composition standards, and governance frameworks for Cyprus-registered companies.",
    category: "Reports",
    date: "March 15, 2026",
    readTime: "15 min read",
    author: "BusinessHub Research",
    type: "report",
  },
  {
    id: "7",
    title: "Horizon Europe: How to Write a Winning Grant Proposal",
    summary: "Practical tips from successful applicants on structuring proposals, building consortia, and meeting evaluation criteria.",
    category: "EU Funding",
    date: "March 12, 2026",
    readTime: "9 min read",
    author: "EU Desk",
    type: "guide",
  },
  {
    id: "8",
    title: "NIS2 Directive: Cybersecurity Compliance for Financial Services",
    summary: "Understanding the Network and Information Systems Directive and its impact on Cyprus-based financial services firms.",
    category: "Regulatory",
    date: "March 10, 2026",
    readTime: "8 min read",
    author: "ComplianceHub Editorial",
    type: "article",
  },
];

const typeIcons: Record<string, typeof FileText> = {
  article: FileText,
  report: Download,
  guide: BookOpen,
};

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("All");
  const handleSearch = (query: string) => console.log("Search:", query);

  const filtered = activeTab === "All" ? resources : resources.filter((r) => r.category === activeTab);
  const featured = filtered.find((r) => r.featured) || filtered[0];
  const rest = filtered.filter((r) => r.id !== featured?.id);

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation onSearch={handleSearch} />

      {/* Masthead */}
      <section className="border-b border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="h-[3px] bg-foreground" />
          <div className="py-8 text-center">
            <span className="section-label text-secondary mb-2 block">BusinessHub.cy</span>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
              Resource Hub
            </h1>
            <p className="article-body text-base mt-2 max-w-xl mx-auto">
              Guides, regulatory explainers &amp; intelligence reports for operating in Cyprus and the EU.
            </p>
          </div>
        </div>
      </section>

      {/* Filter tabs — newspaper section tabs */}
      <div className="border-b border-border bg-card sticky top-14 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-0 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] whitespace-nowrap transition-colors border-b-2
                  ${activeTab === tab
                    ? "border-secondary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {featured && (
          <>
            {/* Featured article — newspaper lead */}
            <div className="grid lg:grid-cols-12 gap-0 mb-8">
              <div className="lg:col-span-7 lg:pr-6 lg:border-r border-border">
                <article className="group cursor-pointer">
                  {featured.image && (
                    <div className="overflow-hidden mb-4">
                      <img
                        src={featured.image}
                        alt={featured.title}
                        className="w-full h-56 md:h-72 object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                      />
                    </div>
                  )}
                  <Badge className="bg-foreground text-background rounded-none text-[10px] uppercase tracking-wider font-sans mb-3">
                    {featured.category}
                  </Badge>
                  <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground leading-tight mb-3 group-hover:text-secondary transition-colors">
                    {featured.title}
                  </h2>
                  <p className="article-body text-base mb-4">{featured.summary}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="byline">By {featured.author}</span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span>{featured.date}</span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{featured.readTime}</span>
                  </div>
                </article>
              </div>

              {/* Sidebar highlights */}
              <div className="lg:col-span-5 lg:pl-6 pt-6 lg:pt-0">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-4 w-4 text-secondary" />
                  <span className="section-label">Most Read</span>
                </div>
                <div className="divide-y divide-border">
                  {rest.slice(0, 4).map((r, i) => {
                    const TypeIcon = typeIcons[r.type] || FileText;
                    return (
                      <article key={r.id} className="py-4 first:pt-0 group cursor-pointer">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl font-serif font-bold text-muted-foreground/30 leading-none">{String(i + 1).padStart(2, "0")}</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-serif font-bold text-sm text-foreground leading-snug mb-1 group-hover:text-secondary transition-colors">
                              {r.title}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <TypeIcon className="h-3 w-3" />
                              <span>{r.readTime}</span>
                              <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/50" />
                              <span>{r.category}</span>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Article grid */}
        <div className="border-t border-foreground pt-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="section-label">All Resources</span>
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">{filtered.length} items</span>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-0">
            {rest.map((r, i) => {
              const TypeIcon = typeIcons[r.type] || FileText;
              return (
                <article
                  key={r.id}
                  className={`py-5 px-4 group cursor-pointer hover:bg-muted/30 transition-colors
                    ${i % 3 !== 2 ? "lg:border-r border-border" : ""}
                    ${i >= 3 ? "border-t border-border" : ""}
                    ${i % 2 !== 0 && i < 3 ? "md:border-r" : ""}
                  `}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="rounded-none text-[10px] uppercase tracking-wider font-sans border-muted-foreground/30">
                      {r.category}
                    </Badge>
                    <TypeIcon className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <h3 className="font-serif font-bold text-foreground leading-snug mb-2 group-hover:text-secondary transition-colors">
                    {r.title}
                  </h3>
                  <p className="article-body text-sm line-clamp-2 mb-3">{r.summary}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{r.date}</span>
                      <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/50" />
                      <span>{r.readTime}</span>
                    </div>
                    <ArrowRight className="h-3 w-3 text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </main>

      {/* Disclaimer */}
      <section className="py-6 border-t border-border">
        <div className="container mx-auto px-4">
          <p className="text-xs text-muted-foreground text-center italic font-source-serif">
            Content is informational only and does not replace professional advisory services.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
