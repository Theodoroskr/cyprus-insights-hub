import { Link } from "react-router-dom";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { LangSwitch } from "@/components/academy/AcademyChrome";
import { FinLitNav, MODULE_ICONS } from "@/components/finlit/FinLitNav";
import { moduleByKey } from "@/lib/finlitModules";
import { useAcademyLang, type Lang } from "@/lib/academy";

type Props = { moduleKey: string; title: string; description: string; intro: string; related?: string[]; children: (lang: Lang) => React.ReactNode };

export function FinLitLayout({ moduleKey, title, description, intro, related = [], children }: Props) {
  const [lang, setLang] = useAcademyLang();
  const m = moduleByKey(moduleKey);
  const Icon = MODULE_ICONS[m.icon];
  const crumbs = [{ name: "Home", href: "/" }, { name: "Financial Literacy", href: "/financial-literacy" }, ...(moduleKey === "overview" ? [] : [{ name: m.en, href: m.path }])];
  return (
    <div className="min-h-screen bg-background">
      <TopNavigation onSearch={() => {}} />
      <SEOHead title={title} description={description} path={m.path} breadcrumbs={crumbs}
        jsonLd={{ "@context": "https://schema.org", "@type": "WebPage", name: m.en, alternateName: m.el, inLanguage: ["en", "el"], url: `https://businesshub.cy${m.path}` }} />
      <FinLitNav lang={lang} />
      <div className="container mx-auto px-4 py-8 space-y-10">
        <header className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <Link to="/financial-literacy" className="hover:underline">{lang === "el" ? "Χρηματοοικονομικός Αλφαβητισμός" : "Financial Literacy"}</Link>
              {moduleKey !== "overview" && <><span aria-hidden>/</span><span className="text-foreground">{lang === "el" ? m.el : m.en}</span></>}
            </nav>
            <LangSwitch lang={lang} setLang={setLang} />
          </div>
          <h1 className="flex items-center gap-3 text-3xl md:text-4xl font-serif font-bold"><Icon className="h-8 w-8 text-primary shrink-0" aria-hidden />{moduleKey === "overview" ? (lang === "el" ? "Χρηματοοικονομικός Αλφαβητισμός στην Κύπρο" : "Financial Literacy in Cyprus") : lang === "el" ? m.el : m.en}</h1>
          <p className="text-muted-foreground max-w-3xl">{intro}</p>
        </header>
        {children(lang)}
        {related.length > 0 && <RelatedModules keys={related} lang={lang} title={lang === "el" ? "Σχετικά" : "Related"} />}
      </div>
      <Footer />
    </div>
  );
}

export function RelatedModules({ keys, lang, title }: { keys: string[]; lang: Lang; title?: string }) {
  return (
    <section className="space-y-3">
      {title && <h2 className="text-xl font-serif font-semibold">{title}</h2>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {keys.map((k) => { const r = moduleByKey(k); const I = MODULE_ICONS[r.icon]; return (
          <Link key={k} to={r.path} className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Card className="h-full transition-shadow hover:shadow-md"><CardContent className="p-4 flex gap-3">
              <I className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden />
              <div><p className="font-serif font-semibold">{lang === "el" ? r.el : r.en}</p><p className="text-sm text-muted-foreground">{r.blurb}</p></div>
            </CardContent></Card>
          </Link>); })}
      </div>
    </section>
  );
}
