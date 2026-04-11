import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { ContentGate } from "@/components/auth/ContentGate";
import { FileText, Clock, ArrowRight, BookOpen, Download, TrendingUp, Library } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const tabs = ["All", "Guides", "Glossaries", "Reports"] as const;
type Tab = typeof tabs[number];

const typeMap: Record<string, { label: Tab; icon: typeof FileText }> = {
  guide: { label: "Guides", icon: BookOpen },
  glossary: { label: "Glossaries", icon: Library },
  report: { label: "Reports", icon: Download },
};

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("All");
  const handleSearch = (query: string) => console.log("Search:", query);

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ["resources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .eq("is_published", true)
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered =
    activeTab === "All"
      ? resources
      : resources.filter((r) => typeMap[r.resource_type]?.label === activeTab);

  const featured = filtered.find((r) => r.featured) || filtered[0];
  const rest = filtered.filter((r) => r.id !== featured?.id);

  const categoryLabel = (type: string, category: string) =>
    category.charAt(0).toUpperCase() + category.slice(1);

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation onSearch={handleSearch} />

      {/* Masthead */}
      <section className="border-b border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="h-[3px] bg-foreground" />
          <div className="py-8 text-center">
            <span className="section-label text-secondary mb-2 block">BusinessHub.cy</span>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
              Resource Hub
            </h1>
            <p className="article-body text-base mt-2 max-w-xl mx-auto">
              Guides, glossaries &amp; intelligence reports for operating in Cyprus and the EU.
            </p>
          </div>
        </div>
      </section>

      {/* Filter tabs */}
      <div className="border-b border-border bg-card sticky top-14 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-0 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] whitespace-nowrap transition-colors border-b-2
                  ${activeTab === tab
                    ? "border-secondary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-72 w-full" />
            <div className="grid md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40" />)}
            </div>
          </div>
        ) : featured ? (
          <>
            {/* Featured resource */}
            <div className="grid lg:grid-cols-12 gap-0 mb-8">
              <div className="lg:col-span-7 lg:pr-6 lg:border-r border-border">
                <article className="group cursor-pointer">
                  {featured.cover_image && (
                    <div className="overflow-hidden mb-4">
                      <img
                        src={featured.cover_image}
                        alt={featured.title}
                        className="w-full h-56 md:h-72 object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                      />
                    </div>
                  )}
                  <Badge className="bg-foreground text-background rounded-none text-[10px] uppercase tracking-wider font-sans mb-3">
                    {categoryLabel(featured.resource_type, featured.category)}
                  </Badge>
                  <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground leading-tight mb-3 group-hover:text-secondary transition-colors">
                    {featured.title}
                  </h2>
                  <p className="article-body text-base mb-4">{featured.description}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      {(() => { const Icon = typeMap[featured.resource_type]?.icon || FileText; return <Icon className="h-3 w-3" />; })()}
                      {featured.resource_type}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span>{new Date(featured.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                </article>
              </div>

              {/* Sidebar highlights */}
              <div className="lg:col-span-5 lg:pl-6 pt-6 lg:pt-0">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-4 w-4 text-secondary" />
                  <span className="section-label">Featured</span>
                </div>
                <ContentGate message="Register free to access all guides and resources">
                  <div className="divide-y divide-border">
                    {rest.slice(0, 4).map((r, i) => {
                      const TypeIcon = typeMap[r.resource_type]?.icon || FileText;
                      return (
                        <article key={r.id} className="py-4 first:pt-0 group cursor-pointer">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl font-serif font-bold text-muted-foreground/30 leading-none">{String(i + 1).padStart(2, "0")}</span>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-serif font-bold text-sm text-foreground leading-snug mb-1 group-hover:text-secondary transition-colors">
                                {r.title}
                              </h4>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <TypeIcon className="h-3 w-3" />
                                <span>{r.resource_type}</span>
                                <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/50" />
                                <span>{categoryLabel(r.resource_type, r.category)}</span>
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </ContentGate>
              </div>
            </div>

            {/* All resources grid */}
            <ContentGate message="Register free to browse the full Resource Hub">
              <div className="border-t border-foreground pt-6">
                <div className="flex items-center gap-3 mb-6">
                  <span className="section-label">All Resources</span>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">{filtered.length} items</span>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-0">
                  {rest.map((r, i) => {
                    const TypeIcon = typeMap[r.resource_type]?.icon || FileText;
                    return (
                      <article
                        key={r.id}
                        className={`py-5 px-4 group cursor-pointer hover:bg-muted/30 transition-colors
                          ${i % 3 !== 2 ? "lg:border-r border-border" : ""}
                          ${i >= 3 ? "border-t border-border" : ""}
                          ${i % 2 !== 0 && i < 3 ? "md:border-r" : ""}
                        `}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="rounded-none text-[10px] uppercase tracking-wider font-sans border-muted-foreground/30">
                            {categoryLabel(r.resource_type, r.category)}
                          </Badge>
                          <TypeIcon className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <h3 className="font-serif font-bold text-foreground leading-snug mb-2 group-hover:text-secondary transition-colors">
                          {r.title}
                        </h3>
                        <p className="article-body text-sm line-clamp-2 mb-3">{r.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                            {r.tags && r.tags.length > 0 && (
                              <>
                                <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/50" />
                                <span>{r.tags[0]}</span>
                              </>
                            )}
                          </div>
                          <ArrowRight className="h-3 w-3 text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </ContentGate>
          </>
        ) : (
          <p className="text-center text-muted-foreground py-12">No resources available yet.</p>
        )}
      </main>

      <section className="py-6 border-t border-border">
        <div className="container mx-auto px-4">
          <p className="text-xs text-muted-foreground text-center italic font-source-serif">
            Content is informational only and does not replace professional advisory services.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
