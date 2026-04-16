import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, Plus, FileEdit, Eye, EyeOff, Trash2, RefreshCw, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type DirectoryArticle = Database["public"]["Tables"]["directory_articles"]["Row"];
type ArticleType = Database["public"]["Enums"]["directory_article_type"];

const TYPE_LABELS: Record<ArticleType, string> = {
  news: "News",
  interview: "Interview",
  insight: "Insight",
  whoiswho: "Who Is Who",
};

const PAGE_SIZE = 12;

const emptyForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  cover_image: "",
  article_type: "news" as ArticleType,
  is_published: false,
};

export function DirectoryArticlesPanel() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ArticleType | "all">("all");
  const [page, setPage] = useState(0);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ["dir-articles-admin", search, typeFilter, page],
    queryFn: async () => {
      let q = supabase
        .from("directory_articles")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (typeFilter !== "all") q = q.eq("article_type", typeFilter);
      if (search.trim()) q = q.ilike("title", `%${search}%`);

      const { data, count, error } = await q;
      if (error) throw error;
      return { articles: data ?? [], total: count ?? 0 };
    },
  });

  const articles = data?.articles ?? [];
  const totalPages = Math.ceil((data?.total ?? 0) / PAGE_SIZE);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title,
        slug: form.slug,
        excerpt: form.excerpt || null,
        content: form.content || null,
        cover_image: form.cover_image || null,
        article_type: form.article_type,
        is_published: form.is_published,
        published_at: form.is_published ? new Date().toISOString() : null,
      };

      if (editingId) {
        const { error } = await supabase.from("directory_articles").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("directory_articles").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dir-articles-admin"] });
      setEditorOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      toast.success(editingId ? "Article updated" : "Article created");
    },
    onError: (err) => toast.error((err as Error).message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("directory_articles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dir-articles-admin"] });
      toast.success("Article deleted");
    },
    onError: (err) => toast.error((err as Error).message),
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, publish }: { id: string; publish: boolean }) => {
      const { error } = await supabase
        .from("directory_articles")
        .update({
          is_published: publish,
          published_at: publish ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dir-articles-admin"] });
      toast.success("Status updated");
    },
    onError: (err) => toast.error((err as Error).message),
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setEditorOpen(true);
  };

  const openEdit = (article: DirectoryArticle) => {
    setEditingId(article.id);
    setForm({
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt || "",
      content: article.content || "",
      cover_image: article.cover_image || "",
      article_type: article.article_type,
      is_published: article.is_published,
    });
    setEditorOpen(true);
  };

  const autoSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 120);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-serif font-bold text-foreground mb-1">Directory Articles</h2>
          <p className="text-sm text-muted-foreground">{data?.total ?? 0} articles · News, Interviews, Insights, Who Is Who</p>
        </div>
        <Button size="sm" onClick={openCreate} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> New Article
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search articles…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v as any); setPage(0); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="news">News</SelectItem>
            <SelectItem value="interview">Interview</SelectItem>
            <SelectItem value="insight">Insight</SelectItem>
            <SelectItem value="whoiswho">Who Is Who</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>No directory articles found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <div key={article.id} className="bento-card flex flex-col sm:flex-row sm:items-center gap-4">
              {article.cover_image && (
                <img src={article.cover_image} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0 border border-border" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-[10px]">{TYPE_LABELS[article.article_type]}</Badge>
                  <Badge variant={article.is_published ? "default" : "secondary"} className="text-[10px]">
                    {article.is_published ? "Published" : "Draft"}
                  </Badge>
                </div>
                <h3 className="font-semibold text-foreground truncate">{article.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{article.excerpt || "No excerpt"}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(article.created_at), { addSuffix: true })}
                  {article.content ? ` · ${article.content.split(/\s+/).length} words` : " · No content"}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={() => openEdit(article)}>
                  <FileEdit className="w-4 h-4 mr-1" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => togglePublish.mutate({ id: article.id, publish: !article.is_published })}
                  disabled={togglePublish.isPending}
                >
                  {article.is_published ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                  {article.is_published ? "Unpublish" : "Publish"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    if (confirm("Delete this article permanently?")) {
                      deleteMutation.mutate(article.id);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
          <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Editor Dialog */}
      <Dialog open={editorOpen} onOpenChange={(o) => { if (!o) { setEditorOpen(false); setEditingId(null); } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Article" : "New Directory Article"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="section-label">Title</label>
              <Input
                value={form.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setForm((f) => ({
                    ...f,
                    title,
                    slug: editingId ? f.slug : autoSlug(title),
                  }));
                }}
                placeholder="Article title"
              />
            </div>
            <div>
              <label className="section-label">Slug</label>
              <Input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="article-url-slug"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="section-label">Type</label>
                <Select value={form.article_type} onValueChange={(v) => setForm((f) => ({ ...f, article_type: v as ArticleType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="news">News</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="insight">Insight</SelectItem>
                    <SelectItem value="whoiswho">Who Is Who</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="section-label">Cover Image URL</label>
                <Input
                  value={form.cover_image}
                  onChange={(e) => setForm((f) => ({ ...f, cover_image: e.target.value }))}
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
            </div>
            {form.cover_image && (
              <img src={form.cover_image} alt="Cover preview" className="h-40 w-full object-cover rounded-lg border border-border" />
            )}
            <div>
              <label className="section-label">Excerpt</label>
              <Textarea
                rows={2}
                value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                placeholder="Brief summary shown in cards and previews…"
              />
            </div>
            <div>
              <label className="section-label">Content (Markdown supported)</label>
              <Textarea
                rows={16}
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                placeholder="Write the full article content here. Markdown formatting is supported."
                className="font-mono text-sm"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                {form.content ? `${form.content.split(/\s+/).filter(Boolean).length} words` : "0 words"}
              </p>
            </div>
            <div className="flex justify-between items-center pt-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))}
                  className="rounded"
                />
                Publish immediately
              </label>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setEditorOpen(false); setEditingId(null); }}>Cancel</Button>
                <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.title || !form.slug}>
                  {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                  {editingId ? "Save Changes" : "Create Article"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
