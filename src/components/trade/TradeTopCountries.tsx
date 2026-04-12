import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface CountryRow {
  total_imports_eur: number;
  country_share_pct: number | null;
  rank_position: number | null;
  trade_countries: {
    country_name: string;
    country_code: string;
    eu_member: boolean;
  } | null;
}

interface TradeTopCountriesProps {
  data: CountryRow[];
}

function formatEur(value: number) {
  if (value >= 1_000_000_000) return `€${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}M`;
  return `€${(value / 1_000).toFixed(0)}K`;
}

const VISIBLE_FREE = 3;
const ROTATE_INTERVAL = 4000;

export function TradeTopCountries({ data }: TradeTopCountriesProps) {
  const { profile } = useAuth();
  const isPremium = profile?.tier === "premium";
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto-rotate for non-premium users
  useEffect(() => {
    if (isPremium || data.length <= VISIBLE_FREE) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + VISIBLE_FREE) % data.length);
    }, ROTATE_INTERVAL);
    return () => clearInterval(timer);
  }, [data.length, isPremium]);

  const visibleData = isPremium
    ? data
    : data.slice(activeIndex, activeIndex + VISIBLE_FREE);

  // Handle wrap-around
  const displayData =
    !isPremium && activeIndex + VISIBLE_FREE > data.length
      ? [...data.slice(activeIndex), ...data.slice(0, (activeIndex + VISIBLE_FREE) - data.length)]
      : visibleData;

  const totalPages = Math.ceil(data.length / VISIBLE_FREE);
  const currentPage = Math.floor(activeIndex / VISIBLE_FREE);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="font-serif text-lg">Top Import Partners</CardTitle>
          {!isPremium && data.length > VISIBLE_FREE && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() =>
                  setActiveIndex((prev) =>
                    prev - VISIBLE_FREE < 0
                      ? Math.max(0, data.length - VISIBLE_FREE)
                      : prev - VISIBLE_FREE
                  )
                }
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {currentPage + 1}/{totalPages}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() =>
                  setActiveIndex((prev) => (prev + VISIBLE_FREE) % data.length)
                }
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No country data available yet.
          </p>
        ) : (
          <>
            <div className="space-y-1">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider pb-2 border-b border-border px-2">
                <span className="col-span-1">#</span>
                <span className="col-span-5">Country</span>
                <span className="col-span-3 text-right">Value</span>
                <span className="col-span-3 text-right">Share</span>
              </div>
              {displayData.map((row, i) => {
                const globalRank = isPremium ? i + 1 : activeIndex + i + 1;
                return (
                  <div
                    key={`${row.trade_countries?.country_code}-${globalRank}`}
                    className="grid grid-cols-12 gap-2 items-center py-2.5 px-2 rounded hover:bg-muted/50 transition-colors text-sm animate-fade-in"
                  >
                    <span className="col-span-1 font-bold text-muted-foreground">
                      {row.rank_position ?? globalRank}
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
                );
              })}
            </div>

            {/* Premium upsell */}
            {!isPremium && data.length > VISIBLE_FREE && (
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Lock className="h-3.5 w-3.5" />
                  <span>Showing {VISIBLE_FREE} of {data.length} partners</span>
                </div>
                <Button variant="secondary" size="sm" className="text-xs h-7">
                  Unlock All Partners
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
