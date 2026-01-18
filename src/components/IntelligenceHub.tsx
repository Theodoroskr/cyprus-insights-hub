import { Clock, TrendingUp, BadgeCheck, Building2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Person {
  id: string;
  name: string;
  title: string;
  company: string;
  image: string;
  badges: string[];
  trending: boolean;
}

const featuredArticle = {
  id: "1",
  title: "Cyprus Introduces New Corporate Tax Incentives for Tech Startups",
  summary: "The Ministry of Finance announces a comprehensive package of tax incentives aimed at attracting tech companies to establish their European headquarters in Cyprus.",
  image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
  category: "Policy",
  date: "2 hours ago",
  author: "Maria Constantinou",
};

const trendingPeople: Person[] = [
  {
    id: "1",
    name: "Christos Patsalides",
    title: "Governor",
    company: "Central Bank of Cyprus",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&q=80",
    badges: ["CBA"],
    trending: true,
  },
  {
    id: "2",
    name: "George Campanellas",
    title: "Minister of Energy",
    company: "Government of Cyprus",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80",
    badges: [],
    trending: true,
  },
  {
    id: "3",
    name: "Elena Papadopoulou",
    title: "CEO",
    company: "CySEC",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&q=80",
    badges: ["CySEC"],
    trending: false,
  },
  {
    id: "4",
    name: "Andreas Michaelides",
    title: "Partner",
    company: "KPMG Cyprus",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80",
    badges: ["ICPAC"],
    trending: false,
  },
];

export function IntelligenceHub() {
  return (
    <section id="news" className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-primary">Intelligence Hub</h2>
            <p className="text-muted-foreground text-sm">Latest business intelligence from Cyprus</p>
          </div>
          <Button variant="outline" size="sm" className="hidden sm:flex">
            View All News
            <ExternalLink className="ml-2 h-3 w-3" />
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Featured Article */}
          <div className="lg:col-span-2">
            <article className="bento-card-highlight group overflow-hidden p-0">
              <div className="relative h-64 overflow-hidden">
                <img
                  src={featuredArticle.image}
                  alt={featuredArticle.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/50 to-transparent" />
                <div className="absolute top-4 left-4">
                  <Badge className="bg-secondary text-secondary-foreground">{featuredArticle.category}</Badge>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
                    {featuredArticle.title}
                  </h3>
                  <p className="text-white/80 text-sm mb-4 line-clamp-2">
                    {featuredArticle.summary}
                  </p>
                  <div className="flex items-center gap-4 text-white/70 text-xs">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {featuredArticle.date}
                    </span>
                    <span>By {featuredArticle.author}</span>
                  </div>
                </div>
              </div>
            </article>
          </div>

          {/* Trending People Sidebar */}
          <div className="bento-card">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-secondary" />
              <h3 className="font-semibold text-primary">Trending People</h3>
            </div>
            <div className="space-y-4">
              {trendingPeople.map((person) => (
                <div
                  key={person.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer group"
                >
                  <img
                    src={person.image}
                    alt={person.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-border group-hover:ring-secondary transition-all"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-primary truncate">{person.name}</p>
                      {person.trending && (
                        <span className="flex-shrink-0 w-2 h-2 rounded-full bg-secondary animate-pulse-gold" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{person.title}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Building2 className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground truncate">{person.company}</span>
                    </div>
                    {person.badges.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {person.badges.map((badge) => (
                          <span key={badge} className="badge-cysec">
                            <BadgeCheck className="h-3 w-3" />
                            {badge}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-4 text-secondary hover:text-secondary hover:bg-secondary/10">
              View All Directory
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
