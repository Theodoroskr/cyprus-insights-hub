import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TradeExecutiveInsightProps {
  insight: {
    title: string;
    summary_text: string;
    date_month: string;
    insight_type: string;
  } | null | undefined;
}

export function TradeExecutiveInsight({ insight }: TradeExecutiveInsightProps) {
  if (!insight) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-secondary" />
            Executive Insight
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-4">
            AI-generated executive summaries will appear here after the first data import.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-secondary/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-secondary" />
            {insight.title}
          </CardTitle>
          <Badge variant="secondary" className="text-[10px]">
            AI Summary
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-line">
          {insight.summary_text}
        </p>
        <p className="text-xs text-muted-foreground mt-3">
          Reporting period: {insight.date_month}
        </p>
      </CardContent>
    </Card>
  );
}
