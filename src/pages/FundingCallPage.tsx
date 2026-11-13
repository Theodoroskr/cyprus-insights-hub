import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { FundingCard, type CallCardData } from "@/components/funding/FundingCard";
import { FundingGate } from "@/components/funding/FundingGate";
import { APPLICANTS, GEOGRAPHY, INSTRUMENTS, SECTORS, VIEWS, formatDeadline, formatEur, lbl, type Lang } from "@/lib/funding";

export default function FundingCallPage() {
  const { slug = "" } = useParams();
  const [sp] = useSearchParams();
  const lang: Lang = sp.get("lang") === "el" ? "el" : "en";
  const t = (en: string, el: string) => (lang === "el" ? el : en);
  const { user, loading } = useAuth();

  const full = useQuery({
    queryKey: ["funding-call", slug, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("funding_calls").select("*, funding_call_sources(url,kind,language,title)").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  // Signed out: only the public preview fields, and only if this call is one of the three previews.
  const preview = useQuery({
    queryKey: ["funding-preview"],
    enabled: !loading && !user,
    queryFn: async () => (await supabase.rpc("get_funding_preview")).data ?? [],
  });
  const p = (preview.data as CallCardData[] | undefined)?.find((c) => c.slug === slug);
  const c = full.data;

  const fact = (label: string, value: React.ReactNode) =>
    value ? (<div className="py-3 border-b border-border grid sm:grid-cols-[220px_1fr] gap-1"><dt className="text-sm font-semibold text-muted-foreground">{label}</dt><dd className="text-sm text-foreground">{value}</dd></div>) : null;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={c?.title_en ?? p?.title_en ?? t("Funding opportunity", "Ευκαιρία χρηματοδότησης")} description={c?.summary_en ?? p?.eligibility_summary ?? "Funding opportunity open to applicants in Cyprus."} path={`/funding/${slug}`} />
      {/* Full call pages are for members; only the /funding landing page is indexed. */}
      <Helmet><meta name="robots" content="noindex, follow" /></Helmet>
      <TopNavigation onSearch={() => {}} />
      <main className="max-w-[900px] mx-auto px-4 md:px-6 py-8">
        <Link to={`/funding${lang === "el" ? "?lang=el" : ""}`} className="inline-flex items-center gap-1 text-sm text-secondary hover:underline mb-5"><ArrowLeft className="h-4 w-4" />{t("All funding opportunities", "Όλες οι ευκαιρίες")}</Link>
        {!user ? (
          <div className="space-y-6">
            {p && <FundingCard c={p} lang={lang} preview />}
            <FundingGate lang={lang} />
          </div>
        ) : full.isLoading ? (
          <div className="h-64 rounded-lg bg-muted animate-pulse" />
        ) : !c ? (
          <p className="text-muted-foreground">{t("This opportunity is not in the verified catalogue.", "Η ευκαιρία δεν περιλαμβάνεται στον επιβεβαιωμένο κατάλογο.")}</p>
        ) : (
          <article>
            <div className="flex flex-wrap gap-1.5 mb-3">
              <Badge className="bg-secondary text-secondary-foreground">{lbl(INSTRUMENTS, c.instrument_type, lang)}</Badge>
              <Badge variant="outline">{VIEWS[c.call_state as keyof typeof VIEWS]?.[lang]}</Badge>
              {c.sectors.map((s: string) => <Badge key={s} variant="outline">{lbl(SECTORS, s, lang)}</Badge>)}
            </div>
            <h1 className="font-serif text-3xl font-bold text-foreground leading-tight">{lang === "el" && c.title_el ? c.title_el : c.title_en}</h1>
            {lang === "en" && c.title_el && <p className="text-muted-foreground mt-1">{c.title_el}</p>}
            <p className="text-muted-foreground mt-2">{c.issuer}{c.programme ? ` · ${c.programme}` : ""}</p>
            {(lang === "el" ? c.summary_el ?? c.summary_en : c.summary_en) && <p className="text-lg text-foreground/90 mt-5">{lang === "el" ? c.summary_el ?? c.summary_en : c.summary_en}</p>}
            <a href={c.application_url || c.official_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-6 rounded-md bg-primary text-primary-foreground px-5 py-2.5 font-semibold">
              {t("Go to the official application", "Μετάβαση στην επίσημη αίτηση")} <ExternalLink className="h-4 w-4" />
            </a>
            <dl className="mt-8 border-t border-border">
              {fact(t("Deadline", "Προθεσμία"), formatDeadline(c.deadline_date, c.deadline_time, lang))}
              {fact(t("Opens", "Άνοιγμα"), c.opening_date ? formatDeadline(c.opening_date, null, lang) : null)}
              {fact(t("Call reference", "Κωδικός πρόσκλησης"), c.call_reference ? `${c.call_reference}${c.round ? ` · ${t("round", "γύρος")} ${c.round}` : ""}` : null)}
              {fact(t("Who can apply", "Ποιοι μπορούν να υποβάλουν"), c.eligibility_summary)}
              {fact(t("Applicant types", "Κατηγορίες αιτητών"), c.applicant_types.map((a: string) => lbl(APPLICANTS, a, lang)).join(", "))}
              {fact(t("Eligible geography", "Γεωγραφική επιλεξιμότητα"), lbl(GEOGRAPHY, c.geography, lang))}
              {fact(t("Total call budget", "Συνολικός προϋπολογισμός"), formatEur(c.total_budget_eur))}
              {fact(t("Maximum award per applicant", "Μέγιστη ενίσχυση ανά αιτητή"), formatEur(c.max_award_eur))}
              {fact(t("Co-funding rate", "Ποσοστό συγχρηματοδότησης"), c.cofunding_rate)}
              {fact(t("Eligible costs", "Επιλέξιμες δαπάνες"), c.eligible_costs)}
              {fact(t("Consortium", "Κοινοπραξία"), c.consortium_requirements)}
              {fact(t("Official call page", "Επίσημη σελίδα"), <a className="text-secondary hover:underline break-all" href={c.official_url} target="_blank" rel="noopener noreferrer">{c.official_url}</a>)}
              {fact(t("Last verified", "Τελευταίος έλεγχος"), c.last_verified_at ? new Date(c.last_verified_at).toLocaleDateString(lang === "el" ? "el-GR" : "en-GB", { day: "numeric", month: "long", year: "numeric" }) : null)}
            </dl>
            {c.funding_call_sources?.length > 1 && (
              <div className="mt-8">
                <h2 className="font-serif text-lg font-bold mb-2">{t("Also published at", "Δημοσιεύτηκε επίσης")}</h2>
                <ul className="space-y-1">
                  {c.funding_call_sources.filter((s: { url: string }) => s.url !== c.official_url).map((s: { url: string; title: string | null; language: string }) => (
                    <li key={s.url}><a className="text-sm text-secondary hover:underline" href={s.url} target="_blank" rel="noopener noreferrer">{s.title ?? s.url}</a> <span className="text-xs text-muted-foreground uppercase">{s.language}</span></li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        )}
      </main>
      <Footer />
    </div>
  );
}
