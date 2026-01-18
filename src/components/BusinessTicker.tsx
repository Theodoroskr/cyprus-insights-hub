import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TickerItem {
  symbol: string;
  value: string;
  change: number;
}

const tickerData: TickerItem[] = [
  { symbol: "CSE INDEX", value: "92.45", change: 0.82 },
  { symbol: "BOC", value: "€3.24", change: -0.45 },
  { symbol: "HB", value: "€2.18", change: 1.23 },
  { symbol: "CYTA", value: "€0.89", change: 0 },
  { symbol: "TENDER: Ministry of Transport", value: "€2.4M", change: 0 },
  { symbol: "EUR/USD", value: "1.0842", change: 0.12 },
  { symbol: "BRENT", value: "$82.45", change: -0.34 },
  { symbol: "GOLD", value: "$2,645", change: 0.56 },
];

const TickerItemComponent = ({ item }: { item: TickerItem }) => {
  const Icon = item.change > 0 ? TrendingUp : item.change < 0 ? TrendingDown : Minus;
  const colorClass = item.change > 0 ? "text-success" : item.change < 0 ? "text-destructive" : "text-muted-foreground";
  
  return (
    <span className="inline-flex items-center gap-2 px-6">
      <span className="font-medium text-primary-foreground/90">{item.symbol}</span>
      <span className="text-secondary font-semibold">{item.value}</span>
      {item.change !== 0 && (
        <span className={`inline-flex items-center gap-0.5 ${colorClass}`}>
          <Icon className="h-3 w-3" />
          <span className="text-xs">{Math.abs(item.change)}%</span>
        </span>
      )}
    </span>
  );
};

export function BusinessTicker() {
  return (
    <div className="navy-gradient border-b border-navy-light">
      <div className="ticker-container py-2">
        <div className="ticker-content">
          {[...tickerData, ...tickerData].map((item, index) => (
            <TickerItemComponent key={index} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
