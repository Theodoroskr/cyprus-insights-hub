import { Link } from "react-router-dom";
import {
  Network,
  Newspaper,
  User,
  ArrowRight,
  BadgeCheck,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  persons,
  articles,
  getArticlesForPerson,
  getPersonsForArticle,
  type KGPerson,
  type KGArticle,
} from "@/data/knowledgeGraph";
import { useState } from "react";

type FocusTarget =
  | { type: "person"; id: string }
  | { type: "article"; id: string }
  | null;

export function KnowledgeGraph() {
  const [focus, setFocus] = useState<FocusTarget>(null);

  const focusedArticles: KGArticle[] =
    focus?.type === "person"
      ? getArticlesForPerson(focus.id)
      : focus?.type === "article"
      ? [articles.find((a) => a.id === focus.id)!]
      : articles.slice(0, 5);

  const focusedPersons: KGPerson[] =
    focus?.type === "article"
      ? getPersonsForArticle(focus.id)
      : focus?.type === "person"
      ? [persons.find((p) => p.id === focus.id)!]
      : persons;

  const isPersonHighlighted = (pid: string) => {
    if (!focus) return true;
    if (focus.type === "person") return focus.id === pid;
    return focusedPersons.some((p) => p.id === pid);
  };

  const isArticleHighlighted = (aid: string) => {
    if (!focus) return true;
    if (focus.type === "article") return focus.id === aid;
    return focusedArticles.some((a) => a.id === aid);
  };

  const clearFocus = () => setFocus(null);

  return (
    <section className="py-8 bg-muted/20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
              <Network className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-primary">Knowledge Graph</h2>
              <p className="text-muted-foreground text-sm">
                Click any person or article to explore connections
              </p>
            </div>
          </div>
          {focus && (
            <Button variant="outline" size="sm" onClick={clearFocus}>
              Clear Filter
            </Button>
          )}
        </div>

        {/* Graph Visualization — Two-column interactive layout */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* People Column */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-secondary" />
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                People
              </h3>
              <span className="text-xs text-muted-foreground">
                ({focusedPersons.length})
              </span>
            </div>
            <div className="space-y-2">
              {persons.map((person) => {
                const highlighted = isPersonHighlighted(person.id);
                const articleCount = getArticlesForPerson(person.id).length;
                const isActive =
                  focus?.type === "person" && focus.id === person.id;

                return (
                  <button
                    key={person.id}
                    onClick={() =>
                      setFocus(
                        isActive ? null : { type: "person", id: person.id }
                      )
                    }
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left
                      ${
                        isActive
                          ? "border-secondary bg-secondary/10 shadow-sm"
                          : highlighted
                          ? "border-border bg-card hover:border-secondary/40"
                          : "border-border/50 bg-card/50 opacity-40"
                      }
                    `}
                  >
                    <div className="relative">
                      <img
                        src={person.image}
                        alt={person.name}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-border"
                      />
                      {person.trending && (
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">
                          {person.name}
                        </p>
                        {person.badges.map((b) => (
                          <span
                            key={b}
                            className="inline-flex items-center gap-0.5 text-[10px] font-medium text-secondary bg-secondary/10 px-1.5 py-0.5 rounded"
                          >
                            <BadgeCheck className="h-2.5 w-2.5" />
                            {b}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {person.title} · {person.company}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge
                        variant="outline"
                        className="text-[10px] tabular-nums"
                      >
                        {articleCount} articles
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Co-mention insight when person focused */}
            {focus?.type === "person" && (
              <div className="mt-4 p-3 rounded-lg border border-secondary/20 bg-secondary/5">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-secondary">
                    {focusedArticles.length} articles
                  </span>{" "}
                  mention{" "}
                  {persons.find((p) => p.id === focus.id)?.name}. Co-mentioned
                  with{" "}
                  <span className="font-medium text-foreground">
                    {
                      new Set(
                        focusedArticles.flatMap((a) =>
                          a.personIds.filter((pid) => pid !== focus.id)
                        )
                      ).size
                    }{" "}
                    other people
                  </span>
                  .
                </p>
              </div>
            )}
          </div>

          {/* Articles Column */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Newspaper className="h-4 w-4 text-secondary" />
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                Articles
              </h3>
              <span className="text-xs text-muted-foreground">
                ({focusedArticles.length})
              </span>
            </div>
            <div className="space-y-2">
              {(focus ? focusedArticles : articles.slice(0, 6)).map(
                (article) => {
                  const highlighted = isArticleHighlighted(article.id);
                  const linkedPersons = getPersonsForArticle(article.id);
                  const isActive =
                    focus?.type === "article" && focus.id === article.id;

                  const hubColors: Record<string, string> = {
                    businesshub: "bg-secondary/15 text-secondary",
                    fintechhub: "bg-fintech/15 text-fintech",
                    compliancehub: "bg-compliance/15 text-compliance",
                  };

                  return (
                    <button
                      key={article.id}
                      onClick={() =>
                        setFocus(
                          isActive
                            ? null
                            : { type: "article", id: article.id }
                        )
                      }
                      className={`w-full p-3 rounded-xl border transition-all text-left
                        ${
                          isActive
                            ? "border-secondary bg-secondary/10 shadow-sm"
                            : highlighted
                            ? "border-border bg-card hover:border-secondary/40"
                            : "border-border/50 bg-card/50 opacity-40"
                        }
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Newspaper className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${hubColors[article.hub]}`}
                            >
                              {article.category}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {article.date}
                            </span>
                          </div>
                          <h4 className="text-sm font-medium text-foreground leading-tight line-clamp-2">
                            {article.title}
                          </h4>
                          {/* Linked person avatars */}
                          <div className="flex items-center gap-1 mt-2">
                            <div className="flex -space-x-1.5">
                              {linkedPersons.map((p) => (
                                <img
                                  key={p.id}
                                  src={p.image}
                                  alt={p.name}
                                  className="w-5 h-5 rounded-full ring-1 ring-card object-cover"
                                />
                              ))}
                            </div>
                            <span className="text-[10px] text-muted-foreground ml-1">
                              {linkedPersons.map((p) => p.name.split(" ")[1]).join(", ")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                }
              )}
            </div>

            {/* View profile CTA when person focused */}
            {focus?.type === "person" && (
              <div className="mt-4">
                <Link to={`/profile/${focus.id}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-secondary border-secondary/30 hover:bg-secondary/10"
                  >
                    View Full Profile
                    <ArrowRight className="ml-2 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            )}

            {/* View article CTA when article focused */}
            {focus?.type === "article" && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-secondary border-secondary/30 hover:bg-secondary/10"
                >
                  Read Full Article
                  <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
