import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Building2, MapPin, Calendar, FileText, Lock, ChevronRight, Hash, Briefcase, Tag, Crown, Eye, EyeOff, ShieldCheck, Scale, BookOpen, ExternalLink, ShoppingCart, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useWatchlist } from "@/hooks/useWatchlist";
import { LoginModal } from "@/components/auth/LoginModal";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";

import { toast } from "sonner";

const CITY_LABELS: Record<string, string> = {
  nicosia: "Nicosia", limassol: "Limassol", larnaca: "Larnaca",
  paphos: "Paphos", famagusta: "Famagusta",
};

interface RegulatoryBadgeProps {
  show: boolean;
  label: string;
  detail?: string | null;
  status?: string | null;
  href: string;
  icon: React.ReactNode;
}

function RegulatoryBadge({ show, label, detail, status, href, icon }: RegulatoryBadgeProps) {
  if (!show) return null;
  const isActive = !status || status.toLowerCase() === "active";
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-start gap-3 p-3 border hover:border-secondary/50 transition-colors group ${
        isActive ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30" : "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30"
      }`}
    >
      <div className="w-8 h-8 rounded flex items-center justify-center bg-muted shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-foreground">{label}</span>
          <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        {detail && <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>}
        {status && (
          <Badge variant="outline" className={`mt-1 text-[10px] ${isActive ? "border-emerald-300 text-emerald-700" : "border-amber-300 text-amber-700"}`}>
            {status}
          </Badge>
        )}
      </div>
    </a>
  );
}

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
  const hasRegulatory = company.cysec_licensed || company.cbc_supervised || company.icpac_registered || company.bar_member || company.cifa_member;

  return (
    <div className="min-h-screen bg-background select-none" onCopy={(e) => e.preventDefault()} onContextMenu={(e) => e.preventDefault()}>
      <SEOHead
        title={`${company.company_name} — Cyprus Company Profile`}
        description={`${company.company_name}${company.city ? ` in ${company.city}` : ""} — ${company.activity_description || "Registered company in Cyprus"}. Registration, NACE code, and business details.`}
        path={`/directory/company/${company.slug || companyId}`}
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Directory", href: "/directory" },
          ...(citySlug && CITY_LABELS[citySlug] ? [{ name: CITY_LABELS[citySlug], href: `/directory/city/${citySlug}` }] : []),
          { name: company.company_name, href: `/directory/company/${company.slug || companyId}` },
        ]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: company.company_name,
          url: `https://businesshub.cy/directory/company/${company.slug || companyId}`,
          ...(company.address && { address: {
            "@type": "PostalAddress",
            streetAddress: company.address,
            ...(company.city && { addressLocality: company.city }),
            addressCountry: "CY",
          }}),
          ...(company.registration_no && { taxID: company.registration_no }),
          ...(company.activity_description && { description: company.activity_description }),
          ...(company.registration_date && { foundingDate: company.registration_date }),
        }}
      />
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

          {/* KYB Report Card */}
          <KYBReportCard company={company} />

          {/* Regulatory Status */}
          {hasRegulatory && (
            <div className="mb-8">
              <h2 className="font-serif font-bold text-foreground mb-4 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-secondary" />
                Regulatory Status
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <RegulatoryBadge
                  show={company.cysec_licensed}
                  label="CySEC Licensed"
                  detail={[company.cysec_license_type, company.cysec_license_number].filter(Boolean).join(" — ") || null}
                  status={company.cysec_status}
                  href="https://www.cysec.gov.cy/en-GB/entities/"
                  icon={<ShieldCheck className="h-4 w-4 text-emerald-600" />}
                />
                <RegulatoryBadge
                  show={company.cbc_supervised}
                  label="CBC Supervised"
                  detail="Central Bank of Cyprus"
                  status="Active"
                  href="https://www.centralbank.cy/en/supervision/supervised-entities"
                  icon={<Building2 className="h-4 w-4 text-emerald-600" />}
                />
                <RegulatoryBadge
                  show={company.icpac_registered}
                  label="ICPAC Registered"
                  detail="Institute of Certified Public Accountants"
                  status="Active"
                  href="https://www.icpac.org.cy"
                  icon={<BookOpen className="h-4 w-4 text-emerald-600" />}
                />
                <RegulatoryBadge
                  show={company.bar_member}
                  label="Bar Association Member"
                  detail="Cyprus Bar Association"
                  status="Active"
                  href="https://www.cybar.org.cy"
                  icon={<Scale className="h-4 w-4 text-emerald-600" />}
                />
                <RegulatoryBadge
                  show={company.cifa_member}
                  label="CIFA Member"
                  detail="Cyprus Investment Funds Association"
                  status="Active"
                  href="https://www.cifacyprus.org"
                  icon={<Briefcase className="h-4 w-4 text-emerald-600" />}
                />
              </div>
            </div>
          )}

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

function KYBReportCard({ company }: { company: any }) {
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();

  const reportFeatures = [
    "Directors & shareholders on record",
    "Share capital & ownership structure",
    "Registered charges & mortgages",
    "CySEC / CBC / ICPAC regulatory status",
    "Related intelligence articles",
    "Auto-generated risk summary",
    "PDF download — instant delivery",
  ];

  return (
    <>
      <div className="border border-secondary/30 bg-secondary/5 p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-secondary" />
              <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-secondary">KYB Report</span>
            </div>
            <h3 className="font-serif font-bold text-foreground text-lg mb-1">Know Your Business Report</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Full company intelligence report including directors, shareholders, charges, and regulatory status. PDF delivered instantly.
            </p>
            <ul className="space-y-1.5">
              {reportFeatures.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-secondary shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <p className="text-[10px] text-muted-foreground mt-3 flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Secure payment via Stripe · Instant PDF delivery · No subscription
            </p>
          </div>
          <div className="text-center md:text-right flex flex-col items-center md:items-end gap-2">
            <p className="text-3xl font-bold text-foreground">€45</p>
            <p className="text-xs text-muted-foreground">one-time</p>
            <Button
              onClick={() => setShowModal(true)}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-none gap-2 text-xs font-semibold uppercase tracking-wider w-full md:w-auto"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              Buy Report
            </Button>
          </div>
        </div>
      </div>

      {showModal && (
        <KYBPurchaseModal company={company} user={user} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}

function KYBPurchaseModal({ company, user, onClose }: { company: any; user: any; onClose: () => void }) {
  const [email, setEmail] = useState(user?.email || "");
  const [name, setName] = useState("");
  const [buyerCompany, setBuyerCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCheckout = async () => {
    if (!email.trim()) { setError("Email is required"); return; }
    setLoading(true);
    setError("");

    try {
      const { data: report, error: dbErr } = await supabase
        .from("kyb_reports")
        .insert({
          company_id: company.id,
          company_name: company.company_name,
          company_reg_number: company.registration_no,
          buyer_email: email.trim().toLowerCase(),
          buyer_name: name.trim() || null,
          buyer_company: buyerCompany.trim() || null,
          status: "pending",
          user_id: user?.id || null,
        })
        .select()
        .single();

      if (dbErr) throw dbErr;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-kyb-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            report_id: report.id,
            company_name: company.company_name,
            buyer_email: email.trim().toLowerCase(),
          }),
        }
      );

      const { url, error: fnErr } = await res.json();
      if (fnErr) throw new Error(fnErr);
      window.location.href = url;
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-card border border-border w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif font-bold text-lg text-foreground">Order KYB Report</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">✕</button>
        </div>

        <div className="bg-muted/40 p-3 mb-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Report for:</p>
          <p className="font-semibold text-foreground">{company.company_name}</p>
          {company.registration_no && (
            <p className="text-xs text-muted-foreground">Reg. {company.registration_no}</p>
          )}
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <label className="text-xs font-medium text-foreground">Email for delivery *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full mt-1 px-3 py-2 border border-border bg-background text-foreground text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground">Your name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="w-full mt-1 px-3 py-2 border border-border bg-background text-foreground text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground">Your company</label>
            <input
              type="text"
              value={buyerCompany}
              onChange={(e) => setBuyerCompany(e.target.value)}
              placeholder="Company name (optional)"
              className="w-full mt-1 px-3 py-2 border border-border bg-background text-foreground text-sm"
            />
          </div>
        </div>

        {error && <p className="text-sm text-destructive mb-3">{error}</p>}

        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-2xl font-bold text-foreground">€45</span>
            <span className="text-xs text-muted-foreground ml-1">+ VAT if applicable</span>
          </div>
          <Button
            onClick={handleCheckout}
            disabled={loading}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-none text-xs font-semibold uppercase tracking-wider"
          >
            {loading ? "Redirecting..." : "Pay with Stripe →"}
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground text-center">
          Secure payment via Stripe. PDF report delivered to your email instantly after payment.
        </p>
      </div>
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
