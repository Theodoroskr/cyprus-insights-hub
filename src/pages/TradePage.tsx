import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { HubLayout } from "@/layouts/HubLayout";
import { TradeKPIStrip } from "@/components/trade/TradeKPIStrip";
import { TradeImportTrend } from "@/components/trade/TradeImportTrend";
import { TradeTopCountries } from "@/components/trade/TradeTopCountries";
import { TradeTopSectors } from "@/components/trade/TradeTopSectors";
import { TradeEUSplit } from "@/components/trade/TradeEUSplit";
import { TradeExecutiveInsight } from "@/components/trade/TradeExecutiveInsight";
import { ContentGate } from "@/components/auth/ContentGate";
import { PremiumGate } from "@/components/auth/PremiumGate";
import { TrendingUp, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TradePage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));

  const { data: kpiSnapshot } = useQuery({
    queryKey: ["trade-kpi", selectedYear],
    queryFn: async () => {
      const { data } = await supabase
        .from("trade_kpi_snapshots")
        .select("*, trade_countries(country_name)")
        .order("date_month", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const { data: monthlyTotals } = useQuery({
    queryKey: ["trade-monthly-totals", selectedYear],
    queryFn: async () => {
      const { data } = await supabase
        .from("trade_monthly_totals")
        .select("*")
        .eq("year", parseInt(selectedYear))
        .order("month", { ascending: true });
      return data ?? [];
    },
  });

  const { data: topCountries } = useQuery({
    queryKey: ["trade-top-countries", selectedYear],
    queryFn: async () => {
      const { data } = await supabase
        .from("trade_country_monthly")
        .select("*, trade_countries(country_name, country_code, eu_member)")
        .order("date_month", { ascending: false })
        .limit(1)
        .then(({ data: latest }) => {
          if (!latest?.[0]) return { data: [] };
          return supabase
            .from("trade_country_monthly")
            .select("*, trade_countries(country_name, country_code, eu_member)")
            .eq("date_month", latest[0].date_month)
            .order("rank_position", { ascending: true })
            .limit(10);
        });
      return data ?? [];
    },
  });

  const { data: topSectors } = useQuery({
    queryKey: ["trade-top-sectors", selectedYear],
    queryFn: async () => {
      const { data: latest } = await supabase
        .from("trade_sector_monthly")
        .select("date_month")
        .order("date_month", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!latest) return [];
      const { data } = await supabase
        .from("trade_sector_monthly")
        .select("*")
        .eq("date_month", latest.date_month)
        .order("rank_position", { ascending: true })
        .limit(10);
      return data ?? [];
    },
  });

  const { data: insight } = useQuery({
    queryKey: ["trade-insight"],
    queryFn: async () => {
      const { data } = await supabase
        .from("trade_ai_insights")
        .select("*")
        .eq("is_published", true)
        .eq("insight_type", "monthly_summary")
        .order("date_month", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const years = Array.from({ length: 5 }, (_, i) => String(currentYear - i));

  return (
    <HubLayout brand="businesshub">
      {/* Hero */}
      <section className="bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-secondary/20">
              <TrendingUp className="h-6 w-6 text-secondary" />
            </div>
            <span className="text-xs font-medium tracking-widest uppercase text-secondary">
              Cyprus Trade Intelligence
            </span>
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-bold mb-3 leading-tight">
            Trade & Import Analytics
          </h1>
          <p className="text-primary-foreground/70 max-w-2xl text-base md:text-lg font-light">
            Executive-level insights into Cyprus trade flows, import trends, and partner analysis. 
          </p>
          <div className="flex items-center gap-4 mt-6">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[120px] bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* KPI Strip - FREE */}
      <TradeKPIStrip snapshot={kpiSnapshot} />

      {/* Import Trend Chart - FREE */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <TradeImportTrend data={monthlyTotals ?? []} />
      </section>

      {/* Gated detailed sections */}
      <section className="max-w-7xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Countries - PREMIUM */}
          <div className="lg:col-span-2">
            <PremiumGate message="Unlock detailed country breakdowns" blurHeight="320px">
              <TradeTopCountries data={topCountries ?? []} />
            </PremiumGate>
          </div>

          {/* EU vs Non-EU Split - PREMIUM */}
          <div>
            <PremiumGate message="Unlock EU trade analysis" blurHeight="320px">
              <TradeEUSplit snapshot={kpiSnapshot} />
            </PremiumGate>
          </div>
        </div>
      </section>

      {/* Top Sectors - PREMIUM */}
      <section className="max-w-7xl mx-auto px-4 pb-8">
        <PremiumGate message="Unlock sector intelligence" blurHeight="300px">
          <TradeTopSectors data={topSectors ?? []} />
        </PremiumGate>
      </section>

      {/* Executive Insight - PREMIUM */}
      <section className="max-w-7xl mx-auto px-4 pb-8">
        <PremiumGate message="Unlock executive trade summaries" blurHeight="250px">
          <TradeExecutiveInsight insight={insight} />
        </PremiumGate>
      </section>

      {/* Data disclaimer */}
      <div className="max-w-7xl mx-auto px-4 pb-4">
        <p className="text-[11px] text-muted-foreground/60 text-center">
          Powered by CYSTAT official data, updated monthly.
        </p>
      </div>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <BarChart3 className="h-8 w-8 text-secondary mx-auto mb-4" />
          <h2 className="font-serif text-2xl md:text-3xl font-bold mb-3">
            Structure Your Business Through Cyprus
          </h2>
          <p className="text-primary-foreground/70 mb-6 max-w-xl mx-auto">
            Our trade intelligence shows Cyprus is a strategic gateway for international commerce. 
            Speak with Vertu Projects to explore your options.
          </p>
          <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
            Contact Vertu Projects
          </Button>
        </div>
      </section>
    </HubLayout>
  );
}
