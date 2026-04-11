import { useState } from "react";
import { Link } from "react-router-dom";
import { HubLayout } from "@/layouts/HubLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  FileSearch,
  Scale,
  Globe,
  TrendingUp,
  Calendar
} from "lucide-react";
import { OperationaliseBanner } from "@/components/banners/OperationaliseBanner";
import { PremiumCTABanner } from "@/components/banners/PremiumCTABanner";

const stats = [
  { label: "Active Regulations", value: "25+", icon: Scale },
  { label: "Countries Monitored", value: "40+", icon: Globe },
  { label: "Compliance Rate", value: "94%", icon: TrendingUp },
  { label: "Daily Alerts", value: "50+", icon: AlertTriangle },
];

const alerts = [
  {
    id: 1,
    title: "New AML Directive Implementation",
    source: "EU Commission",
    date: "2024-01-15",
    severity: "high" as const,
    description: "Updated requirements for customer due diligence procedures.",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=80",
  },
  {
    id: 2,
    title: "CySEC Circular on Crypto-Asset Services",
    source: "CySEC",
    date: "2024-01-12",
    severity: "medium" as const,
    description: "Guidance on MiCA transitional arrangements for Cyprus-based CASPs.",
    image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&q=80",
  },
  {
    id: 3,
    title: "FATF Grey List Update",
    source: "FATF",
    date: "2024-01-10",
    severity: "high" as const,
    description: "Changes to jurisdictions under increased monitoring.",
    image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600&q=80",
  },
  {
    id: 4,
    title: "ESG Reporting Requirements",
    source: "EU Commission",
    date: "2024-01-08",
    severity: "low" as const,
    description: "New sustainability disclosure standards for financial entities.",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80",
  },
];

const complianceAreas = [
  { 
    name: "AML/KYC", 
    icon: Shield, 
    description: "Anti-Money Laundering & Know Your Customer",
    status: "Active",
    updates: 12
  },
  { 
    name: "GDPR", 
    icon: FileSearch, 
    description: "Data Protection & Privacy Compliance",
    status: "Active",
    updates: 5
  },
  { 
    name: "MiFID II", 
    icon: Scale, 
    description: "Markets in Financial Instruments",
    status: "Active",
    updates: 8
  },
  { 
    name: "FATCA/CRS", 
    icon: Globe, 
    description: "Tax Reporting & Exchange of Information",
    status: "Active",
    updates: 3
  },
];

const countryRisks = [
  { country: "United Arab Emirates", risk: "Medium", score: 65, trend: "improving" },
  { country: "Turkey", risk: "High", score: 78, trend: "stable" },
  { country: "Serbia", risk: "Medium", score: 55, trend: "improving" },
  { country: "Russia", risk: "Very High", score: 95, trend: "worsening" },
];

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "high":
      return "bg-destructive/10 text-destructive border-destructive/30";
    case "medium":
      return "bg-warning/10 text-warning border-warning/30";
    case "low":
      return "bg-success/10 text-success border-success/30";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getRiskColor = (risk: string) => {
  switch (risk) {
    case "Very High":
      return "text-destructive";
    case "High":
      return "text-orange-500";
    case "Medium":
      return "text-warning";
    case "Low":
      return "text-success";
    default:
      return "text-muted-foreground";
  }
};

export default function CompliancePage() {
  const [searchQuery, setSearchQuery] = useState("");

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

          {/* Quick Stats — editorial row */}
          <div className="py-6 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto border-b border-border">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <stat.icon className="h-4 w-4 text-secondary mx-auto mb-1.5" />
                <p className="text-2xl font-bold text-foreground font-serif">{stat.value}</p>
                <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Regulatory Alerts — newspaper style */}
      <section id="alerts" className="section-rule">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-label text-foreground text-sm">Latest Regulatory Alerts</h2>
            <Badge variant="outline" className="gap-1 rounded-none text-[10px] uppercase tracking-wider">
              <Clock className="h-3 w-3" />
              Live Updates
            </Badge>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {alerts.map((alert) => (
              <article key={alert.id} className="border border-border rounded-lg overflow-hidden group cursor-pointer hover:border-secondary/40 transition-colors">
                <div className="relative h-40 overflow-hidden">
                  <img src={alert.image} alt={alert.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/50 to-transparent" />
                  <Badge className={`absolute top-3 left-3 rounded-none text-[10px] uppercase tracking-wider ${getSeverityColor(alert.severity)}`}>
                    {alert.severity}
                  </Badge>
                  <span className="absolute top-3 right-3 text-xs text-white/80 drop-shadow">{alert.date}</span>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-serif font-bold text-foreground mb-2 group-hover:text-secondary transition-colors">
                    {alert.title}
                  </h3>
                  <p className="article-body text-muted-foreground mb-2">{alert.description}</p>
                  <p className="byline">Source: {alert.source}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance Areas — editorial cards */}
      <section id="aml" className="section-rule bg-muted/30">
        <div className="container mx-auto px-4 pb-8">
          <h2 className="section-label text-foreground text-sm mb-6">Compliance Areas</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {complianceAreas.map((area, index) => (
              <Link to="/resources" key={index}>
                <Card className="hover:shadow-lg transition-all hover:border-secondary/50 cursor-pointer h-full rounded-none border-border">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-none bg-foreground/5 flex items-center justify-center">
                        <area.icon className="h-6 w-6 text-foreground" />
                      </div>
                      <Badge variant="outline" className="text-[10px] rounded-none uppercase tracking-wider">
                        {area.updates} updates
                      </Badge>
                    </div>
                    <h3 className="font-serif font-semibold text-foreground mb-1">{area.name}</h3>
                    <p className="text-sm text-muted-foreground">{area.description}</p>
                    <div className="flex items-center gap-1 mt-3">
                      <CheckCircle2 className="h-3 w-3 text-success" />
                      <span className="text-xs text-success">{area.status}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Operationalise Compliance Banner */}
      <div className="container mx-auto px-4 py-8">
        <OperationaliseBanner />
      </div>

      {/* Country Risk Tracker — editorial table */}
      <section className="section-rule">
        <div className="container mx-auto px-4 pb-8">
          <h2 className="section-label text-foreground text-sm mb-6">Country Risk Tracker</h2>
          <div className="border border-border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-foreground">
                    <th className="text-left p-4 text-[10px] uppercase tracking-[0.1em] font-semibold text-muted-foreground">Country</th>
                    <th className="text-left p-4 text-[10px] uppercase tracking-[0.1em] font-semibold text-muted-foreground">Risk Level</th>
                    <th className="text-left p-4 text-[10px] uppercase tracking-[0.1em] font-semibold text-muted-foreground">Score</th>
                    <th className="text-left p-4 text-[10px] uppercase tracking-[0.1em] font-semibold text-muted-foreground">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {countryRisks.map((item, index) => (
                    <tr key={index} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="p-4 font-serif font-medium text-foreground">{item.country}</td>
                      <td className={`p-4 font-semibold ${getRiskColor(item.risk)}`}>{item.risk}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-muted overflow-hidden">
                            <div 
                              className={`h-full ${item.score > 80 ? 'bg-destructive' : item.score > 60 ? 'bg-warning' : 'bg-success'}`}
                              style={{ width: `${item.score}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">{item.score}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className={`rounded-none text-[10px] uppercase tracking-wider ${
                          item.trend === "improving" ? "text-success border-success/30" :
                          item.trend === "worsening" ? "text-destructive border-destructive/30" :
                          "text-muted-foreground"
                        }`}>
                          {item.trend}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section — editorial */}
      <section className="section-rule">
        <div className="container mx-auto px-4 pb-8">
          <div className="navy-gradient text-primary-foreground py-10 px-8 text-center">
            <h2 className="text-2xl md:text-3xl font-serif font-bold mb-4">Full Compliance Dashboard</h2>
            <p className="text-primary-foreground/70 mb-6 max-w-xl mx-auto article-body text-base">
              Access comprehensive compliance tools, document templates, and regulatory guidance.
            </p>
            <Link to="/resources">
              <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2 rounded-none font-sans text-sm font-semibold tracking-wide uppercase">
                Explore Resources
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Premium CTA */}
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
