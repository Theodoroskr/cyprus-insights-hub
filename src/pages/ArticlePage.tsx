import { articleImage, FALLBACK_IMAGE } from "@/lib/fallbackImage";
import { useEffect, useState, useMemo, useRef } from "react";
import { SEOHead } from "@/components/SEOHead";
import { canonicalUrl } from "@/lib/seo";
import { previewImage } from "@/lib/storyPreview";
import ReactMarkdown from "react-markdown";
import { AdSlot } from "@/components/banners/AdSlot";
import { groupArticleImages } from "@/lib/groupArticleImages";
import { storyImage } from "@/lib/fallbackImage";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, Zap, Target, Lightbulb, ExternalLink, Bookmark, Twitter, Linkedin, Facebook, Mail, Flame, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cleanArticleMarkdown, cleanedWordCount } from "@/lib/cleanArticleMarkdown";
import { estimateReadingTime } from "@/lib/readingTime";
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
  original_language?: string | null;
  updated_at?: string | null;
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
  const [expanded, setExpanded] = useState(false);
  const [mostRead, setMostRead] = useState<{ article_id: string; title: string }[]>([]);
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
    supabase.rpc("get_most_read_articles", { _limit: 5 }).then(({ data }) => data && setMostRead(data as any));
  }, []);

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
    ? new Date(article.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "";
  const headline = article.title || (article.what_happened || "").split(/(?<=\.)\s/)[0];
  const source = article.source_url ? new URL(article.source_url).hostname.replace(/^www\./, "") : null;
  const cleanBody = cleanArticleMarkdown(article.body_markdown);
  const heroSrc = storyImage(article.image_url, article.vertical, article.id, article.body_markdown);
  const hasBody = cleanedWordCount(cleanBody) >= 60;
  const readTime = estimateReadingTime(article.what_happened, article.why_it_matters, article.what_to_do, hasBody ? cleanBody : article.summary);
  const isLong = cleanBody.length > 2500;
  const shareText = encodeURIComponent(headline);
  const shareUrl = encodeURIComponent(canonicalUrl(`/article/${article.id}`));

  const cards = [
    { key: "what", text: article.what_happened, label: "What happened", Icon: Zap, tone: "secondary" },
    { key: "why", text: article.why_it_matters, label: "Why it matters", Icon: Target, tone: "destructive" },
    { key: "do", text: article.what_to_do, label: "What to do", Icon: Lightbulb, tone: "success" },
  ].filter((c) => c.text);
  const toneClass: Record<string, string> = {
    secondary: "border-secondary text-secondary",
    destructive: "border-destructive text-destructive",
    success: "border-success text-success",
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={headline}
        description={article.summary || article.why_it_matters || ""}
        path={`/article/${article.id}`}
        image={previewImage(article)}
        vertical={article.vertical}
        type="article"
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "News", href: "/news" },
          { name: headline.slice(0, 110), href: `/article/${article.id}` },
        ]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          headline: headline.slice(0, 110),
          description: article.summary || undefined,
          datePublished: article.published_at || undefined,
          dateModified: article.updated_at || article.published_at || undefined,
          image: heroSrc.startsWith("http") ? [heroSrc] : [`https://businesshub.cy${heroSrc}`],
          articleSection: verticalLabel[article.vertical] || article.vertical,
          keywords: article.tags?.join(", ") || undefined,
          abstract: article.why_it_matters || undefined,
          mainEntityOfPage: `https://businesshub.cy/article/${article.id}`,
          isBasedOn: article.source_url || undefined,
          author: { "@type": "Organization", name: "BusinessHub.cy", url: "https://businesshub.cy/" },
          publisher: {
            "@type": "Organization",
            name: "BusinessHub.cy",
            url: "https://businesshub.cy/",
            logo: { "@type": "ImageObject", url: "https://businesshub.cy/apple-touch-icon.png" },
          },
        }}
      />
      <TopNavigation onSearch={() => {}} />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>

          {/* Header */}
          <header className="max-w-4xl mb-8">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground mb-4">
              <Badge variant="outline" className={verticalColor[article.vertical] || verticalColor.general}>
                {verticalLabel[article.vertical] || article.vertical}
              </Badge>
              {source && <span className="font-medium text-foreground">{source}</span>}
              {date && <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{date}</span>}
              <span>{readTime}</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground leading-tight mb-4 line-clamp-4">
              {headline}
            </h1>
            {article.summary && (
              <p className="text-lg md:text-xl text-muted-foreground font-source-serif leading-relaxed">{article.summary}</p>
            )}
          </header>

          {(
            <figure className="mb-10">
              <img src={heroSrc} alt={headline} data-vertical={article.vertical} data-seed={article.id} className="w-full aspect-[16/9] object-cover rounded-lg bg-muted" />
              {article.image_url && source && <figcaption className="text-xs text-muted-foreground mt-2">Image: {source}</figcaption>}
            </figure>
          )}

          <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-10">
            {/* Article column */}
            <article ref={articleRef} className="min-w-0">
              {cards.length > 0 && (
                <h2 className="section-label mb-4">BusinessHub analysis</h2>
              )}
              {cards.length > 0 && (
                <div className="grid gap-4 mb-10">
                  {cards.map(({ key, text, label, Icon, tone }) => (
                    <div key={key} className={`border-l-4 pl-5 py-1 ${toneClass[tone].split(" ")[0]}`}>
                      <div className={`flex items-center gap-2 mb-1.5 ${toneClass[tone].split(" ")[1]}`}>
                        <Icon className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
                      </div>
                      <p className="text-foreground leading-relaxed">{text}</p>
                    </div>
                  ))}
                </div>
              )}

              {hasBody ? (
                <div className="mb-10">
                  <h2 className="section-label mb-4">Full article</h2>
                  <div className={`relative ${isLong && !expanded ? "max-h-[900px] overflow-hidden" : ""}`}>
                    <div className="prose prose-lg max-w-[68ch] text-foreground prose-headings:font-serif prose-a:text-secondary prose-img:rounded-lg">
                      {groupArticleImages(cleanBody, heroSrc).map((seg, i) =>
                        seg.type === "text" ? (
                          <div key={i}>
                            <ReactMarkdown>{seg.markdown}</ReactMarkdown>
                            {i === 0 && <div className="not-prose my-8"><AdSlot size="leaderboard" slotId="article-inline" /></div>}
                          </div>
                        ) : (
                          <div key={i} className="not-prose my-6 grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {seg.images.slice(0, 6).map((img, j) => (
                              <a key={j} href={img.src} target="_blank" rel="noopener noreferrer" className="relative block aspect-square overflow-hidden rounded-md bg-muted">
                                <img src={img.src} alt={img.alt} loading="lazy" data-no-fallback onError={(e) => { const tile = e.currentTarget.parentElement as HTMLElement; if (tile) tile.style.display = "none"; }} className="h-full w-full object-cover transition-transform hover:scale-105" />
                                {j === 5 && seg.images.length > 6 && (
                                  <span className="absolute inset-0 flex items-center justify-center bg-foreground/60 text-lg font-semibold text-background">
                                    +{seg.images.length - 6}
                                  </span>
                                )}
                              </a>
                            ))}
                          </div>
                        )
                      )}
                    </div>
                    {isLong && !expanded && (
                      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-background to-transparent" />
                    )}
                  </div>
                  {isLong && !expanded && (
                    <Button variant="outline" className="mt-4 gap-2" onClick={() => setExpanded(true)}>
                      Continue reading <ChevronDown className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ) : null}

              {article.original_language === "el" && (
                <p className="text-sm text-muted-foreground italic mb-3">Translated from Greek.</p>
              )}
              {article.source_url && (
                <a href={article.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex">
                  <Button variant={hasBody ? "ghost" : "default"} className="gap-2 mb-10">
                    <ExternalLink className="h-4 w-4" />
                    {hasBody ? `Read original at ${source}` : `Read the full release at ${source}`}
                  </Button>
                </a>
              )}
            </article>

            {/* Sidebar */}
            <aside className="space-y-6 lg:sticky lg:top-24 self-start">
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="section-label mb-3">Share</p>
                <div className="flex items-center gap-4 text-muted-foreground">
                  {user && (
                    <button onClick={toggleBookmark} className="hover:text-secondary transition-colors" title="Bookmark">
                      <Bookmark className={`h-5 w-5 ${bookmarked ? "fill-secondary text-secondary" : ""}`} />
                    </button>
                  )}
                  <a href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`} target="_blank" rel="noopener noreferrer" className="hover:text-foreground" title="Share on Facebook"><Facebook className="h-5 w-5" /></a>
                  <a href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`} target="_blank" rel="noopener noreferrer" className="hover:text-foreground" title="Share on X"><Twitter className="h-5 w-5" /></a>
                  <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`} target="_blank" rel="noopener noreferrer" className="hover:text-foreground" title="Share on LinkedIn"><Linkedin className="h-5 w-5" /></a>
                  <a href={`mailto:?subject=${shareText}&body=${shareUrl}`} className="hover:text-foreground" title="Share via Email"><Mail className="h-5 w-5" /></a>
                </div>
              </div>

              {article.tags && article.tags.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="section-label mb-3">Topics</p>
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map((tag) => (
                      <Link key={tag} to={`/search?q=${encodeURIComponent(tag)}`}>
                        <Badge variant="outline" className="text-xs hover:border-secondary hover:text-secondary">{tag}</Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {mostRead.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="section-label mb-3 flex items-center gap-1.5"><Flame className="h-3.5 w-3.5 text-destructive" />Most read</p>
                  <ol className="space-y-3">
                    {mostRead.filter((m) => m.article_id !== article.id).slice(0, 5).map((m, i) => (
                      <li key={m.article_id} className="flex gap-3">
                        <span className="font-serif font-black text-xl text-muted-foreground/30 leading-none">{i + 1}</span>
                        <Link to={`/article/${m.article_id}`} className="text-sm font-serif leading-snug hover:text-secondary line-clamp-3">{m.title}</Link>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </aside>
          </div>

          {/* Related articles */}
          {related.length > 0 && (
            <div className="mt-12 pt-8 border-t border-border">
              <h3 className="section-label mb-6">Related Intelligence</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {related.map((r) => (
                  <Link key={r.id} to={`/article/${r.id}`} className="group">
                    <div className="rounded-lg overflow-hidden border border-border bg-card hover:shadow-md transition-shadow h-full">
                      {(
                        <img src={articleImage(r.image_url, r.vertical, r.id)} alt="" className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-500" />
                      )}
                      <div className="p-3">
                        <Badge variant="outline" className="text-[9px] mb-2">{verticalLabel[r.vertical] || r.vertical}</Badge>
                        <h4 className="font-serif font-bold text-sm leading-snug line-clamp-3 group-hover:text-secondary transition-colors">
                          {r.title || r.what_happened}
                        </h4>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
