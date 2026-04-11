import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface TradeTopSectorsProps {
  data: Array<{
    sector_name: string;
    total_imports_eur: number;
    sector_share_pct: number | null;
    rank_position: number | null;
    mom_growth_pct: number | null;
  }>;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--fintech))",
  "hsl(var(--compliance))",
  "hsl(var(--sme))",
  "hsl(var(--navy-light))",
  "hsl(var(--gold-light))",
  "hsl(var(--muted-foreground))",
];

function formatEurShort(value: number) {
  if (value >= 1_000_000_000) return `€${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(0)}M`;
  return `€${(value / 1_000).toFixed(0)}K`;
}

export function TradeTopSectors({ data }: TradeTopSectorsProps) {
  const chartData = data.slice(0, 8).map((d) => ({
    name: d.sector_name.length > 18 ? d.sector_name.slice(0, 16) + "…" : d.sector_name,
    fullName: d.sector_name,
    value: d.total_imports_eur,
    share: d.sector_share_pct,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-serif text-lg">Top Import Sectors</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
            No sector data available yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <XAxis type="number" tickFormatter={formatEurShort} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={130} />
              <Tooltip
                formatter={(value: number) => [formatEurShort(value), "Imports"]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                {chartData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
