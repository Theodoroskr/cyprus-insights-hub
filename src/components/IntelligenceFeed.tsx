import { useEffect, useState } from "react";
import { Crown, ArrowRight, Building2, Users, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IntelligenceListItem } from "@/components/IntelligenceListItem";
import { InsightBanner } from "@/components/banners/InsightBanner";
import { AdSlot } from "@/components/banners/AdSlot";
import { useActiveBanner } from "@/hooks/useActiveBanner";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { useBlendedNews } from "@/hooks/useBlendedNews";
import { blendNews } from "@/lib/blendNews";

/** Sidebar filler: latest compliance/regtech headlines */
function LatestRegulatory() {
  const [items, setItems] = useState<{ id: string; title: string; published_at: string }[]>([]);
  useEffect(() => {
    supabase.from("cna_articles").select("id, title, published_at, vertical, source_id, source_url").eq("status", "published")
      .in("vertical", ["compliance", "regtech"]).order("published_at", { ascending: false }).limit(60)
      .then(({ data }) => data && setItems(blendNews(data).slice(0, 6)));
  }, []);
  if (items.length === 0) return null;
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-compliance mb-3">Regulatory updates</p>
      <ul className="space-y-3">
        {items.map((a) => (
          <li key={a.id}>
            <Link to={`/article/${a.id}`} className="block text-sm font-serif text-foreground leading-snug hover:text-secondary line-clamp-3">{a.title}</Link>
            <span className="text-[11px] text-muted-foreground">{new Date(a.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const normTitle = (t: string) => t.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(" ").slice(0, 8).join(" ");

interface DBArticle {
  id: string;
  title: string;
  vertical: string;
  what_happened: string;
  why_it_matters: string;
  what_to_do: string;
  published_at: string;
  image_url: string | null;
  tags: string[];
  body_markdown: string | null;
}

function HomepageMobileBanner() {
  const banner = useActiveBanner("homepage-stories");
  if (!banner) return null;
  return (
    <div className="py-4">
      <AdSlot size="mrec" slotId="homepage-stories" />
    </div>
  );
}

function StickySidebar() {
  return (
    <div className="space-y-5">
      {/* Premium upsell */}
      <div className="rounded-xl bg-gradient-to-b from-primary to-[hsl(213,80%,10%)] p-5 text-primary-foreground border border-secondary/10">
        <div className="flex items-center gap-2 mb-3">
          <Crown className="h-4 w-4 text-secondary" />
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-secondary">Premium</span>
        </div>
        <h4 className="font-serif font-bold text-sm mb-2">Unlock Full Intelligence</h4>
        <p className="text-xs text-primary-foreground/60 leading-relaxed mb-4">
          Daily briefings, PDF exports, and white-label reports for your team.
        </p>
        <Button size="sm" className="w-full text-xs bg-secondary text-primary hover:bg-secondary/90 gap-1">
          Upgrade Now
        </Button>
      </div>

      <AdSlot size="mrec" slotId="homepage-stories" />
      <LatestRegulatory />
    </div>
  );
}

export function IntelligenceFeed() {
  const { data: blendedArticles = [] } = useBlendedNews();
  const dbArticles = blendedArticles.slice(5, 17);

  const verticalToHub = (v: string) => {
    if (v === "fintech") return "fintechhub" as const;
    if (v === "compliance") return "compliancehub" as const;
    if (v === "regtech") return "regtechhub" as const;
    return "businesshub" as const;
  };

  const verticalLabel = (v: string) => {
    const map: Record<string, string> = {
      compliance: "Compliance & RegTech",
      fintech: "FinTech & Digital Finance",
      sme: "SME & Business",
      general: "Business Intelligence",
      regtech: "RegTech & ICT Risk",
    };
    return map[v] || "Business Intelligence";
  };

  if (dbArticles.length === 0) return null;

  return (
    <section className="section-rule section-rule-thick">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <span className="section-label">Latest Stories</span>
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground italic font-source-serif">
            What happened · Why it matters · What to do
          </span>
        </div>

        <div className="flex gap-8">
          <div className="flex-1 min-w-0">
            {dbArticles.map((article, index) => (
              <div key={article.id}>
                {/* Premium label for every 4th article — FC style inline indicator */}
                {index > 0 && index % 4 === 0 && (
                  <div className="flex items-center gap-2 mb-1 pt-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-secondary">Premium</span>
                  </div>
                )}
                <IntelligenceListItem
                  category={verticalLabel(article.vertical)}
                  date={new Date(article.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  whatHappened={article.what_happened}
                  whyItMatters={article.why_it_matters}
                  whatToDo={article.what_to_do}
                  hub={verticalToHub(article.vertical)}
                  imageUrl={article.image_url}
                  articleId={article.id}
                  href={`/article/${article.id}`}
                  isLead={index === 0}
                  bodyMarkdown={article.body_markdown}
                  tags={article.tags}
                />
                {index === 1 && (
                  <div className="lg:hidden">
                    <HomepageMobileBanner />
                  </div>
                )}
                {index === 2 && (
                  <div className="py-4">
                    <InsightBanner
                      text="Get daily intelligence briefings delivered to your inbox — curated for Cyprus business professionals."
                      ctaText="Register free for daily updates"
                      href="/dashboard"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <aside className="hidden lg:block w-[300px] flex-shrink-0">
            <div className="sticky top-24">
              <StickySidebar />
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
