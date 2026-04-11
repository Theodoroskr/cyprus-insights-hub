import { useEffect, useState } from "react";
import { IntelligenceCard } from "@/components/IntelligenceCard";
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
      .then(({ data }) => {
        if (data && data.length > 0) setDbArticles(data as DBArticle[]);
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

  // Use DB articles if available, otherwise fall back to static data
  const hasDBArticles = dbArticles.length > 0;

  return (
    <section className="section-rule section-rule-thick">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <span className="section-label">Intelligence Briefings</span>
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground italic font-source-serif">
            What happened · Why it matters · What to do
          </span>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {hasDBArticles
            ? dbArticles.map((article, index) => (
                <>
                  <IntelligenceCard
                    key={article.id}
                    category={verticalLabel(article.vertical)}
                    date={new Date(article.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    whatHappened={article.what_happened}
                    whyItMatters={article.why_it_matters}
                    whatToDo={article.what_to_do}
                    hub={verticalToHub(article.vertical)}
                    articleId={article.id}
                  />
                  {index === 1 && (
                    <div key="upsell-banner" className="md:col-span-2 lg:col-span-3">
                      <InsightBanner
                        text="Get daily intelligence briefings delivered to your inbox — curated for Cyprus business professionals."
                        ctaText="Register free for daily updates"
                        href="/dashboard"
                      />
                    </div>
                  )}
                </>
              ))
            : staticBriefings.map((article, index) => {
                const person = article.personIds[0]
                  ? getPersonById(article.personIds[0])
                  : undefined;

                return (
                  <>
                    <IntelligenceCard
                      key={article.id}
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
                    {index === 1 && (
                      <div key="upsell-banner" className="md:col-span-2 lg:col-span-3">
                        <InsightBanner
                          text="Get daily intelligence briefings delivered to your inbox — curated for Cyprus business professionals."
                          ctaText="Register free for daily updates"
                          href="/dashboard"
                        />
                      </div>
                    )}
                  </>
                );
              })}
        </div>
      </div>
    </section>
  );
}
