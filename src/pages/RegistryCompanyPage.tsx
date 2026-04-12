import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Building2, MapPin, Calendar, FileText, Lock, ChevronRight, Hash, Briefcase, Tag, Crown, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useWatchlist } from "@/hooks/useWatchlist";
import { LoginModal } from "@/components/auth/LoginModal";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";

const CITY_LABELS: Record<string, string> = {
  nicosia: "Nicosia", limassol: "Limassol", larnaca: "Larnaca",
  paphos: "Paphos", famagusta: "Famagusta",
};

export default function RegistryCompanyPage() {
  const { slug, companyId } = useParams<{ slug?: string; companyId?: string }>();
  const { user, profile } = useAuth();
  const { isWatching, toggleWatch } = useWatchlist();
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  const isPremium = profile?.tier === "premium";

  useEffect(() => {
    const identifier = slug || companyId;
    if (!identifier) return;
    // Try slug first, fall back to id for legacy UUID URLs
    const col = slug ? "slug" : "id";
    supabase
      .from("directory_companies")
      .select("*")
      .eq(col, identifier)
      .single()
      .then(({ data }) => {
        setCompany(data);
        setLoading(false);
      });
  }, [slug, companyId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavigation onSearch={() => {}} />
        <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading...</div>
        <Footer />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavigation onSearch={() => {}} />
        <div className="container mx-auto px-4 py-20 text-center">
          <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
          <h1 className="text-2xl font-serif font-bold text-foreground mb-2">Company not found</h1>
          <Link to="/directory"><Button variant="outline">Back to Directory</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  const isActive = company.organisation_status === "Active";
  const citySlug = company.city_slug;

  return (
    <div className="min-h-screen bg-background select-none" onCopy={(e) => e.preventDefault()} onContextMenu={(e) => e.preventDefault()}>
      <SEOHead
        title={`${company.company_name} — Cyprus Company Profile`}
        description={`${company.company_name}${company.city ? ` in ${company.city}` : ""} — ${company.activity_description || "Registered company in Cyprus"}. Registration, NACE code, and business details.`}
        path={`/directory/company/${company.slug || companyId}`}
      />
      {/* JSON-LD Structured Data */}
      <Helmet>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: company.company_name,
          ...(company.address && { address: {
            "@type": "PostalAddress",
            streetAddress: company.address,
            ...(company.city && { addressLocality: company.city }),
            addressCountry: "CY",
          }}),
          ...(company.registration_no && { taxID: company.registration_no }),
          ...(company.activity_description && { description: company.activity_description }),
          ...(company.registration_date && { foundingDate: company.registration_date }),
        })}</script>
      </Helmet>
      <TopNavigation onSearch={() => {}} />

      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/directory" className="hover:text-secondary transition-colors">Directory</Link>
            <ChevronRight className="h-3 w-3" />
            {citySlug && CITY_LABELS[citySlug] && (
              <>
                <Link to={`/directory/city/${citySlug}`} className="hover:text-secondary transition-colors">
                  {CITY_LABELS[citySlug]}
                </Link>
                <ChevronRight className="h-3 w-3" />
              </>
            )}
            <span className="text-foreground font-medium truncate max-w-xs">{company.company_name}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-5 mb-8">
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">{company.company_name}</h1>
                {user && company?.id && (
                  <Button
                    variant={isWatching(company.id) ? "default" : "outline"}
                    size="sm"
                    className="gap-1.5 flex-shrink-0"
                    onClick={async () => {
                      const added = await toggleWatch(company.id, company.company_name, "directory");
                      toast.success(added ? `Monitoring ${company.company_name}` : `Removed from watchlist`);
                    }}
                  >
                    {isWatching(company.id) ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    {isWatching(company.id) ? "Watching" : "Watch"}
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {isActive ? (
                  <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800 border-red-200">{company.organisation_status || "Dissolved"}</Badge>
                )}
                {company.organisation_type && <Badge variant="outline">{company.organisation_type}</Badge>}
                {company.organisation_sub_type && <Badge variant="secondary">{company.organisation_sub_type}</Badge>}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <InfoCard icon={MapPin} label="City" value={company.city || "—"} />
            <InfoCard icon={Briefcase} label="Activity" value={company.activity_description || "—"} />
            <InfoCard icon={Tag} label="Organisation Type" value={company.organisation_type || "—"} />
            {company.nace_code && <InfoCard icon={Hash} label="NACE Code" value={company.nace_code} />}
          </div>

          <div className="border border-border rounded-xl overflow-hidden">
            <div className="bg-muted/40 px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-serif font-bold text-foreground flex items-center gap-2">
                <FileText className="h-5 w-5 text-secondary" />
                Full Company Details
              </h2>
              {!isPremium && <Badge className="bg-secondary/10 text-secondary border-secondary/20">Premium</Badge>}
            </div>

            {isPremium ? (
              <div className="p-6 grid md:grid-cols-2 gap-6">
                <InfoCard icon={Hash} label="Registration No." value={company.registration_no || "—"} />
                <InfoCard icon={Calendar} label="Registration Date" value={company.registration_date ? new Date(company.registration_date).toLocaleDateString("en-GB") : "—"} />
                <div className="md:col-span-2">
                  <InfoCard icon={MapPin} label="Full Address" value={company.address || "—"} />
                </div>
              </div>
            ) : (
              <div className="relative min-h-[320px]">
                <div className="p-6 grid md:grid-cols-2 gap-6 blur-[6px] opacity-30 pointer-events-none select-none">
                  <InfoCard icon={Hash} label="Registration No." value="HE ••••••" />
                  <InfoCard icon={Calendar} label="Registration Date" value="••/••/••••" />
                  <div className="md:col-span-2">
                    <InfoCard icon={MapPin} label="Full Address" value="•••••••••••••••••••••" />
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center max-w-sm px-4">
                    <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                      <Crown className="h-7 w-7 text-secondary" />
                    </div>
                    <Badge className="bg-secondary/10 text-secondary border-secondary/20 mb-3">Premium</Badge>
                    <p className="font-serif font-bold text-foreground text-lg mb-1">Unlock Full Company Record</p>
                    <p className="text-sm text-muted-foreground mb-5">
                      Registration numbers, dates, full addresses, and corporate filings.
                    </p>
                    {!user ? (
                      <div className="flex flex-col gap-2 items-center">
                        <Button onClick={() => setShowLogin(true)} className="rounded-full px-8 bg-secondary text-secondary-foreground hover:bg-secondary/90">
                          Register Free to Start
                        </Button>
                        <span className="text-xs text-muted-foreground">Then upgrade for €29/month</span>
                      </div>
                    ) : (
                      <Button className="rounded-full px-8 bg-secondary text-secondary-foreground hover:bg-secondary/90">
                        Upgrade to Premium — €29/mo
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} defaultTab="register" />
      <Footer />
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
        <p className="text-foreground mt-0.5">{value}</p>
      </div>
    </div>
  );
}
