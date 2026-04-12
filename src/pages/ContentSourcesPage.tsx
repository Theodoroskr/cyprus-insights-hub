import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Globe, RefreshCw, CheckCircle, Clock, AlertTriangle,
  ExternalLink, Rss, Shield, TrendingUp, Building2, Zap,
  Loader2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const VERTICAL_ICONS: Record<string, typeof Shield> = {
  compliance: Shield,
  fintech: TrendingUp,
  sme: Building2,
  general: Globe,
};

const ContentSourcesPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [scrapingSlug, setScrapingSlug] = useState<string | null>(null);

  const { data: sources, isLoading } = useQuery({
    queryKey: ["content-sources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_sources")
        .select("*")
        .order("category", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("content_sources")
        .update({ active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-sources"] });
      toast({ title: "Source updated" });
    },
  });

  const triggerScrape = async (slug: string) => {
    setScrapingSlug(slug);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-sources", {
        body: { slug },
      });
      if (error) throw error;
      toast({
        title: "Scrape complete",
        description: `Found ${data.total_found} articles, ingested ${data.total_ingested} new.`,
      });
      queryClient.invalidateQueries({ queryKey: ["content-sources"] });
    } catch (e: any) {
      toast({
        title: "Scrape failed",
        description: e.message || "Unknown error",
        variant: "destructive",
      });
    } finally {
      setScrapingSlug(null);
    }
  };

  const triggerAll = async () => {
    setScrapingSlug("__all__");
    try {
      const { data, error } = await supabase.functions.invoke("scrape-sources", {
        body: {},
      });
      if (error) throw error;
      toast({
        title: "Full scrape complete",
        description: `${data.sources_scraped} sources scraped. ${data.total_found} found, ${data.total_ingested} ingested.`,
      });
      queryClient.invalidateQueries({ queryKey: ["content-sources"] });
    } catch (e: any) {
      toast({
        title: "Scrape failed",
        description: e.message || "Unknown error",
        variant: "destructive",
      });
    } finally {
      setScrapingSlug(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavigation onSearch={() => {}} />
        <div className="container mx-auto px-4 py-20 text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-serif font-bold mb-2">Admin Access Required</h1>
          <p className="text-muted-foreground">Sign in with an admin account to manage content sources.</p>
        </div>
        <Footer />
      </div>
    );
  }

  const cyprusSources = sources?.filter((s) => s.category === "cyprus") || [];
  const euSources = sources?.filter((s) => s.category === "eu") || [];
  const globalSources = sources?.filter((s) => s.category === "global") || [];

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation onSearch={() => {}} />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">Content Sources</h1>
            <p className="text-muted-foreground mt-1">
              Manage automated content ingestion from Cyprus, EU and global sources
            </p>
          </div>
          <Button
            onClick={triggerAll}
            disabled={!!scrapingSlug}
            className="gap-2"
          >
            {scrapingSlug === "__all__" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Scrape All Sources
          </Button>
        </div>

        {/* Stats bar */}
        {sources && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Sources" value={sources.length} icon={Rss} />
            <StatCard
              label="Active"
              value={sources.filter((s) => s.active).length}
              icon={CheckCircle}
            />
            <StatCard
              label="Auto-Publish"
              value={sources.filter((s) => s.auto_publish).length}
              icon={Zap}
            />
            <StatCard
              label="Recently Scraped"
              value={
                sources.filter(
                  (s) =>
                    s.last_scraped_at &&
                    Date.now() - new Date(s.last_scraped_at).getTime() < 12 * 60 * 60 * 1000
                ).length
              }
              icon={Clock}
            />
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading sources…</div>
        ) : (
          <>
            <SourceGroup
              title="🏛 Cyprus — Regulators & Government"
              sources={cyprusSources}
              scrapingSlug={scrapingSlug}
              onToggle={(id, active) => toggleActive.mutate({ id, active })}
              onScrape={triggerScrape}
            />
            <SourceGroup
              title="🇪🇺 EU — Strategic Layer"
              sources={euSources}
              scrapingSlug={scrapingSlug}
              onToggle={(id, active) => toggleActive.mutate({ id, active })}
              onScrape={triggerScrape}
            />
            <SourceGroup
              title="🌍 Global Institutional"
              sources={globalSources}
              scrapingSlug={scrapingSlug}
              onToggle={(id, active) => toggleActive.mutate({ id, active })}
              onScrape={triggerScrape}
            />
          </>
        )}
      </div>

      <Footer />
    </div>
  );
};

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Rss;
}) {
  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        <Icon className="h-4 w-4" />
        <span className="text-xs uppercase tracking-wider font-sans">{label}</span>
      </div>
      <p className="text-2xl font-serif font-bold text-foreground">{value}</p>
    </div>
  );
}

function SourceGroup({
  title,
  sources,
  scrapingSlug,
  onToggle,
  onScrape,
}: {
  title: string;
  sources: any[];
  scrapingSlug: string | null;
  onToggle: (id: string, active: boolean) => void;
  onScrape: (slug: string) => void;
}) {
  if (sources.length === 0) return null;

  return (
    <div className="mb-10">
      <h2 className="text-lg font-serif font-bold text-foreground mb-4 flex items-center gap-2">
        {title}
      </h2>
      <div className="grid gap-4">
        {sources.map((source) => (
          <SourceCard
            key={source.id}
            source={source}
            isScraping={scrapingSlug === source.slug || scrapingSlug === "__all__"}
            onToggle={onToggle}
            onScrape={onScrape}
          />
        ))}
      </div>
    </div>
  );
}

function SourceCard({
  source,
  isScraping,
  onToggle,
  onScrape,
}: {
  source: any;
  isScraping: boolean;
  onToggle: (id: string, active: boolean) => void;
  onScrape: (slug: string) => void;
}) {
  const VerticalIcon = VERTICAL_ICONS[source.target_vertical] || Globe;
  const sections = source.target_section?.split(",") || [];

  return (
    <div
      className={`border rounded-lg p-5 transition-colors ${
        source.active
          ? "border-border bg-card"
          : "border-border/50 bg-muted/30 opacity-60"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: Source info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-serif text-lg font-bold text-foreground">{source.name}</h3>
            {source.auto_publish ? (
              <Badge className="bg-green-100 text-green-800 border-green-200 rounded-none text-[10px] uppercase tracking-wider">
                Auto-publish
              </Badge>
            ) : (
              <Badge variant="outline" className="rounded-none text-[10px] uppercase tracking-wider border-amber-300 text-amber-700">
                Draft Queue
              </Badge>
            )}
            <Badge variant="outline" className="rounded-none text-[10px] uppercase tracking-wider gap-1">
              <VerticalIcon className="h-3 w-3" />
              {source.target_vertical}
            </Badge>
          </div>

          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
            <a
              href={`${source.url}${source.scrape_path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              {source.url}
              {source.scrape_path}
            </a>
          </div>

          {/* Sections tags */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {sections.map((s: string) => (
              <span
                key={s}
                className="text-[10px] uppercase tracking-wider bg-muted text-muted-foreground px-2 py-0.5 rounded-sm"
              >
                {s.trim()}
              </span>
            ))}
          </div>

          {/* Scrape status */}
          <div className="flex items-center gap-4 text-xs">
            {source.last_scraped_at ? (
              <span className="flex items-center gap-1 text-muted-foreground">
                <CheckCircle className="h-3 w-3 text-green-600" />
                Last scraped{" "}
                {formatDistanceToNow(new Date(source.last_scraped_at), {
                  addSuffix: true,
                })}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-600">
                <AlertTriangle className="h-3 w-3" />
                Never scraped
              </span>
            )}
            <span className="text-muted-foreground">
              Interval: every {source.scrape_interval_hours}h
            </span>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex flex-col items-end gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {source.active ? "Active" : "Paused"}
            </span>
            <Switch
              checked={source.active}
              onCheckedChange={(checked) => onToggle(source.id, checked)}
            />
          </div>

          <Button
            size="sm"
            variant="outline"
            disabled={isScraping || !source.active}
            onClick={() => onScrape(source.slug)}
            className="gap-1.5 text-xs"
          >
            {isScraping ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            Scrape Now
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ContentSourcesPage;
