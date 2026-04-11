import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TradeTopCountriesProps {
  data: Array<{
    total_imports_eur: number;
    country_share_pct: number | null;
    rank_position: number | null;
    trade_countries: {
      country_name: string;
      country_code: string;
      eu_member: boolean;
    } | null;
  }>;
}

function formatEur(value: number) {
  if (value >= 1_000_000_000) return `€${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}M`;
  return `€${(value / 1_000).toFixed(0)}K`;
}

export function TradeTopCountries({ data }: TradeTopCountriesProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-lg">Top Import Partners</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No country data available yet.
          </p>
        ) : (
          <div className="space-y-1">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider pb-2 border-b border-border px-2">
              <span className="col-span-1">#</span>
              <span className="col-span-5">Country</span>
              <span className="col-span-3 text-right">Value</span>
              <span className="col-span-3 text-right">Share</span>
            </div>
            {data.map((row, i) => (
              <div
                key={i}
                className="grid grid-cols-12 gap-2 items-center py-2.5 px-2 rounded hover:bg-muted/50 transition-colors text-sm"
              >
                <span className="col-span-1 font-bold text-muted-foreground">
                  {row.rank_position ?? i + 1}
                </span>
                <span className="col-span-5 font-medium flex items-center gap-2">
                  {row.trade_countries?.country_name ?? "Unknown"}
                  {row.trade_countries?.eu_member && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">EU</Badge>
                  )}
                </span>
                <span className="col-span-3 text-right font-mono text-xs">
                  {formatEur(row.total_imports_eur)}
                </span>
                <span className="col-span-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.min(row.country_share_pct ?? 0, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono w-12 text-right">
                      {row.country_share_pct?.toFixed(1) ?? "—"}%
                    </span>
                  </div>
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
