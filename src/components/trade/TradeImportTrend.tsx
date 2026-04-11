import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TradeImportTrendProps {
  data: Array<{
    month: number;
    year: number;
    total_imports_eur: number;
    date_month: string;
  }>;
}

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatEurShort(value: number) {
  if (value >= 1_000_000_000) return `€${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(0)}M`;
  return `€${(value / 1_000).toFixed(0)}K`;
}

export function TradeImportTrend({ data }: TradeImportTrendProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: monthLabels[d.month - 1] ?? d.month,
    value: d.total_imports_eur,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-serif text-lg">Monthly Import Trend</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
            No trend data available yet. Data will appear after the first monthly import.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tickFormatter={formatEurShort} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" width={70} />
              <Tooltip
                formatter={(value: number) => [formatEurShort(value), "Imports"]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", r: 3 }}
                activeDot={{ r: 5, fill: "hsl(var(--secondary))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
