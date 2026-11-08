import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LIVE_REPORTS } from "@/components/resources/LiveReports";
import { formatReviewed } from "@/lib/resourceFreshness";

export default function ResourceDetailPage() {
  const { slug = "" } = useParams();
  const { data: r, isLoading } = useQuery({
    queryKey: ["resource", slug],
    queryFn: async () => (await supabase.from("resources").select("*").eq("slug", slug).eq("is_published", true).maybeSingle()).data,
  });
  const Live = LIVE_REPORTS[slug];
  const reviewed = formatReviewed(r?.reviewed_at);

  return (
    <div className="min-h-screen bg-background">
      {r && <SEOHead title={r.title} description={r.description || r.title} path={`/resources/${slug}`} />}
      <TopNavigation onSearch={() => {}} />
      <main className="container mx-auto px-4 py-10 max-w-3xl">
        <Link to="/resources" className="inline-flex items-center gap-1 text-xs uppercase tracking-wider text-muted-foreground hover:text-secondary mb-6">
          <ArrowLeft className="h-3 w-3" /> Resource Hub
        </Link>
        {isLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : !r ? (
          <p className="text-muted-foreground">This resource isn't available.</p>
        ) : (
          <article>
            <Badge className="bg-foreground text-background rounded-none text-[10px] uppercase tracking-wider mb-3">
              {r.category} · {r.resource_type}
            </Badge>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground leading-tight mb-3">{r.title}</h1>
            {r.description && <p className="article-body text-lg mb-2">{r.description}</p>}
            {reviewed && <p className="text-xs text-muted-foreground mb-8">Last reviewed {reviewed}</p>}
            {Live ? (
              <Live />
            ) : (
              <div className="prose prose-lg max-w-none prose-headings:font-serif prose-a:text-secondary">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{r.content || ""}</ReactMarkdown>
              </div>
            )}
            <p className="text-xs text-muted-foreground italic mt-10 border-t border-border pt-4">
              Informational only. Not legal, tax or financial advice. Check the official sources before acting.
            </p>
          </article>
        )}
      </main>
      <Footer />
    </div>
  );
}
