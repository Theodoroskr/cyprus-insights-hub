import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TradeEUSplitProps {
  snapshot: any;
}

export function TradeEUSplit({ snapshot }: TradeEUSplitProps) {
  const euPct = snapshot?.eu_share_pct ?? 0;
  const nonEuPct = snapshot?.non_eu_share_pct ?? 0;

  const data = [
    { name: "EU", value: euPct, color: "hsl(var(--primary))" },
    { name: "Non-EU", value: nonEuPct, color: "hsl(var(--secondary))" },
  ];

  const hasData = euPct > 0 || nonEuPct > 0;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="font-serif text-lg">EU vs Non-EU</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        {!hasData ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
            No data yet
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  dataKey="value"
                  stroke="hsl(var(--card))"
                  strokeWidth={2}
                >
                  {data.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(1)}%`, ""]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-6 mt-2">
              {data.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-muted-foreground">{d.name}</span>
                  <span className="font-bold">{d.value.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
