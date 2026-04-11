import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TickerItem {
  symbol: string;
  value: string;
  change: number;
}

// Real CSE closing prices scraped from cse.com.cy (11 April 2026)
const tickerData: TickerItem[] = [
  { symbol: "BOCH", value: "€8.850", change: -2.53 },
  { symbol: "DEM", value: "€1.370", change: -0.72 },
  { symbol: "EUROBCY", value: "€3.769", change: -4.07 },
  { symbol: "ATL", value: "€2.440", change: 0.83 },
  { symbol: "LUI", value: "€0.114", change: 3.64 },
  { symbol: "KEO", value: "€2.380", change: 0 },
  { symbol: "LOG", value: "€2.920", change: 0 },
  { symbol: "CCC", value: "€1.300", change: 0 },
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
