import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Shield, TrendingUp, Building2, Globe, Cpu,
  CheckCircle, Archive, FileEdit, Eye, Clock,
  Search, Filter, RefreshCw, ChevronLeft, ChevronRight,
  AlertTriangle, Users, Image, ShieldCheck, Rss,
  ExternalLink, Loader2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { SubscribersPanel } from "@/components/admin/SubscribersPanel";
import { BannersPanel } from "@/components/admin/BannersPanel";
import { Checkbox } from "@/components/ui/checkbox";
import type { Database } from "@/integrations/supabase/types";

type Article = Database["public"]["Tables"]["cna_articles"]["Row"];
type ArticleStatus = Database["public"]["Enums"]["article_status"];
type ArticleVertical = Database["public"]["Enums"]["article_vertical"];

const VERTICAL_CONFIG: Record<ArticleVertical, { label: string; icon: typeof Shield; color: string }> = {
  compliance: { label: "Compliance", icon: Shield, color: "bg-blue-100 text-blue-800 border-blue-200" },
  fintech: { label: "FinTech", icon: TrendingUp, color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  sme: { label: "SME", icon: Building2, color: "bg-amber-100 text-amber-800 border-amber-200" },
  general: { label: "General", icon: Globe, color: "bg-muted text-muted-foreground border-border" },
  regtech: { label: "RegTech", icon: Cpu, color: "bg-purple-100 text-purple-800 border-purple-200" },
};

const STATUS_CONFIG: Record<ArticleStatus, { label: string; icon: typeof Clock; color: string }> = {
  draft: { label: "Draft", icon: Clock, color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  published: { label: "Published", icon: CheckCircle, color: "bg-green-100 text-green-800 border-green-200" },
  archived: { label: "Archived", icon: Archive, color: "bg-muted text-muted-foreground border-border" },
};

const PAGE_SIZE = 12;

const REG_SOURCES = ["cysec", "cbc", "icpac", "bar", "cifa"] as const;

function RegulatoryPanel() {
  const [syncing, setSyncing] = useState<string | null>(null);

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ["regulatory-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("regulated_entities")
        .select("source, status, matched_company_id");
      if (error) throw error;
      const bySource: Record<string, { total: number; matched: number; active: number }> = {};
      for (const row of data || []) {
        if (!bySource[row.source]) bySource[row.source] = { total: 0, matched: 0, active: 0 };
        bySource[row.source].total++;
        if (row.matched_company_id) bySource[row.source].matched++;
        if (row.status === "active") bySource[row.source].active++;
      }
      return bySource;
    },
  });

  const { data: recentEntities } = useQuery({
    queryKey: ["regulatory-recent"],
    queryFn: async () => {
      const { data } = await supabase
        .from("regulated_entities")
        .select("id, source, entity_name, license_type, status, matched_company_id, updated_at")
        .order("updated_at", { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  const triggerScrape = async (source: string) => {
    setSyncing(source);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-regulators", {
        body: { source },
      });
      if (error) throw error;
      toast.success(`Sync complete: ${JSON.stringify(data?.results || {})}`);
      refetch();
    } catch (err) {
      toast.error(`Sync failed: ${(err as Error).message}`);
    } finally {
      setSyncing(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-serif font-bold text-foreground mb-1">Regulated Entity Registry</h2>
        <p className="text-sm text-muted-foreground">Scraped from CySEC, CBC, ICPAC, Bar Association, and CIFA public registers</p>
      </div>

      {/* Source Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {REG_SOURCES.map((src) => {
          const s = stats?.[src];
          return (
            <div key={src} className="bento-card text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">{src.toUpperCase()}</p>
              <p className="text-2xl font-bold text-foreground">{s?.total || 0}</p>
              <p className="text-[10px] text-muted-foreground">
                {s?.matched || 0} matched · {s?.active || 0} active
              </p>
            </div>
          );
        })}
      </div>

      {/* Sync Buttons */}
      <div className="flex flex-wrap gap-2">
        {[...REG_SOURCES, "all" as const].map((source) => (
          <Button
            key={source}
            size="sm"
            variant="outline"
            onClick={() => triggerScrape(source)}
            disabled={syncing !== null}
            className="gap-1.5"
          >
            {syncing === source && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
            Sync {source === "all" ? "All Sources" : source.toUpperCase()}
          </Button>
        ))}
      </div>

      {/* Recent Entities */}
      <div>
        <h3 className="font-semibold text-foreground mb-3">Recent Entities</h3>
        <div className="space-y-2">
          {(recentEntities || []).map((e: any) => (
            <div key={e.id} className="flex items-center gap-3 p-3 border border-border rounded-lg bg-card">
              <Badge variant="outline" className="text-[10px] uppercase">{e.source}</Badge>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{e.entity_name}</p>
                <p className="text-[10px] text-muted-foreground">{e.license_type}</p>
              </div>
              <Badge variant="outline" className={`text-[10px] ${e.status === "active" ? "border-emerald-300 text-emerald-700" : "border-amber-300 text-amber-700"}`}>
                {e.status}
              </Badge>
              {e.matched_company_id && (
                <Badge variant="secondary" className="text-[10px]">Matched</Badge>
              )}
            </div>
          ))}
          {(!recentEntities || recentEntities.length === 0) && !isLoading && (
            <p className="text-sm text-muted-foreground text-center py-8">No regulated entities yet. Run a sync to populate.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function SourcesPanel() {
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

  const triggerScrape = async (slug: string) => {
    setScrapingSlug(slug);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-sources", { body: { slug } });
      if (error) throw error;
      toast.success(`Found ${data.total_found} articles, ingested ${data.total_ingested} new.`);
      queryClient.invalidateQueries({ queryKey: ["content-sources"] });
    } catch (e: any) {
      toast.error(e.message || "Scrape failed");
    } finally {
      setScrapingSlug(null);
    }
  };

  const triggerAll = async () => {
    setScrapingSlug("__all__");
    try {
      const { data, error } = await supabase.functions.invoke("scrape-sources", { body: {} });
      if (error) throw error;
      toast.success(`${data.sources_scraped} sources scraped. ${data.total_found} found, ${data.total_ingested} ingested.`);
      queryClient.invalidateQueries({ queryKey: ["content-sources"] });
    } catch (e: any) {
      toast.error(e.message || "Scrape failed");
    } finally {
      setScrapingSlug(null);
    }
  };

  const groups = [
    { key: "cyprus", title: "🏛 Cyprus — Regulators & Government" },
    { key: "eu", title: "🇪🇺 EU — Strategic Layer" },
    { key: "global", title: "🌍 Global Institutional" },
  ];

  const neverScraped = sources?.filter((s) => s.active && !s.last_scraped_at).length || 0;
  const stale = sources?.filter((s) => {
    if (!s.active || !s.last_scraped_at) return false;
    return Date.now() - new Date(s.last_scraped_at).getTime() > s.scrape_interval_hours * 60 * 60 * 1000 * 2;
  }).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-serif font-bold text-foreground mb-1">Content Sources</h2>
          <p className="text-sm text-muted-foreground">
            {sources?.length || 0} sources · {neverScraped > 0 && <span className="text-amber-600">{neverScraped} never scraped · </span>}
            {stale > 0 && <span className="text-amber-600">{stale} overdue</span>}
          </p>
        </div>
        <Button size="sm" onClick={triggerAll} disabled={!!scrapingSlug} className="gap-1.5">
          {scrapingSlug === "__all__" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Scrape All
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Loading sources…</p>
      ) : (
        groups.map(({ key, title }) => {
          const group = sources?.filter((s) => s.category === key) || [];
          if (group.length === 0) return null;
          return (
            <div key={key}>
              <h3 className="font-semibold text-foreground mb-3 text-sm">{title}</h3>
              <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
                {group.map((source) => {
                  const isOverdue = source.active && source.last_scraped_at &&
                    Date.now() - new Date(source.last_scraped_at).getTime() > source.scrape_interval_hours * 60 * 60 * 1000 * 2;
                  return (
                    <div key={source.id} className={`flex items-center gap-3 px-4 py-3 bg-card ${!source.active ? "opacity-50" : ""}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-foreground truncate">{source.name}</span>
                          <Badge variant="outline" className="text-[10px] uppercase tracking-wider shrink-0">{source.target_vertical}</Badge>
                          {!source.active && <Badge variant="secondary" className="text-[10px]">Paused</Badge>}
                        </div>
                        <a href={`${source.url}${source.scrape_path}`} target="_blank" rel="noopener noreferrer"
                          className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 mt-0.5">
                          <ExternalLink className="h-2.5 w-2.5" />{source.url}{source.scrape_path}
                        </a>
                      </div>
                      <div className="text-right shrink-0">
                        {source.last_scraped_at ? (
                          <span className={`text-[11px] flex items-center gap-1 ${isOverdue ? "text-amber-600" : "text-muted-foreground"}`}>
                            {isOverdue ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3 text-green-600" />}
                            {formatDistanceToNow(new Date(source.last_scraped_at), { addSuffix: true })}
                          </span>
                        ) : (
                          <span className="text-[11px] text-amber-600 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Never scraped
                          </span>
                        )}
                      </div>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 shrink-0"
                        disabled={!!scrapingSlug || !source.active}
                        onClick={() => triggerScrape(source.slug)}>
                        {scrapingSlug === source.slug ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

const EditorialDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activePanel, setActivePanel] = useState<"articles" | "subscribers" | "banners" | "regulatory" | "sources">("articles");
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | "all">("all");
  const [verticalFilter, setVerticalFilter] = useState<ArticleVertical | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [editForm, setEditForm] = useState<Partial<Article>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Check admin role
  const { data: isAdmin, isLoading: roleLoading } = useQuery({
    queryKey: ["admin-check", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      return !!data;
    },
    enabled: !!user,
  });

  // Fetch articles (admins see all statuses via RLS)
  const { data: articlesData, isLoading } = useQuery({
    queryKey: ["editorial-articles", statusFilter, verticalFilter, searchQuery, page],
    queryFn: async () => {
      let query = supabase
        .from("cna_articles")
        .select("*", { count: "exact" })
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      if (verticalFilter !== "all") query = query.eq("vertical", verticalFilter);
      if (searchQuery.trim()) query = query.ilike("title", `%${searchQuery}%`);

      const { data, count, error } = await query;
      if (error) throw error;
      return { articles: data ?? [], total: count ?? 0 };
    },
    enabled: isAdmin === true,
  });

  const articles = articlesData?.articles ?? [];
  const totalPages = Math.ceil((articlesData?.total ?? 0) / PAGE_SIZE);

  // Status mutation
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ArticleStatus }) => {
      const updates: { status: ArticleStatus; published_at?: string } = { status };
      if (status === "published") updates.published_at = new Date().toISOString();
      const { error } = await supabase.from("cna_articles").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["editorial-articles"] });
      toast.success(`Article has been ${status} successfully.`);
    },
    onError: (err) => toast.error((err as Error).message),
  });

  // Edit mutation
  const editMutation = useMutation({
    mutationFn: async (updates: Partial<Article> & { id: string }) => {
      const { id, ...rest } = updates;
      const { error } = await supabase.from("cna_articles").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["editorial-articles"] });
      setEditingArticle(null);
      toast.success("Article updated successfully.");
    },
    onError: (err) => toast.error((err as Error).message),
  });

  // Bulk status mutation
  const bulkStatusMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: ArticleStatus }) => {
      const updates: { status: ArticleStatus; published_at?: string } = { status };
      if (status === "published") updates.published_at = new Date().toISOString();
      const { error } = await supabase.from("cna_articles").update(updates).in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_, { ids, status }) => {
      queryClient.invalidateQueries({ queryKey: ["editorial-articles"] });
      setSelectedIds(new Set());
      toast.success(`${ids.length} article(s) ${status} successfully.`);
    },
    onError: (err) => toast.error((err as Error).message),
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === articles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(articles.map((a) => a.id)));
    }
  };

  const openEditor = (article: Article) => {
    setEditingArticle(article);
    setEditForm({
      title: article.title,
      summary: article.summary,
      vertical: article.vertical,
      image_url: article.image_url,
      what_happened: article.what_happened,
      why_it_matters: article.why_it_matters,
      what_to_do: article.what_to_do,
      tags: article.tags,
    });
  };

  const saveEdit = () => {
    if (!editingArticle) return;
    editMutation.mutate({ id: editingArticle.id, ...editForm });
  };

  // Guard: loading / not admin
  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavigation onSearch={() => {}} />
        <div className="max-w-2xl mx-auto py-24 px-4 text-center">
          <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You must be an admin to access the editorial dashboard.</p>
        </div>
        <Footer />
      </div>
    );
  }

  const statusCounts = {
    draft: articles.filter((a) => a.status === "draft").length,
    published: articles.filter((a) => a.status === "published").length,
    archived: articles.filter((a) => a.status === "archived").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation onSearch={() => {}} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Editorial Dashboard</h1>
            <p className="text-muted-foreground mt-1">Review, edit, and publish CNA intelligence articles</p>
          </div>
          <div className="flex gap-1 border border-border rounded-lg p-1">
            <Button
              size="sm"
              variant={activePanel === "articles" ? "default" : "ghost"}
              onClick={() => setActivePanel("articles")}
              className="gap-1.5"
            >
              <FileEdit className="h-3.5 w-3.5" /> Articles
            </Button>
            <Button
              size="sm"
              variant={activePanel === "subscribers" ? "default" : "ghost"}
              onClick={() => setActivePanel("subscribers")}
              className="gap-1.5"
            >
              <Users className="h-3.5 w-3.5" /> Subscribers
            </Button>
            <Button
              size="sm"
              variant={activePanel === "banners" ? "default" : "ghost"}
              onClick={() => setActivePanel("banners")}
              className="gap-1.5"
            >
              <Image className="h-3.5 w-3.5" /> Banners
            </Button>
            <Button
              size="sm"
              variant={activePanel === "regulatory" ? "default" : "ghost"}
              onClick={() => setActivePanel("regulatory")}
              className="gap-1.5"
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Regulatory
            </Button>
          </div>
        </div>

        {activePanel === "subscribers" ? (
          <SubscribersPanel />
        ) : activePanel === "banners" ? (
          <BannersPanel />
        ) : activePanel === "regulatory" ? (
          <RegulatoryPanel />
        ) : (
        <>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {(["draft", "published", "archived"] as ArticleStatus[]).map((s) => {
            const cfg = STATUS_CONFIG[s];
            const Icon = cfg.icon;
            return (
              <button
                key={s}
                onClick={() => { setStatusFilter(statusFilter === s ? "all" : s); setPage(0); }}
                className={`bento-card flex items-center gap-3 cursor-pointer ${statusFilter === s ? "ring-2 ring-secondary" : ""}`}
              >
                <div className={`p-2 rounded-lg ${cfg.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold text-foreground">{statusCounts[s]}</p>
                  <p className="text-xs text-muted-foreground">{cfg.label}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search articles…"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
              className="pl-9"
            />
          </div>
          <Select value={verticalFilter} onValueChange={(v) => { setVerticalFilter(v as any); setPage(0); }}>
            <SelectTrigger className="w-[160px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Vertical" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Verticals</SelectItem>
              <SelectItem value="compliance">Compliance</SelectItem>
              <SelectItem value="fintech">FinTech</SelectItem>
              <SelectItem value="sme">SME</SelectItem>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="regtech">RegTech</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 mb-4 p-3 rounded-lg border border-secondary/30 bg-secondary/5">
            <span className="text-sm font-medium text-foreground">{selectedIds.size} selected</span>
            <div className="flex-1" />
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-primary-foreground"
              onClick={() => bulkStatusMutation.mutate({ ids: [...selectedIds], status: "published" })}
              disabled={bulkStatusMutation.isPending}
            >
              <CheckCircle className="w-4 h-4 mr-1" /> Publish All
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => bulkStatusMutation.mutate({ ids: [...selectedIds], status: "archived" })}
              disabled={bulkStatusMutation.isPending}
            >
              <Archive className="w-4 h-4 mr-1" /> Archive All
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => bulkStatusMutation.mutate({ ids: [...selectedIds], status: "draft" })}
              disabled={bulkStatusMutation.isPending}
            >
              <Eye className="w-4 h-4 mr-1" /> Restore All
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
              Clear
            </Button>
          </div>
        )}

        {/* Articles List */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">No articles found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Select All */}
            <div className="flex items-center gap-3 px-2">
              <Checkbox
                checked={articles.length > 0 && selectedIds.size === articles.length}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-xs text-muted-foreground font-medium">Select all</span>
            </div>
            {articles.map((article) => {
              const vCfg = VERTICAL_CONFIG[article.vertical];
              const sCfg = STATUS_CONFIG[article.status];
              const VIcon = vCfg.icon;
              const isSelected = selectedIds.has(article.id);
              return (
                <div key={article.id} className={`bento-card flex flex-col sm:flex-row sm:items-center gap-4 ${isSelected ? "ring-2 ring-secondary/50" : ""}`}>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleSelect(article.id)}
                    className="shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={`text-[10px] ${vCfg.color}`}>
                        <VIcon className="w-3 h-3 mr-1" />
                        {vCfg.label}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] ${sCfg.color}`}>
                        {sCfg.label}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-foreground truncate">{article.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {article.summary || article.what_happened || "No summary"}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Created {new Date(article.created_at).toLocaleDateString()}
                      {article.published_at && ` · Published ${new Date(article.published_at).toLocaleDateString()}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => openEditor(article)}>
                      <FileEdit className="w-4 h-4 mr-1" /> Edit
                    </Button>
                    {article.status === "draft" && (
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-primary-foreground"
                        onClick={() => statusMutation.mutate({ id: article.id, status: "published" })}
                        disabled={statusMutation.isPending}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" /> Publish
                      </Button>
                    )}
                    {article.status === "published" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => statusMutation.mutate({ id: article.id, status: "archived" })}
                        disabled={statusMutation.isPending}
                      >
                        <Archive className="w-4 h-4 mr-1" /> Archive
                      </Button>
                    )}
                    {article.status === "archived" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => statusMutation.mutate({ id: article.id, status: "draft" })}
                        disabled={statusMutation.isPending}
                      >
                        <Eye className="w-4 h-4 mr-1" /> Restore
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
        </>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingArticle} onOpenChange={(o) => !o && setEditingArticle(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Article</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="section-label">Title</label>
              <Input
                value={editForm.title ?? ""}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>
            <div>
              <label className="section-label">Vertical</label>
              <Select
                value={editForm.vertical ?? "general"}
                onValueChange={(v) => setEditForm({ ...editForm, vertical: v as ArticleVertical })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="fintech">FinTech</SelectItem>
                  <SelectItem value="sme">SME</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="regtech">RegTech</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="section-label">Image URL</label>
              <Input
                placeholder="https://images.unsplash.com/..."
                value={editForm.image_url ?? ""}
                onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
              />
              {editForm.image_url && (
                <img src={editForm.image_url} alt="Preview" className="mt-2 h-32 w-full object-cover rounded-lg border border-border" />
              )}
            </div>
            <div>
              <label className="section-label">Summary</label>
              <Textarea
                rows={2}
                value={editForm.summary ?? ""}
                onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
              />
            </div>
            <div>
              <label className="section-label">What Happened</label>
              <Textarea
                rows={3}
                value={editForm.what_happened ?? ""}
                onChange={(e) => setEditForm({ ...editForm, what_happened: e.target.value })}
              />
            </div>
            <div>
              <label className="section-label">Why It Matters</label>
              <Textarea
                rows={3}
                value={editForm.why_it_matters ?? ""}
                onChange={(e) => setEditForm({ ...editForm, why_it_matters: e.target.value })}
              />
            </div>
            <div>
              <label className="section-label">What To Do</label>
              <Textarea
                rows={3}
                value={editForm.what_to_do ?? ""}
                onChange={(e) => setEditForm({ ...editForm, what_to_do: e.target.value })}
              />
            </div>
            <div>
              <label className="section-label">Tags (comma-separated)</label>
              <Input
                value={(editForm.tags ?? []).join(", ")}
                onChange={(e) => setEditForm({ ...editForm, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditingArticle(null)}>Cancel</Button>
              <Button onClick={saveEdit} disabled={editMutation.isPending}>
                {editMutation.isPending ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default EditorialDashboard;
