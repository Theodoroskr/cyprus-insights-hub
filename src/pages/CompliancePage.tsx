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
  TrendingUp
} from "lucide-react";
import { OperationaliseBanner } from "@/components/banners/OperationaliseBanner";

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
  },
  {
    id: 2,
    title: "CySEC Circular on Crypto-Asset Services",
    source: "CySEC",
    date: "2024-01-12",
    severity: "medium" as const,
    description: "Guidance on MiCA transitional arrangements for Cyprus-based CASPs.",
  },
  {
    id: 3,
    title: "FATF Grey List Update",
    source: "FATF",
    date: "2024-01-10",
    severity: "high" as const,
    description: "Changes to jurisdictions under increased monitoring.",
  },
  {
    id: 4,
    title: "ESG Reporting Requirements",
    source: "EU Commission",
    date: "2024-01-08",
    severity: "low" as const,
    description: "New sustainability disclosure standards for financial entities.",
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

  return (
    <HubLayout brand="compliancehub" onSearch={handleSearch}>
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-compliance to-compliance-light" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
              <Shield className="h-7 w-7 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            ComplianceHub<span className="text-secondary">.cy</span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-8">
            Regulatory intelligence and risk management for Cyprus businesses.
          </p>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mt-12">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white/10 backdrop-blur rounded-lg p-4">
                <stat.icon className="h-5 w-5 text-secondary mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Regulatory Alerts */}
      <section id="alerts" className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-foreground">Latest Regulatory Alerts</h2>
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              Live Updates
            </Badge>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {alerts.map((alert) => (
              <Card key={alert.id} className="hover:shadow-lg transition-shadow border-border">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{alert.date}</span>
                  </div>
                  <CardTitle className="text-lg text-foreground mt-2">{alert.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                  <p className="text-xs text-muted-foreground">Source: {alert.source}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance Areas */}
      <section id="aml" className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground mb-8">Compliance Areas</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {complianceAreas.map((area, index) => (
              <Link to="/resources" key={index}>
                <Card className="hover:shadow-lg transition-all hover:border-compliance/50 cursor-pointer h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-full bg-compliance/10 flex items-center justify-center">
                        <area.icon className="h-6 w-6 text-compliance" />
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {area.updates} updates
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">{area.name}</h3>
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

      {/* Country Risk Tracker */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground mb-8">Country Risk Tracker</h2>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 font-medium text-muted-foreground">Country</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Risk Level</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Score</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {countryRisks.map((item, index) => (
                      <tr key={index} className="border-b border-border last:border-0 hover:bg-muted/50">
                        <td className="p-4 font-medium text-foreground">{item.country}</td>
                        <td className={`p-4 font-semibold ${getRiskColor(item.risk)}`}>{item.risk}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${item.score > 80 ? 'bg-destructive' : item.score > 60 ? 'bg-warning' : 'bg-success'}`}
                                style={{ width: `${item.score}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground">{item.score}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className={
                            item.trend === "improving" ? "text-success border-success/30" :
                            item.trend === "worsening" ? "text-destructive border-destructive/30" :
                            "text-muted-foreground"
                          }>
                            {item.trend}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <Card className="bg-compliance text-white border-0">
            <CardContent className="py-10 text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Full Compliance Dashboard</h2>
              <p className="text-white/80 mb-6 max-w-xl mx-auto">
                Access comprehensive compliance tools, document templates, and regulatory guidance.
              </p>
              <Link to="/resources">
                <Button variant="secondary" size="lg" className="gap-2">
                  Explore Resources
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

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
