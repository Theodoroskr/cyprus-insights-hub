import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Building2, MapPin, Globe, Users, ExternalLink, Lock, Shield, FileText, BarChart3, UserCheck, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function CompanyProfilePage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { isWatching, toggleWatch } = useWatchlist();
  const [company, setCompany] = useState<any>(null);
  const [people, setPeople] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [report, setReport] = useState<any>(null);
  const [reportModal, setReportModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    supabase.from("companies").select("*, industry:industries(name, slug), location:locations(name, slug)").eq("slug", slug).single()
      .then(async ({ data: comp }) => {
        if (!comp) { setLoading(false); return; }
        setCompany(comp);

        const [relRes, artRes, repRes] = await Promise.all([
          supabase.from("relationships").select("*, person:people(*)").eq("company_id", comp.id),
          supabase.from("article_companies").select("article:directory_articles(*)").eq("company_id", comp.id),
          supabase.from("reports").select("*").eq("company_id", comp.id).limit(1),
        ]);
        if (relRes.data) setPeople(relRes.data);
        if (artRes.data) setArticles(artRes.data.map((r: any) => r.article).filter(Boolean));
        if (repRes.data?.[0]) setReport(repRes.data[0]);
        setLoading(false);
      });
  }, [slug]);

  if (loading) return <div className="min-h-screen bg-background"><TopNavigation onSearch={() => {}} /><div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading...</div></div>;
  if (!company) return <div className="min-h-screen bg-background"><TopNavigation onSearch={() => {}} /><div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Company not found</div></div>;

  const newsArticles = articles.filter(a => a.article_type === 'news');
  const interviewArticles = articles.filter(a => a.article_type === 'interview' || a.article_type === 'insight');

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation onSearch={() => {}} />

      {/* Company Header */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <img src={company.logo || "/placeholder.svg"} alt={company.name} className="w-20 h-20 rounded-xl object-cover border border-border" />
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-3xl font-serif font-bold text-foreground">{company.name}</h1>
                {user && (
                  <Button
                    variant={isWatching(company.id) ? "default" : "outline"}
                    size="sm"
                    className="gap-1.5 flex-shrink-0"
                    onClick={async () => {
                      const added = await toggleWatch(company.id, company.name, "editorial", company.slug);
                      toast.success(added ? `Monitoring ${company.name}` : `Removed ${company.name} from watchlist`);
                    }}
                  >
                    {isWatching(company.id) ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    {isWatching(company.id) ? "Watching" : "Watch"}
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                {company.industry && <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{(company as any).industry.name}</span>}
                {company.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{(company as any).location.name}</span>}
                {company.size && <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{company.size} employees</span>}
              </div>
              <p className="text-muted-foreground mt-3 max-w-3xl">{company.description}</p>
              {company.website && (
                <a href={company.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-secondary hover:underline mt-2">
                  <Globe className="h-3.5 w-3.5" /> {company.website} <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <main className="flex-1">
            <Tabs defaultValue="overview">
              <TabsList className="mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="people">People ({people.length})</TabsTrigger>
                <TabsTrigger value="news">News ({newsArticles.length})</TabsTrigger>
                <TabsTrigger value="interviews">Interviews ({interviewArticles.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="prose max-w-none">
                  <h3 className="font-serif text-xl font-bold text-foreground mb-4">About {company.name}</h3>
                  <p className="text-muted-foreground leading-relaxed">{company.description}</p>
                </div>
                {company.tags?.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-foreground mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {company.tags.map((t: string) => <Badge key={t} variant="outline">{t}</Badge>)}
                    </div>
                  </div>
                )}
                {/* Locked Insights */}
                <div className="mt-8 relative">
                  <div className="border border-border rounded-lg p-6 bg-muted/30 backdrop-blur-sm">
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center z-10">
                      <Lock className="h-8 w-8 text-muted-foreground mb-3" />
                      <p className="font-semibold text-foreground">Premium Intelligence</p>
                      <p className="text-sm text-muted-foreground mb-4">Unlock full business insights for {company.name}</p>
                      <Button onClick={() => setReportModal(true)} className="bg-secondary text-secondary-foreground hover:bg-secondary/90">Get Full Report</Button>
                    </div>
                    <div className="opacity-30">
                      <h4 className="font-semibold mb-2">Financial Overview</h4>
                      <p>Revenue: €XXX million | Net Profit: €XX million | Growth: XX%</p>
                      <h4 className="font-semibold mt-4 mb-2">Risk Assessment</h4>
                      <p>Credit Score: A+ | Risk Level: Low</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="people">
                <div className="space-y-3">
                  {people.map((rel: any) => (
                    <Link key={rel.id} to={`/people/${rel.person?.slug}`} className="flex items-center gap-4 p-4 border border-border rounded-lg hover:shadow-md transition-all group bg-card">
                      <img src={rel.person?.photo || "/placeholder.svg"} alt={rel.person?.name} className="w-12 h-12 rounded-full object-cover border border-border" />
                      <div>
                        <p className="font-semibold text-foreground group-hover:text-secondary transition-colors">{rel.person?.name}</p>
                        <p className="text-sm text-muted-foreground">{rel.role}</p>
                      </div>
                      {rel.is_current && <Badge className="ml-auto bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Current</Badge>}
                    </Link>
                  ))}
                  {people.length === 0 && <p className="text-muted-foreground text-center py-8">No people linked to this company yet.</p>}
                </div>
              </TabsContent>

              <TabsContent value="news">
                <div className="space-y-4">
                  {newsArticles.map((a) => (
                    <Link key={a.id} to={`/news/${a.slug}`} className="flex gap-4 p-4 border border-border rounded-lg hover:shadow-md transition-all group bg-card">
                      {a.cover_image && <img src={a.cover_image} alt={a.title} className="w-24 h-20 rounded object-cover flex-shrink-0" />}
                      <div>
                        <h4 className="font-serif font-bold text-foreground group-hover:text-secondary transition-colors">{a.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{a.excerpt}</p>
                      </div>
                    </Link>
                  ))}
                  {newsArticles.length === 0 && <p className="text-muted-foreground text-center py-8">No news articles linked yet.</p>}
                </div>
              </TabsContent>

              <TabsContent value="interviews">
                <div className="space-y-4">
                  {interviewArticles.map((a) => (
                    <Link key={a.id} to={`/interviews/${a.slug}`} className="flex gap-4 p-4 border border-border rounded-lg hover:shadow-md transition-all group bg-card">
                      {a.cover_image && <img src={a.cover_image} alt={a.title} className="w-24 h-20 rounded object-cover flex-shrink-0" />}
                      <div>
                        <Badge className="mb-1" variant="outline">{a.article_type}</Badge>
                        <h4 className="font-serif font-bold text-foreground group-hover:text-secondary transition-colors">{a.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{a.excerpt}</p>
                      </div>
                    </Link>
                  ))}
                  {interviewArticles.length === 0 && <p className="text-muted-foreground text-center py-8">No interviews or insights linked yet.</p>}
                </div>
              </TabsContent>
            </Tabs>
          </main>

          {/* Sticky Report CTA Sidebar */}
          <aside className="lg:w-80 flex-shrink-0">
            <div className="sticky top-4 border border-border rounded-lg bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-secondary" />
                <h3 className="font-semibold text-foreground">Unlock Full Company Report</h3>
              </div>
              <ul className="space-y-3 mb-6 text-sm">
                <li className="flex items-center gap-2 text-muted-foreground"><FileText className="h-4 w-4 text-secondary" /> Credit Report</li>
                <li className="flex items-center gap-2 text-muted-foreground"><BarChart3 className="h-4 w-4 text-secondary" /> Financials</li>
                <li className="flex items-center gap-2 text-muted-foreground"><UserCheck className="h-4 w-4 text-secondary" /> Directors & Shareholders</li>
                <li className="flex items-center gap-2 text-muted-foreground"><AlertTriangle className="h-4 w-4 text-secondary" /> Risk Analysis</li>
              </ul>
              <Button onClick={() => setReportModal(true)} className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                Get Full Report
              </Button>
              {report && <p className="text-center text-lg font-bold text-foreground mt-3">€{report.price}</p>}
              <p className="text-center text-xs text-muted-foreground mt-2">Powered by Infocredit</p>
            </div>
          </aside>
        </div>
      </div>

      {/* Report Modal */}
      <Dialog open={reportModal} onOpenChange={setReportModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Full Company Report: {company.name}</DialogTitle>
            <DialogDescription>Comprehensive business intelligence powered by Infocredit</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><FileText className="h-4 w-4 text-secondary" /> Credit Report & Rating</li>
              <li className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-secondary" /> Full Financial Statements</li>
              <li className="flex items-center gap-2"><UserCheck className="h-4 w-4 text-secondary" /> Directors & Shareholders</li>
              <li className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-secondary" /> Risk Analysis & Score</li>
            </ul>
            {report && <p className="text-center text-2xl font-bold text-foreground">€{report.price}</p>}
            <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90" onClick={() => { setReportModal(false); }}>
              Proceed to Payment
            </Button>
            <p className="text-center text-xs text-muted-foreground">Secure payment • Instant delivery • Powered by Infocredit</p>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
