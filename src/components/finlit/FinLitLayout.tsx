import { useT, periodLabel } from "@/lib/finlitI18n";
import { Link } from "react-router-dom";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { LangSwitch } from "@/components/academy/AcademyChrome";
import { FinLitNav, MODULE_ICONS } from "@/components/finlit/FinLitNav";
import { moduleByKey } from "@/lib/finlitModules";
import { FL_BORDER_L, FL_BORDER_SOFT, FL_HOVER_BG, FL_HOVER_BORDER, FL_SOFT, FL_TEXT, FL_TINT, moduleAccent } from "@/lib/finlitPalette";
import { useAcademyLang, type Lang } from "@/lib/academy";

type Props = { moduleKey: string; title: string; description: string; intro: string; related?: string[]; children: (lang: Lang) => React.ReactNode };

export function FinLitLayout({ moduleKey, title, description, intro, related = [], children }: Props) {
  const t = useT();
  const [lang, setLang] = useAcademyLang();
  const m = moduleByKey(moduleKey);
  const Icon = MODULE_ICONS[m.icon];
  const a = moduleAccent(moduleKey);
  const crumbs = [{ name: "Home", href: "/" }, { name: "Financial Literacy", href: "/financial-literacy" }, ...(moduleKey === "overview" ? [] : [{ name: m.en, href: m.path }])];
  return (
    <div className="min-h-screen bg-background">
      <div aria-hidden className="h-1.5 bg-gradient-to-r from-finlit-1 via-finlit-3 to-finlit-2" />
      <TopNavigation onSearch={() => {}} />
      <SEOHead title={t(title)} description={t(description)} path={m.path} breadcrumbs={crumbs}
        jsonLd={{ "@context": "https://schema.org", "@type": "WebPage", name: m.en, alternateName: m.el, inLanguage: ["en", "el"], url: `https://businesshub.cy${m.path}` }} />
      <FinLitNav lang={lang} />
      <div className="container mx-auto px-4 py-8 space-y-10">
        <header className={`space-y-3 rounded-2xl border ${FL_BORDER_SOFT[a]} ${FL_TINT[a]} border-l-4 ${FL_BORDER_L[a]} px-5 py-5`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <Link to="/financial-literacy" className={`underline-offset-2 hover:underline ${FL_TEXT[a]}`}>{lang === "el" ? "Χρηματοοικονομικός Αλφαβητισμός" : "Financial Literacy"}</Link>
              {moduleKey !== "overview" && <><span aria-hidden>/</span><span className="text-foreground">{lang === "el" ? m.el : m.en}</span></>}
            </nav>
            <LangSwitch lang={lang} setLang={setLang} />
          </div>
          <h1 className="flex flex-wrap items-center gap-3 text-3xl md:text-4xl font-serif font-bold">
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-background/60 bg-card ${FL_TEXT[a]}`}><Icon className="h-6 w-6" aria-hidden /></span>
            {moduleKey === "overview" ? (lang === "el" ? "Χρηματοοικονομικός Αλφαβητισμός στην Κύπρο" : "Financial Literacy in Cyprus") : lang === "el" ? m.el : m.en}
          </h1>
          <p className="text-muted-foreground max-w-3xl">{t(intro)}</p>
        </header>
        {children(lang)}
        {related.length > 0 && <RelatedModules keys={related} lang={lang} title={lang === "el" ? "Σχετικά" : "Related"} />}
      </div>
      <Footer />
    </div>
  );
}

export function RelatedModules({ keys, lang, title }: { keys: string[]; lang: Lang; title?: string }) {
  const t = useT();
  return (
    <section className="space-y-3">
      {title && <h2 className="text-xl font-serif font-semibold">{title}</h2>}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {keys.map((k) => { const r = moduleByKey(k); const I = MODULE_ICONS[r.icon]; const ra = moduleAccent(k); return (
          <Link key={k} to={r.path} title={lang === "el" ? r.el : r.en} className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Card className={`h-full rounded-xl transition-all group-hover:-translate-y-0.5 group-hover:shadow-md ${FL_HOVER_BORDER[ra]}`}><CardContent className="p-4 flex items-start gap-3">
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${FL_SOFT[ra]} ${FL_TEXT[ra]} transition-colors ${FL_HOVER_BG[ra]} group-hover:text-background`}><I className="h-5 w-5" aria-hidden /></span>
              <div className="min-w-0"><p className="font-serif font-semibold leading-tight">{lang === "el" ? r.short_el : r.short_en}</p><p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t(r.blurb)}</p></div>
            </CardContent></Card>
          </Link>); })}
      </div>
    </section>
  );
}
