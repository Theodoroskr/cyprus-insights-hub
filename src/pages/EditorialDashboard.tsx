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
import { toast } from "@/hooks/use-toast";
import {
  Shield, TrendingUp, Building2, Globe,
  CheckCircle, Archive, FileEdit, Eye, Clock,
  Search, Filter, RefreshCw, ChevronLeft, ChevronRight,
  AlertTriangle
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Article = Database["public"]["Tables"]["cna_articles"]["Row"];
type ArticleStatus = Database["public"]["Enums"]["article_status"];
type ArticleVertical = Database["public"]["Enums"]["article_vertical"];

const VERTICAL_CONFIG: Record<ArticleVertical, { label: string; icon: typeof Shield; color: string }> = {
  compliance: { label: "Compliance", icon: Shield, color: "bg-blue-100 text-blue-800 border-blue-200" },
  fintech: { label: "FinTech", icon: TrendingUp, color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  sme: { label: "SME", icon: Building2, color: "bg-amber-100 text-amber-800 border-amber-200" },
  general: { label: "General", icon: Globe, color: "bg-muted text-muted-foreground border-border" },
};

const STATUS_CONFIG: Record<ArticleStatus, { label: string; icon: typeof Clock; color: string }> = {
  draft: { label: "Draft", icon: Clock, color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  published: { label: "Published", icon: CheckCircle, color: "bg-green-100 text-green-800 border-green-200" },
  archived: { label: "Archived", icon: Archive, color: "bg-muted text-muted-foreground border-border" },
};

const PAGE_SIZE = 12;

const EditorialDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<ArticleStatus | "all">("all");
  const [verticalFilter, setVerticalFilter] = useState<ArticleVertical | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [editForm, setEditForm] = useState<Partial<Article>>({});

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
      toast({ title: `Article ${status}`, description: `Article has been ${status} successfully.` });
    },
    onError: (err) => toast({ title: "Error", description: (err as Error).message, variant: "destructive" }),
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
      toast({ title: "Saved", description: "Article updated successfully." });
    },
    onError: (err) => toast({ title: "Error", description: (err as Error).message, variant: "destructive" }),
  });

  const openEditor = (article: Article) => {
    setEditingArticle(article);
    setEditForm({
      title: article.title,
      summary: article.summary,
      vertical: article.vertical,
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Editorial Dashboard</h1>
          <p className="text-muted-foreground mt-1">Review, edit, and publish CNA intelligence articles</p>
        </div>

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
            </SelectContent>
          </Select>
        </div>

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
            {articles.map((article) => {
              const vCfg = VERTICAL_CONFIG[article.vertical];
              const sCfg = STATUS_CONFIG[article.status];
              const VIcon = vCfg.icon;
              return (
                <div key={article.id} className="bento-card flex flex-col sm:flex-row sm:items-center gap-4">
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
                        className="bg-green-600 hover:bg-green-700 text-white"
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
                </SelectContent>
              </Select>
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
