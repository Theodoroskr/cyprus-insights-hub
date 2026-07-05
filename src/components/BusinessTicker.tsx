import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Quote = {
  symbol: string;
  name: string;
  category: string;
  value: number;
  change_pct: number;
  currency: string;
  display_order: number;
  updated_at: string;
};

function formatValue(q: Quote): string {
  const symbol = q.currency === "USD" ? "$" : q.currency === "EUR" ? "€" : "";
  if (q.category === "fx") return q.value.toFixed(4);
  if (q.category === "commodity") return `${symbol}${q.value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  return `${symbol}${q.value.toFixed(3)}`;
}

const TickerItemComponent = ({ item }: { item: Quote }) => {
  const Icon = item.change_pct > 0 ? TrendingUp : item.change_pct < 0 ? TrendingDown : Minus;
  const colorClass = item.change_pct > 0 ? "text-success" : item.change_pct < 0 ? "text-destructive" : "text-muted-foreground";

  return (
    <span className="inline-flex items-center gap-2 px-6">
      <span className="font-medium text-primary-foreground/90">{item.symbol}</span>
      <span className="text-secondary font-semibold">{formatValue(item)}</span>
      {item.change_pct !== 0 && (
        <span className={`inline-flex items-center gap-0.5 ${colorClass}`}>
          <Icon className="h-3 w-3" />
          <span className="text-xs">{Math.abs(item.change_pct).toFixed(2)}%</span>
        </span>
      )}
    </span>
  );
};

export function BusinessTicker() {
  const { data: quotes } = useQuery({
    queryKey: ["market-quotes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_quotes")
        .select("symbol,name,category,value,change_pct,currency,display_order,updated_at")
        .eq("active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data || []) as Quote[];
    },
    refetchInterval: 5 * 60 * 1000, // refresh every 5 min in the client
    staleTime: 60 * 1000,
  });

  // Only show tickers that have been priced at least once
  const items = (quotes || []).filter((q) => q.value > 0);

  if (items.length === 0) return null;

  return (
    <div className="navy-gradient border-b border-navy-light">
      <div className="ticker-container py-2">
        <div className="ticker-content">
          {[...items, ...items].map((item, index) => (
            <TickerItemComponent key={`${item.symbol}-${index}`} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
