import { X, Newspaper, User, Euro, BadgeCheck, Building2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SearchResultsProps {
  query: string;
  onClose: () => void;
}

const mockNews = [
  {
    id: "1",
    title: "Cyprus Tech Sector Sees 45% Growth in Foreign Investment",
    category: "Technology",
    date: "2 hours ago",
    snippet: "Foreign direct investment in Cyprus's technology sector has surged by 45% compared to last year...",
  },
  {
    id: "2",
    title: "New Energy Legislation Passed by Parliament",
    category: "Energy",
    date: "1 day ago",
    snippet: "Parliament has approved landmark legislation aimed at accelerating the transition to renewable energy...",
  },
];

const mockPeople = [
  {
    id: "1",
    name: "Elena Konstantinou",
    title: "Director of Investment",
    company: "Cyprus Investment Promotion Agency",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&q=80",
    badges: ["CySEC"],
  },
  {
    id: "2",
    name: "Andreas Philippou",
    title: "Managing Partner",
    company: "PwC Cyprus",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80",
    badges: ["ICPAC"],
  },
];

const mockGrants = [
  {
    id: "1",
    name: "Tech Innovation Fund 2024",
    amount: "€50,000 - €150,000",
    deadline: "March 15, 2024",
    matchScore: 92,
  },
  {
    id: "2",
    name: "Green Transition Grant",
    amount: "€100,000 - €300,000",
    deadline: "April 30, 2024",
    matchScore: 78,
  },
];

export function SearchResults({ query, onClose }: SearchResultsProps) {
  if (!query) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="container mx-auto px-4 py-8 h-full overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-primary">Search Results</h2>
              <p className="text-muted-foreground">
                Showing results for "<span className="text-secondary font-medium">{query}</span>"
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Tabbed Results */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="news">News</TabsTrigger>
              <TabsTrigger value="people">People</TabsTrigger>
              <TabsTrigger value="grants">Grants</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              {/* News Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Newspaper className="h-4 w-4 text-secondary" />
                  <h3 className="font-semibold text-primary">News</h3>
                  <Badge variant="secondary" className="text-xs">{mockNews.length}</Badge>
                </div>
                <div className="space-y-3">
                  {mockNews.map((item) => (
                    <div key={item.id} className="bento-card p-4 hover:border-secondary/40 cursor-pointer">
                      <Badge variant="outline" className="mb-2">{item.category}</Badge>
                      <h4 className="font-medium text-primary mb-1">{item.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">{item.snippet}</p>
                      <p className="text-xs text-muted-foreground mt-2">{item.date}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* People Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-4 w-4 text-secondary" />
                  <h3 className="font-semibold text-primary">People</h3>
                  <Badge variant="secondary" className="text-xs">{mockPeople.length}</Badge>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {mockPeople.map((person) => (
                    <div key={person.id} className="bento-card p-4 hover:border-secondary/40 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <img
                          src={person.image}
                          alt={person.name}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-secondary/30"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-primary truncate">{person.name}</p>
                            {person.badges.map((badge) => (
                              <span key={badge} className="badge-cysec">
                                <BadgeCheck className="h-3 w-3" />
                                {badge}
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground">{person.title}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            {person.company}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grants Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Euro className="h-4 w-4 text-secondary" />
                  <h3 className="font-semibold text-primary">Grants</h3>
                  <Badge variant="secondary" className="text-xs">{mockGrants.length}</Badge>
                </div>
                <div className="space-y-3">
                  {mockGrants.map((grant) => (
                    <div key={grant.id} className="bento-card p-4 hover:border-secondary/40 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-primary">{grant.name}</h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Euro className="h-3 w-3" />
                              {grant.amount}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {grant.deadline}
                            </span>
                          </div>
                        </div>
                        <Badge className="bg-success text-success-foreground">{grant.matchScore}% Match</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="news" className="space-y-3">
              {mockNews.map((item) => (
                <div key={item.id} className="bento-card p-4 hover:border-secondary/40 cursor-pointer">
                  <Badge variant="outline" className="mb-2">{item.category}</Badge>
                  <h4 className="font-medium text-primary mb-1">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.snippet}</p>
                  <p className="text-xs text-muted-foreground mt-2">{item.date}</p>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="people" className="grid sm:grid-cols-2 gap-3">
              {mockPeople.map((person) => (
                <div key={person.id} className="bento-card p-4 hover:border-secondary/40 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <img
                      src={person.image}
                      alt={person.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-secondary/30"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-primary truncate">{person.name}</p>
                        {person.badges.map((badge) => (
                          <span key={badge} className="badge-cysec">
                            <BadgeCheck className="h-3 w-3" />
                            {badge}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">{person.title}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        {person.company}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="grants" className="space-y-3">
              {mockGrants.map((grant) => (
                <div key={grant.id} className="bento-card p-4 hover:border-secondary/40 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-primary">{grant.name}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Euro className="h-3 w-3" />
                          {grant.amount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {grant.deadline}
                        </span>
                      </div>
                    </div>
                    <Badge className="bg-success text-success-foreground">{grant.matchScore}% Match</Badge>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
