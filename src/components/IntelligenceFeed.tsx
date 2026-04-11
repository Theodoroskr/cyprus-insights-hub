import { useEffect, useState } from "react";
import { IntelligenceListItem } from "@/components/IntelligenceListItem";
import { InsightBanner } from "@/components/banners/InsightBanner";
import { getIntelligenceBriefings, getPersonById } from "@/data/knowledgeGraph";
import { supabase } from "@/integrations/supabase/client";

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
}

export function IntelligenceFeed() {
  const [dbArticles, setDbArticles] = useState<DBArticle[]>([]);
  const staticBriefings = getIntelligenceBriefings();

  useEffect(() => {
    supabase
      .from("cna_articles")
      .select("id, title, vertical, what_happened, why_it_matters, what_to_do, published_at, image_url, tags")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(12)
      .then(({ data, error }) => {
        if (error) console.error("CNA fetch error:", error);
        if (data && data.length > 0) {
          setDbArticles(data as DBArticle[]);
          const viewerHash = sessionStorage.getItem("bh_viewer") || Math.random().toString(36).slice(2) + Date.now().toString(36);
          if (!sessionStorage.getItem("bh_viewer")) sessionStorage.setItem("bh_viewer", viewerHash);
          const viewInserts = data.map((a: any) => ({ article_id: a.id, viewer_hash: viewerHash }));
          supabase.from("article_views").insert(viewInserts).then(() => {});
        }
      });
  }, []);

  const verticalToHub = (v: string) => {
    if (v === "fintech") return "fintechhub" as const;
    if (v === "compliance") return "compliancehub" as const;
    return "businesshub" as const;
  };

  const verticalLabel = (v: string) => {
    const map: Record<string, string> = {
      compliance: "Compliance & RegTech",
      fintech: "FinTech & Digital Finance",
      sme: "SME & Business",
      general: "Business Intelligence",
    };
    return map[v] || "Business Intelligence";
  };

  const hasDBArticles = dbArticles.length > 0;

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

        <div className="divide-y-0">
          {hasDBArticles
            ? dbArticles.map((article, index) => (
                <div key={article.id}>
                  <IntelligenceListItem
                    category={verticalLabel(article.vertical)}
                    date={new Date(article.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    whatHappened={article.what_happened}
                    whyItMatters={article.why_it_matters}
                    whatToDo={article.what_to_do}
                    hub={verticalToHub(article.vertical)}
                    imageUrl={article.image_url}
                    articleId={article.id}
                  />
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
              ))
            : staticBriefings.map((article, index) => {
                const person = article.personIds[0]
                  ? getPersonById(article.personIds[0])
                  : undefined;

                return (
                  <div key={article.id}>
                    <IntelligenceListItem
                      category={article.category}
                      date={article.date}
                      whatHappened={article.intelligence!.whatHappened}
                      whyItMatters={article.intelligence!.whyItMatters}
                      whatToDo={article.intelligence!.whatToDo}
                      hub={article.hub}
                      linkedPerson={
                        person
                          ? { name: person.name, title: `${person.title}, ${person.company}`, image: person.image }
                          : undefined
                      }
                    />
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
                );
              })}
        </div>
      </div>
    </section>
  );
}
