import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle, AlertTriangle, Clock, Activity, RefreshCw, Loader2 } from "lucide-react";

type SourceRow = {
  id: string;
  name: string;
  slug: string;
  category: string;
  target_vertical: string;
  active: boolean;
  last_scraped_at: string | null;
  last_error: string | null;
  last_error_at: string | null;
  scrape_interval_hours: number;
};

export function ContentHealthPanel() {
  const queryClient = useQueryClient();
  const [retrying, setRetrying] = useState<string | null>(null);

  const { data: sources, isLoading } = useQuery({
    queryKey: ["content-health"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_sources")
        .select("id,name,slug,category,target_vertical,active,last_scraped_at,last_error,last_error_at,scrape_interval_hours")
        .order("last_error_at", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data || []) as SourceRow[];
    },
    refetchInterval: 60000,
  });

  const retrySource = async (slug: string) => {
    setRetrying(slug);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-sources", { body: { slug } });
      if (error) throw error;
      const result = data?.results?.[0];
      if (result?.errors?.length) {
        toast.error(`Retry failed: ${String(result.errors[0]).slice(0, 140)}`);
      } else {
        toast.success(`Retried: found ${data?.total_found ?? 0}, ingested ${data?.total_ingested ?? 0}.`);
      }
      queryClient.invalidateQueries({ queryKey: ["content-health"] });
    } catch (e) {
      toast.error((e as Error).message || "Retry failed");
    } finally {
      setRetrying(null);
    }
  };

  const totals = {
    all: sources?.length || 0,
    healthy: sources?.filter((s) => s.active && !s.last_error && s.last_scraped_at).length || 0,
    failing: sources?.filter((s) => s.active && s.last_error).length || 0,
    never: sources?.filter((s) => s.active && !s.last_scraped_at).length || 0,
    stale:
      sources?.filter((s) => {
        if (!s.active || !s.last_scraped_at) return false;
        return (
          Date.now() - new Date(s.last_scraped_at).getTime() >
          s.scrape_interval_hours * 60 * 60 * 1000 * 2
        );
      }).length || 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-serif font-bold text-foreground mb-1 flex items-center gap-2">
          <Activity className="h-5 w-5" /> Content Health
        </h2>
        <p className="text-sm text-muted-foreground">
          Live status of every ingestion source · last scrape and last error per source
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Total" value={totals.all} tone="muted" />
        <StatCard label="Healthy" value={totals.healthy} tone="green" />
        <StatCard label="Failing" value={totals.failing} tone="red" />
        <StatCard label="Stale" value={totals.stale} tone="amber" />
        <StatCard label="Never scraped" value={totals.never} tone="amber" />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Loading health data…</p>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Source</th>
                <th className="text-left px-4 py-2 font-medium">Vertical</th>
                <th className="text-left px-4 py-2 font-medium">Last scrape</th>
                <th className="text-left px-4 py-2 font-medium">Last error</th>
                <th className="text-right px-4 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(sources || []).map((s) => {
                const overdue =
                  s.active &&
                  s.last_scraped_at &&
                  Date.now() - new Date(s.last_scraped_at).getTime() >
                    s.scrape_interval_hours * 60 * 60 * 1000 * 2;
                return (
                  <tr key={s.id} className={`bg-card ${!s.active ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{s.name}</div>
                      <div className="text-[11px] text-muted-foreground">{s.category}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {s.target_vertical}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {s.last_scraped_at ? (
                        <span
                          className={`flex items-center gap-1 text-xs ${
                            overdue ? "text-amber-600" : "text-muted-foreground"
                          }`}
                        >
                          {overdue ? (
                            <AlertTriangle className="h-3 w-3" />
                          ) : (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          )}
                          {formatDistanceToNow(new Date(s.last_scraped_at), { addSuffix: true })}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-amber-600">
                          <Clock className="h-3 w-3" /> Never
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {s.last_error ? (
                        <div>
                          <div className="text-xs text-red-600 line-clamp-2 max-w-md">
                            {s.last_error}
                          </div>
                          {s.last_error_at && (
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              {formatDistanceToNow(new Date(s.last_error_at), { addSuffix: true })}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Button
                        size="sm"
                        variant={s.last_error ? "default" : "outline"}
                        className="h-7 gap-1.5"
                        disabled={!s.active || retrying !== null}
                        onClick={() => retrySource(s.slug)}
                      >
                        {retrying === s.slug ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                        Retry
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {(!sources || sources.length === 0) && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-sm text-muted-foreground">
                    No sources configured.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "muted" | "green" | "red" | "amber";
}) {
  const toneClass = {
    muted: "text-foreground",
    green: "text-green-600",
    red: "text-red-600",
    amber: "text-amber-600",
  }[tone];
  return (
    <div className="bento-card text-center">
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">
        {label}
      </p>
      <p className={`text-2xl font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}
