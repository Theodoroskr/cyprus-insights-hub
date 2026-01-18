import { Link2, ArrowRight, Newspaper, User, BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Connection {
  news: {
    title: string;
    category: string;
    date: string;
  };
  person: {
    name: string;
    title: string;
    company: string;
    image: string;
    badge?: string;
  };
  context: string;
}

const connections: Connection[] = [
  {
    news: {
      title: "New Energy Law Amendments Approved by Parliament",
      category: "Energy",
      date: "Today",
    },
    person: {
      name: "George Papanastasiou",
      title: "Minister of Energy",
      company: "Ministry of Energy, Commerce & Industry",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80",
    },
    context: "Led the parliamentary approval of the landmark energy legislation",
  },
  {
    news: {
      title: "Cyprus Banks Report Record Q3 Profits",
      category: "Finance",
      date: "Yesterday",
    },
    person: {
      name: "Panicos Nicolaou",
      title: "CEO",
      company: "Bank of Cyprus",
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&q=80",
      badge: "CBA",
    },
    context: "Announced 23% YoY profit increase in quarterly earnings",
  },
  {
    news: {
      title: "EU Approves €150M Infrastructure Grant for Cyprus",
      category: "EU Funding",
      date: "3 days ago",
    },
    person: {
      name: "Marina Hadjimanolis",
      title: "Deputy Minister",
      company: "EU Affairs",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&q=80",
    },
    context: "Successfully negotiated the largest infrastructure grant in Cyprus history",
  },
];

export function VerticalConnection() {
  return (
    <section className="py-8 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
            <Link2 className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-primary">Vertical Connection</h2>
            <p className="text-muted-foreground text-sm">News linked to key decision makers</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connections.map((connection, index) => (
            <div
              key={index}
              className="bento-card group hover:border-secondary/40 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* News Part */}
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Newspaper className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <Badge variant="secondary" className="mb-2 text-xs">
                    {connection.news.category}
                  </Badge>
                  <h4 className="font-medium text-sm text-primary leading-tight line-clamp-2">
                    {connection.news.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">{connection.news.date}</p>
                </div>
              </div>

              {/* Connection Arrow */}
              <div className="flex items-center justify-center py-2">
                <div className="flex-1 h-px bg-border" />
                <div className="px-3">
                  <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center group-hover:bg-secondary/30 transition-colors">
                    <ArrowRight className="h-4 w-4 text-secondary" />
                  </div>
                </div>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Person Part */}
              <div className="flex items-center gap-3 mt-4">
                <div className="relative">
                  <img
                    src={connection.person.image}
                    alt={connection.person.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-secondary/30"
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-secondary flex items-center justify-center">
                    <User className="h-3 w-3 text-secondary-foreground" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-primary">{connection.person.name}</p>
                    {connection.person.badge && (
                      <span className="badge-cysec">
                        <BadgeCheck className="h-3 w-3" />
                        {connection.person.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{connection.person.title}</p>
                  <p className="text-xs text-muted-foreground/70">{connection.person.company}</p>
                </div>
              </div>

              {/* Context */}
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground italic">"{connection.context}"</p>
              </div>

              {/* Hover Action */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-4 opacity-0 group-hover:opacity-100 transition-opacity text-secondary hover:text-secondary hover:bg-secondary/10"
              >
                Explore Connection
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
