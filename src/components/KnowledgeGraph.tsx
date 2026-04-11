import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Network, User, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Person {
  id: string;
  name: string;
  slug: string;
  title: string | null;
  photo: string | null;
  is_whoiswho: boolean;
  articleCount: number;
}

export function KnowledgeGraph() {
  const [people, setPeople] = useState<Person[]>([]);

  useEffect(() => {
    // Get people who have article connections
    supabase
      .from("article_people")
      .select("person_id, people(id, name, slug, title, photo, is_whoiswho)")
      .then(({ data }) => {
        if (!data) return;
        const countMap: Record<string, { person: any; count: number }> = {};
        for (const row of data as any[]) {
          if (!row.people) continue;
          const pid = row.people.id;
          if (!countMap[pid]) {
            countMap[pid] = { person: row.people, count: 0 };
          }
          countMap[pid].count++;
        }
        const sorted = Object.values(countMap)
          .sort((a, b) => b.count - a.count)
          .slice(0, 8)
          .map((e) => ({ ...e.person, articleCount: e.count }));
        setPeople(sorted);
      });
  }, []);

  if (people.length === 0) return null;

  return (
    <section className="py-8 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
            <Network className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-primary">Knowledge Graph</h2>
            <p className="text-muted-foreground text-sm">People connected to the most stories</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {people.map((person) => (
            <Link
              key={person.id}
              to={person.is_whoiswho ? `/whoiswho/${person.slug}` : `/people/${person.slug}`}
              className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-secondary/40 hover:shadow-sm transition-all group"
            >
              <img
                src={person.photo || "/placeholder.svg"}
                alt={person.name}
                className="w-11 h-11 rounded-full object-cover ring-2 ring-border"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate group-hover:text-secondary transition-colors">
                  {person.name}
                </p>
                {person.title && (
                  <p className="text-xs text-muted-foreground truncate">{person.title}</p>
                )}
              </div>
              <Badge variant="outline" className="text-[10px] tabular-nums shrink-0">
                {person.articleCount}
              </Badge>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
