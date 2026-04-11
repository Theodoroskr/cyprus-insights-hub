import { IntelligenceCard } from "@/components/IntelligenceCard";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { getIntelligenceBriefings, getPersonById } from "@/data/knowledgeGraph";

export function IntelligenceFeed() {
  const briefings = getIntelligenceBriefings();

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-primary">Intelligence Briefings</h2>
            <p className="text-muted-foreground text-sm">
              Structured analysis — what happened, why it matters, what to do
            </p>
          </div>
          <Button variant="outline" size="sm" className="hidden sm:flex">
            All Briefings
            <ExternalLink className="ml-2 h-3 w-3" />
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {briefings.map((article) => {
            const person = article.personIds[0]
              ? getPersonById(article.personIds[0])
              : undefined;

            return (
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
            );
          })}
        </div>
      </div>
    </section>
  );
}
