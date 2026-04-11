import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Lock, Shield, ChevronDown, ChevronUp } from "lucide-react";
import { LoginModal } from "@/components/auth/LoginModal";

interface CountryRisk {
  id: string;
  country_name: string;
  country_code: string;
  risk_score: number;
  risk_level: string;
  fatf_status: string;
  key_concerns: string[];
  region: string | null;
}

const riskLevelConfig: Record<string, { label: string; color: string; bg: string }> = {
  very_high: { label: "Very High", color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/30" },
  high: { label: "High", color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-900/30" },
  medium_high: { label: "Medium-High", color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30" },
  medium: { label: "Medium", color: "text-yellow-600", bg: "bg-yellow-100 dark:bg-yellow-900/30" },
  low: { label: "Low", color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
  very_low: { label: "Very Low", color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30" },
};

const FREE_LIMIT = 5;

export function CountryRiskTable() {
  const { user } = useAuth();
  const [countries, setCountries] = useState<CountryRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [sortField, setSortField] = useState<"risk_score" | "country_name">("risk_score");
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    supabase
      .from("country_risk_scores")
      .select("id, country_name, country_code, risk_score, risk_level, fatf_status, key_concerns, region")
      .eq("is_active", true)
      .order("risk_score", { ascending: false })
      .then(({ data }) => {
        if (data) setCountries(data as CountryRisk[]);
        setLoading(false);
      });
  }, []);

  const sorted = [...countries].sort((a, b) => {
    const mul = sortAsc ? 1 : -1;
    if (sortField === "risk_score") return (a.risk_score - b.risk_score) * mul;
    return a.country_name.localeCompare(b.country_name) * mul;
  });

  const visibleCountries = user ? sorted : sorted.slice(0, FREE_LIMIT);
  const hiddenCount = user ? 0 : Math.max(0, sorted.length - FREE_LIMIT);

  const toggleSort = (field: "risk_score" | "country_name") => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === "country_name");
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null;
    return sortAsc ? <ChevronUp className="h-3 w-3 inline ml-1" /> : <ChevronDown className="h-3 w-3 inline ml-1" />;
  };

  if (loading) {
    return <div className="text-muted-foreground text-sm py-8 text-center">Loading risk data…</div>;
  }

  return (
    <>
      <div className="border border-border rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-muted/50 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground border-b border-border">
          <div className="col-span-1 text-center">#</div>
          <div
            className="col-span-3 cursor-pointer hover:text-foreground transition-colors"
            onClick={() => toggleSort("country_name")}
          >
            Country <SortIcon field="country_name" />
          </div>
          <div
            className="col-span-2 text-center cursor-pointer hover:text-foreground transition-colors"
            onClick={() => toggleSort("risk_score")}
          >
            Risk Score <SortIcon field="risk_score" />
          </div>
          <div className="col-span-2 text-center">Risk Level</div>
          <div className="col-span-2 text-center">FATF Status</div>
          <div className="col-span-2 hidden md:block">Key Concerns</div>
        </div>

        {/* Table Rows */}
        {visibleCountries.map((country, index) => {
          const config = riskLevelConfig[country.risk_level] || riskLevelConfig.medium;
          return (
            <div
              key={country.id}
              className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border last:border-0 hover:bg-muted/30 transition-colors items-center text-sm"
            >
              <div className="col-span-1 text-center text-muted-foreground text-xs font-mono">
                {index + 1}
              </div>
              <div className="col-span-3">
                <span className="font-medium text-foreground">{country.country_name}</span>
                <span className="text-muted-foreground text-xs ml-1.5">({country.country_code})</span>
              </div>
              <div className="col-span-2 text-center">
                <span className={`font-bold font-mono text-base ${config.color}`}>
                  {country.risk_score.toFixed(2)}
                </span>
              </div>
              <div className="col-span-2 text-center">
                <Badge variant="outline" className={`text-[10px] ${config.bg} ${config.color} border-0`}>
                  {config.label}
                </Badge>
              </div>
              <div className="col-span-2 text-center">
                <span className={`text-xs ${
                  country.fatf_status === "FATF Blacklist" ? "text-red-600 font-semibold" :
                  country.fatf_status === "FATF Greylist" ? "text-amber-600 font-semibold" :
                  country.fatf_status === "Sanctioned" ? "text-red-600 font-semibold" :
                  "text-muted-foreground"
                }`}>
                  {country.fatf_status}
                </span>
              </div>
              <div className="col-span-2 hidden md:flex gap-1 flex-wrap">
                {country.key_concerns.slice(0, 2).map((concern, i) => (
                  <span key={i} className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {concern}
                  </span>
                ))}
              </div>
            </div>
          );
        })}

        {/* Gated rows overlay */}
        {hiddenCount > 0 && (
          <div className="relative">
            {/* Blurred preview rows */}
            {sorted.slice(FREE_LIMIT, FREE_LIMIT + 2).map((country, index) => {
              const config = riskLevelConfig[country.risk_level] || riskLevelConfig.medium;
              return (
                <div
                  key={country.id}
                  className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border items-center text-sm blur-[6px] select-none pointer-events-none"
                >
                  <div className="col-span-1 text-center text-muted-foreground text-xs font-mono">{FREE_LIMIT + index + 1}</div>
                  <div className="col-span-3 font-medium text-foreground">{country.country_name}</div>
                  <div className="col-span-2 text-center font-bold font-mono">{country.risk_score.toFixed(2)}</div>
                  <div className="col-span-2 text-center"><Badge variant="outline" className="text-[10px]">{config.label}</Badge></div>
                  <div className="col-span-2 text-center text-xs">{country.fatf_status}</div>
                  <div className="col-span-2" />
                </div>
              );
            })}

            {/* CTA overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-background via-background/90 to-background/50">
              <div className="text-center">
                <Lock className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground mb-1">
                  +{hiddenCount} more countries
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  Sign in for free to view the full country risk index
                </p>
                <Button size="sm" onClick={() => setShowLoginModal(true)} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-xs">
                  Sign in to unlock
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Source attribution */}
      <p className="text-[10px] text-muted-foreground/50 mt-3 text-right">
        Based on Basel AML Index methodology · Updated periodically · For informational purposes only
      </p>

      <LoginModal open={showLoginModal} onOpenChange={setShowLoginModal} />
    </>
  );
}
