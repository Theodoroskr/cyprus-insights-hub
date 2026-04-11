import { TrendingUp, TrendingDown, Globe, Factory, BarChart3, Landmark } from "lucide-react";

interface TradeKPIStripProps {
  snapshot: any;
}

function formatEur(value: number | null | undefined) {
  if (!value) return "—";
  if (value >= 1_000_000_000) return `€${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `€${(value / 1_000).toFixed(0)}K`;
  return `€${value.toFixed(0)}`;
}

function formatPct(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function TradeKPIStrip({ snapshot }: TradeKPIStripProps) {
  const kpis = [
    {
      label: "Total Imports",
      value: formatEur(snapshot?.total_imports_eur),
      icon: BarChart3,
      color: "text-primary",
    },
    {
      label: "MoM Growth",
      value: formatPct(snapshot?.mom_growth_pct),
      icon: snapshot?.mom_growth_pct >= 0 ? TrendingUp : TrendingDown,
      color: snapshot?.mom_growth_pct >= 0 ? "text-green-600" : "text-destructive",
    },
    {
      label: "YoY Growth",
      value: formatPct(snapshot?.yoy_growth_pct),
      icon: snapshot?.yoy_growth_pct >= 0 ? TrendingUp : TrendingDown,
      color: snapshot?.yoy_growth_pct >= 0 ? "text-green-600" : "text-destructive",
    },
    {
      label: "Top Country",
      value: snapshot?.trade_countries?.country_name ?? "—",
      sub: snapshot?.top_import_country_value_eur ? formatEur(snapshot.top_import_country_value_eur) : undefined,
      icon: Globe,
      color: "text-primary",
    },
    {
      label: "Top Sector",
      value: snapshot?.top_import_sector ?? "—",
      sub: snapshot?.top_import_sector_value_eur ? formatEur(snapshot.top_import_sector_value_eur) : undefined,
      icon: Factory,
      color: "text-primary",
    },
    {
      label: "EU Share",
      value: snapshot?.eu_share_pct ? `${snapshot.eu_share_pct.toFixed(1)}%` : "—",
      icon: Landmark,
      color: "text-primary",
    },
  ];

  return (
    <section className="border-b border-border bg-card">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="text-center px-3">
              <kpi.icon className={`h-5 w-5 mx-auto mb-2 ${kpi.color}`} />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                {kpi.label}
              </p>
              <p className="text-lg font-bold text-foreground leading-tight">{kpi.value}</p>
              {kpi.sub && (
                <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
