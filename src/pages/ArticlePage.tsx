import { useEffect, useState, useMemo, useRef } from "react";
import { SEOHead } from "@/components/SEOHead";
import ReactMarkdown from "react-markdown";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, Zap, Target, Lightbulb, ExternalLink, Bookmark, Twitter, Linkedin, Mail, FileText, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";

interface Article {
  id: string;
  title: string;
  summary: string | null;
  what_happened: string | null;
  why_it_matters: string | null;
  what_to_do: string | null;
  body_markdown: string | null;
  image_url: string | null;
  vertical: string;
  published_at: string | null;
  source_url: string | null;
  tags: string[] | null;
}

const verticalLabel: Record<string, string> = {
  compliance: "Compliance & RegTech",
  fintech: "FinTech & Digital Finance",
  sme: "SME & Business",
  general: "Business Intelligence",
  regtech: "RegTech & ICT Risk",
};

const verticalColor: Record<string, string> = {
  compliance: "bg-compliance/15 text-compliance border-compliance/20",
  fintech: "bg-fintech/15 text-fintech border-fintech/20",
  sme: "bg-secondary/15 text-secondary border-secondary/20",
  general: "bg-secondary/15 text-secondary border-secondary/20",
  regtech: "bg-regtech/15 text-regtech border-regtech/20",
};

export default function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState<Article[]>([]);
  const { user } = useAuth();
  const [bookmarked, setBookmarked] = useState(false);
  const viewTracked = useRef(false);
  const articleRef = useRef<HTMLDivElement>(null);

  // Track view via IntersectionObserver — fires once when article content is visible
  useEffect(() => {
    if (!article || viewTracked.current) return;
    const el = articleRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !viewTracked.current) {
          viewTracked.current = true;
          const hash = sessionStorage.getItem("bh_viewer") || Math.random().toString(36).slice(2);
          if (!sessionStorage.getItem("bh_viewer")) sessionStorage.setItem("bh_viewer", hash);
          supabase.from("article_views").insert({ article_id: article.id, viewer_hash: hash }).then(() => {});
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [article]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    supabase
      .from("cna_articles")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (data) {
          setArticle(data as Article);
          // Track view via IntersectionObserver (fires once when article is visible)
          // Fetch related
          supabase
            .from("cna_articles")
            .select("id, title, what_happened, image_url, vertical, published_at, summary")
            .eq("status", "published")
            .eq("vertical", data.vertical)
            .neq("id", data.id)
            .order("published_at", { ascending: false })
            .limit(4)
            .then(({ data: rel }) => {
              if (rel) setRelated(rel as Article[]);
            });
        }
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (user && article) {
      supabase
        .from("saved_items")
        .select("id")
        .match({ user_id: user.id, item_type: "article", item_id: article.id })
        .then(({ data }) => {
          if (data && data.length > 0) setBookmarked(true);
        });
    }
  }, [user, article]);

  const toggleBookmark = async () => {
    if (!user || !article) return;
    if (bookmarked) {
      await supabase.from("saved_items").delete().match({ user_id: user.id, item_type: "article", item_id: article.id });
    } else {
      await supabase.from("saved_items").insert({
        user_id: user.id, item_type: "article", item_id: article.id,
        item_title: (article.what_happened || article.title).slice(0, 80),
      });
    }
    setBookmarked(!bookmarked);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavigation onSearch={() => {}} />
        <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading article…</div>
        <Footer />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavigation onSearch={() => {}} />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-serif font-bold mb-4">Article not found</h1>
          <Link to="/">
            <Button variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" /> Back to Home</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const date = article.published_at
    ? new Date(article.published_at).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "";

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={article.what_happened || article.title}
        description={article.summary || article.why_it_matters || ""}
        path={`/article/${article.id}`}
        image={article.image_url || undefined}
        type="article"
      />
      <TopNavigation onSearch={() => {}} />

      {/* Hero image */}
      {article.image_url && (
        <div className="relative w-full overflow-hidden">
          <img src={article.image_url} alt={article.title} className="w-full h-[300px] md:h-[420px] object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            <div className="container mx-auto max-w-4xl">
              <Badge variant="outline" className={`mb-3 ${verticalColor[article.vertical] || verticalColor.general}`}>
                {verticalLabel[article.vertical] || article.vertical}
              </Badge>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-white leading-snug drop-shadow-lg">
                {article.what_happened || article.title}
              </h1>
            </div>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto" ref={articleRef}>
          {/* Back + meta */}
          <div className="flex items-center justify-between mb-6">
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
            <div className="flex items-center gap-2">
              {user && (
                <button onClick={toggleBookmark} className="text-muted-foreground hover:text-secondary transition-colors" title="Bookmark">
                  <Bookmark className={`h-5 w-5 ${bookmarked ? "fill-secondary text-secondary" : ""}`} />
                </button>
              )}
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent((article.what_happened || article.title))}&url=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-[#1DA1F2] transition-colors"
                title="Share on X"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-[#0A66C2] transition-colors"
                title="Share on LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent((article.what_happened || article.title))}&body=${encodeURIComponent(`Read this article: ${window.location.href}`)}`}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Share via Email"
              >
                <Mail className="h-5 w-5" />
              </a>
              {article.source_url && (
                <a href={article.source_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" title="View original source">
                  <ExternalLink className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>

          {/* Title (if no hero image) */}
          {!article.image_url && (
            <>
              <Badge variant="outline" className={`mb-3 ${verticalColor[article.vertical] || verticalColor.general}`}>
                {verticalLabel[article.vertical] || article.vertical}
              </Badge>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground leading-tight mb-4">
                {article.what_happened || article.title}
              </h1>
            </>
          )}

          {date && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
              <Calendar className="h-4 w-4" />
              <span>{date}</span>
            </div>
          )}

          {/* Intelligence Cards */}
          <div className="space-y-6 mb-10">
            {article.what_happened && (
              <div className="border-l-4 border-secondary pl-5 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-secondary" />
                  <span className="text-xs font-bold uppercase tracking-wider text-secondary">What Happened</span>
                </div>
                <p className="text-foreground leading-relaxed">{article.what_happened}</p>
              </div>
            )}

            {article.why_it_matters && (
              <div className="border-l-4 border-destructive pl-5 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-destructive" />
                  <span className="text-xs font-bold uppercase tracking-wider text-destructive">Why It Matters</span>
                </div>
                <p className="text-foreground leading-relaxed">{article.why_it_matters}</p>
              </div>
            )}

            {article.what_to_do && (
              <div className="border-l-4 border-success pl-5 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-success" />
                  <span className="text-xs font-bold uppercase tracking-wider text-success">What To Do</span>
                </div>
                <p className="text-foreground leading-relaxed">{article.what_to_do}</p>
              </div>
            )}
          </div>

          {/* Tabbed: Summary / Full Article */}
          {(() => {
            // body_markdown is "distinct" only if it's long enough to be real content (not just a date)
            const hasDistinctBody = article.body_markdown
              && article.body_markdown.trim().length > 80
              && article.body_markdown.trim() !== (article.summary || "").trim();
            if (hasDistinctBody) {
              return (
                <Tabs defaultValue="summary" className="mb-10">
                  <TabsList className="w-full justify-start bg-muted/50 h-auto p-1 rounded-lg">
                    {article.summary && (
                      <TabsTrigger value="summary" className="text-sm px-5 py-2.5 data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-md gap-2">
                        <FileText className="h-4 w-4" /> Summary
                      </TabsTrigger>
                    )}
                    <TabsTrigger value="full" className="text-sm px-5 py-2.5 data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-md gap-2">
                      <BookOpen className="h-4 w-4" /> Full Article
                    </TabsTrigger>
                  </TabsList>
                  {article.summary && (
                    <TabsContent value="summary" className="mt-4">
                      <div className="bg-muted/30 rounded-xl p-6 border border-border">
                        <p className="text-muted-foreground leading-relaxed">{article.summary}</p>
                      </div>
                    </TabsContent>
                  )}
                  <TabsContent value="full" className="mt-4">
                    <div className="prose prose-lg max-w-none text-foreground prose-headings:font-serif prose-a:text-secondary">
                      <ReactMarkdown>{article.body_markdown!
                        .replace(/(?:^|\n)\s*Print\s*(?:\n|$)/gi, "\n")
                        .replace(/(?:^|\n)\s*For the analytical data,?\s*(?:please\s+)?click here\.?\s*(?:\n|$)/gi, "\n")
                        .replace(/\[For the analytical data,?\s*(?:please\s+)?click here\.?\]\([^)]*\)/gi, "")
                      }</ReactMarkdown>
                    </div>
                  </TabsContent>
                </Tabs>
              );
            } else if (article.summary) {
              return (
                <div className="bg-muted/30 rounded-xl p-6 border border-border mb-10">
                  <p className="text-muted-foreground leading-relaxed">{article.summary}</p>
                </div>
              );
            }
            return null;
          })()}

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-10">
              {article.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
              ))}
            </div>
          )}

          {/* Source link */}
          {article.source_url && (
            <a
              href={article.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-secondary hover:underline mb-10"
            >
              <ExternalLink className="h-4 w-4" /> View original source
            </a>
          )}
        </div>

        {/* Related articles */}
        {related.length > 0 && (
          <div className="max-w-5xl mx-auto mt-12 pt-8 border-t border-border">
            <h3 className="section-label mb-6">Related Intelligence</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {related.map((r) => (
                <Link key={r.id} to={`/article/${r.id}`} className="group">
                  <div className="rounded-lg overflow-hidden border border-border bg-card hover:shadow-md transition-shadow">
                    {r.image_url && (
                      <img src={r.image_url} alt="" className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-500" />
                    )}
                    <div className="p-3">
                      <Badge variant="outline" className="text-[9px] mb-2">{verticalLabel[r.vertical] || r.vertical}</Badge>
                      <h4 className="font-serif font-bold text-sm leading-snug line-clamp-2 group-hover:text-secondary transition-colors">
                        {r.what_happened || r.title}
                      </h4>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
