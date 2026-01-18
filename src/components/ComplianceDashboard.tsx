import { Shield, AlertTriangle, Globe, TrendingUp, Clock, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface RegulatoryAlert {
  id: string;
  title: string;
  source: string;
  date: string;
  severity: "high" | "medium" | "low";
}

const amlReadiness = 78;

const alerts: RegulatoryAlert[] = [
  {
    id: "1",
    title: "New AML Directive Implementation Deadline Extended",
    source: "CySEC",
    date: "Jan 15, 2024",
    severity: "high",
  },
  {
    id: "2",
    title: "Updated KYC Requirements for Investment Firms",
    source: "CBC",
    date: "Jan 12, 2024",
    severity: "medium",
  },
  {
    id: "3",
    title: "FATF Mutual Evaluation Report Published",
    source: "MOKAS",
    date: "Jan 10, 2024",
    severity: "low",
  },
];

const countryRisk = {
  score: "Low",
  rating: "A",
  trend: "stable",
};

function CircularProgress({ percentage }: { percentage: number }) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg className="progress-ring w-full h-full" viewBox="0 0 100 100">
        <circle
          className="text-muted"
          strokeWidth="8"
          stroke="currentColor"
          fill="transparent"
          r="45"
          cx="50"
          cy="50"
        />
        <circle
          className="text-secondary transition-all duration-1000"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r="45"
          cx="50"
          cy="50"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-primary">{percentage}%</span>
      </div>
    </div>
  );
}

export function ComplianceDashboard() {
  return (
    <section id="compliance" className="py-8 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-primary">Compliance & Risk Dashboard</h2>
            <p className="text-muted-foreground text-sm">Monitor regulatory requirements and risk metrics</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* AML Readiness Tracker */}
          <div className="bento-card text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-secondary" />
              <h3 className="font-semibold text-primary">AML Readiness Tracker</h3>
            </div>
            <CircularProgress percentage={amlReadiness} />
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">KYC Procedures</span>
                <span className="font-medium text-success">Complete</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Staff Training</span>
                <span className="font-medium text-warning">In Progress</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Documentation</span>
                <span className="font-medium text-success">Complete</span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4">
              View Full Report
              <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
          </div>

          {/* Latest Regulatory Alerts */}
          <div className="bento-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-secondary" />
                <h3 className="font-semibold text-primary">Regulatory Alerts</h3>
              </div>
              <Badge variant="secondary" className="text-xs">{alerts.length} New</Badge>
            </div>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        alert.severity === "high"
                          ? "bg-destructive"
                          : alert.severity === "medium"
                          ? "bg-warning"
                          : "bg-success"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-primary line-clamp-2 group-hover:text-secondary transition-colors">
                        {alert.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{alert.source}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {alert.date}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-4 text-secondary hover:text-secondary hover:bg-secondary/10">
              View All Alerts
            </Button>
          </div>

          {/* Country Risk Score */}
          <div className="bento-card text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Globe className="h-5 w-5 text-secondary" />
              <h3 className="font-semibold text-primary">Country Risk Score</h3>
            </div>
            <div className="relative">
              <div className="w-24 h-24 mx-auto rounded-full bg-success/20 flex items-center justify-center mb-4">
                <span className="text-4xl font-bold text-success">{countryRisk.rating}</span>
              </div>
              <Badge className="bg-success text-success-foreground mb-2">{countryRisk.score} Risk</Badge>
              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-success" />
                <span>Trend: {countryRisk.trend}</span>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-border">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">FATF Status</p>
                  <p className="font-medium text-success">Compliant</p>
                </div>
                <div>
                  <p className="text-muted-foreground">EU AML Rating</p>
                  <p className="font-medium text-success">Green</p>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4">
              View Risk Analysis
              <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
