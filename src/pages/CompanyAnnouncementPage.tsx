import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BadgeCheck, Building2, ExternalLink, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAcademyLang } from "@/lib/academy";
import { SITE_URL } from "@/lib/seo";
import { type Announcement, type AnnouncementLink, type TimelineEntry, CY_TAG_LABEL, STAGE_LABEL, TYPE_LABEL, announcementDate, fmtDate, formatDealAmount, label, t } from "@/lib/announcements";
import NotFound from "./NotFound";

export default function CompanyAnnouncementPage() {
  const { slug } = useParams();
  const [lang, setLang] = useAcademyLang();
  const { data, isLoading } = useQuery({
    queryKey: ["company-announcement", slug],
    queryFn: async () => {
      const { data: a } = await supabase.from("company_announcements").select("*").eq("slug", slug!).eq("status", "published").maybeSingle();
      if (!a) return null;
      const ann = a as unknown as Announcement;
      const [links, timeline, company, related] = await Promise.all([
        supabase.from("company_announcement_sources").select("*").eq("announcement_id", ann.id).order("published_at"),
        supabase.from("company_announcement_timeline").select("*").eq("announcement_id", ann.id).order("entry_date"),
        ann.directory_company_id ? supabase.from("directory_companies").select("slug, company_name").eq("id", ann.directory_company_id).maybeSingle() : Promise.resolve({ data: null }),
        ann.directory_company_id
          ? supabase.from("news_entity_links").select("article_id, cna_articles!inner(id, title, published_at, status)").eq("entity_type", "directory_company").eq("entity_id", ann.directory_company_id)
              .in("status", ["approved", "published"]).eq("cna_articles.status", "published").limit(5)
          : Promise.resolve({ data: [] }),
      ]);
      return {
        a: ann, links: (links.data ?? []) as AnnouncementLink[], timeline: (timeline.data ?? []) as TimelineEntry[],
        company: company.data as { slug: string; company_name: string } | null,
        related: ((related.data ?? []) as { cna_articles: { id: string; title: string; published_at: string } }[]).map((r) => r.cna_articles),
      };
    },
    enabled: !!slug,
  });

  if (isLoading) return <div className="min-h-screen bg-background"><TopNavigation onSearch={() => {}} /><div className="container mx-auto px-4 py-16"><div className="h-64 bg-muted rounded-xl animate-pulse" /></div></div>;
  if (!data) return <NotFound />;
  const { a, links, timeline, company, related } = data;
  const isDeal = a.section === "deals";
  const shareUrl = `${SITE_URL}/company-announcements/${a.slug}`;
  const roleLabel = (r: string) => t(r === "primary" ? "primary" : r === "discovery" ? "discovery" : "supporting", lang);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={`${a.title} — ${a.company_name}`} description={a.summary ?? a.title} path={`/company-announcements/${a.slug}`} type="article"
        breadcrumbs={[{ name: "Company Announcements", href: "/company-announcements" }, { name: a.title, href: `/company-announcements/${a.slug}` }]} />
      <TopNavigation onSearch={() => {}} />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center justify-between gap-2 mb-6">
          <Link to={isDeal ? "/company-announcements?tab=deals" : "/company-announcements"} className="text-sm text-muted-foreground hover:text-secondary inline-flex items-center gap-1"><ArrowLeft className="h-4 w-4" />{t("back", lang)}</Link>
          <div className="flex gap-1 border border-border rounded-md p-0.5">
            {(["en", "el"] as const).map((l) => <Button key={l} size="sm" variant={lang === l ? "default" : "ghost"} className="h-7 px-2.5" onClick={() => setLang(l)}>{l === "en" ? "EN" : "ΕΛ"}</Button>)}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant="secondary">{label(TYPE_LABEL, a.announcement_type, lang)}</Badge>
          {isDeal && a.deal_stage && <Badge variant="outline">{label(STAGE_LABEL, a.deal_stage, lang)}</Badge>}
          {a.cyprus_tags.map((tag) => <Badge key={tag} variant="outline">{label(CY_TAG_LABEL, tag, lang)}</Badge>)}
          {a.sector && <Badge variant="outline">{a.sector}</Badge>}
        </div>
        <p className="font-semibold text-foreground flex items-center gap-1.5"><Building2 className="h-4 w-4 text-muted-foreground" />
          {company ? <Link to={`/directory/company/${company.slug}`} className="hover:text-secondary underline-offset-2 hover:underline">{a.company_name}</Link> : a.company_name}
        </p>
        <h1 className="font-serif text-3xl font-bold text-foreground leading-tight mt-1">{a.title}</h1>
        <p className="text-sm text-muted-foreground mt-2">
          {t("published", lang)} {fmtDate(announcementDate(a), lang)}
          {a.event_date && <> · {t("eventDate", lang)} {fmtDate(a.event_date, lang)}</>}
        </p>
        <p className={`mt-3 inline-flex items-center gap-1.5 text-sm ${a.primary_verified ? "text-secondary" : "text-muted-foreground"}`}>
          <BadgeCheck className="h-4 w-4" />{t(a.primary_verified ? "verified" : "reported", lang)}
        </p>

        {a.summary && <p className="mt-6 text-lg leading-relaxed text-foreground">{a.summary}</p>}

        {isDeal && (
          <dl className="mt-6 grid sm:grid-cols-2 gap-4 border border-border rounded-xl bg-card p-5 text-sm">
            <div><dt className="text-muted-foreground">{t("amount", lang)}</dt><dd className="font-semibold text-foreground text-base">{formatDealAmount(a.amount, a.currency, lang)}</dd></div>
            {a.deal_stage && <div><dt className="text-muted-foreground">{t("stage", lang)}</dt><dd className="font-medium text-foreground">{label(STAGE_LABEL, a.deal_stage, lang)}</dd></div>}
            {a.investors.length > 0 && <div><dt className="text-muted-foreground">{t("investors", lang)}</dt><dd className="text-foreground">{a.investors.join(", ")}</dd></div>}
            {a.buyer && <div><dt className="text-muted-foreground">{t("buyer", lang)}</dt><dd className="text-foreground">{a.buyer}</dd></div>}
            {a.cyprus_location && <div><dt className="text-muted-foreground">{t("location", lang)}</dt><dd className="text-foreground">{a.cyprus_location}</dd></div>}
          </dl>
        )}

        {timeline.length > 0 && (
          <section className="mt-8">
            <h2 className="font-serif text-xl font-bold mb-3">{t("timeline", lang)}</h2>
            <ol className="border-l-2 border-border pl-5 space-y-4">
              {timeline.map((e) => (
                <li key={e.id} className="relative">
                  <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full bg-secondary" />
                  <p className="text-xs text-muted-foreground">{fmtDate(e.entry_date, lang)}{e.stage && ` · ${label(STAGE_LABEL, e.stage, lang)}`}</p>
                  <p className="font-medium text-foreground">{e.source_url ? <a href={e.source_url} target="_blank" rel="noopener noreferrer" className="hover:text-secondary">{e.title}</a> : e.title}</p>
                  {e.summary && <p className="text-sm text-muted-foreground">{e.summary}</p>}
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="mt-8">
          <h2 className="font-serif text-xl font-bold mb-3">{t("sources", lang)}</h2>
          <ul className="space-y-2">
            {links.map((l) => (
              <li key={l.id} className="flex items-start gap-2 text-sm">
                <ExternalLink className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-secondary font-medium">{l.title || l.url}</a>
                  <p className="text-xs text-muted-foreground">{roleLabel(l.role)} · {l.source_name}{l.language && ` · ${l.language === "el" ? "Ελληνικά" : "English"}`}{l.published_at && ` · ${fmtDate(l.published_at, lang)}`}</p>
                </div>
              </li>
            ))}
          </ul>
          {a.original_title && a.original_title !== a.title && <p className="text-xs text-muted-foreground mt-3">{t("original", lang)}: {a.original_title}</p>}
          <p className="text-xs text-muted-foreground mt-2">{t("summaryNote", lang)}</p>
        </section>

        {related.length > 0 && (
          <section className="mt-8">
            <h2 className="font-serif text-xl font-bold mb-3">{t("related", lang)}</h2>
            <ul className="space-y-1.5">{related.map((r) => <li key={r.id}><Link to={`/article/${r.id}`} className="text-sm hover:text-secondary">{r.title}</Link></li>)}</ul>
          </section>
        )}

        <div className="mt-8 flex flex-wrap gap-2">
          {company && <Button asChild variant="outline" size="sm"><Link to={`/directory/company/${company.slug}`}>{t("profile", lang)}</Link></Button>}
          <Button variant="outline" size="sm" onClick={() => { navigator.clipboard?.writeText(shareUrl); toast.success("Link copied"); }}><Share2 className="h-4 w-4 mr-1" />Copy link</Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
