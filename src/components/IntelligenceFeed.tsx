import { IntelligenceCard } from "@/components/IntelligenceCard";
import { InsightBanner } from "@/components/banners/InsightBanner";
import { getIntelligenceBriefings, getPersonById } from "@/data/knowledgeGraph";

export function IntelligenceFeed() {
  const briefings = getIntelligenceBriefings();

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
          {briefings.map((article, index) => {
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
