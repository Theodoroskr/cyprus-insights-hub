import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { AdSlot } from "@/components/banners/AdSlot";
import { articlePath } from "@/lib/articleUrl";
import { useState } from "react";
import { BANKING_FILTERS, GR_SECTIONS } from "@/lib/edition";

type Lang = "el" | "en";
type Story = { id: string; title: string; title_el: string | null; summary: string | null; summary_el: string | null;
  published_at: string | null; image_url: string | null; tags: string[] | null; gr_section: string | null; cross_border_note: string | null };

const pick = (lang: Lang, el: string | null | undefined, en: string | null | undefined) => (lang === "el" ? el || en : en || el) || "";

function useGreeceStories(section?: string, tag?: string, org?: string) {
  return useQuery({
    queryKey: ["gr-stories", section, tag, org],
    queryFn: async () => {
      let q = supabase.from("cna_articles")
        .select("id,title,title_el,summary,summary_el,published_at,image_url,tags,gr_section,cross_border_note")
        .eq("status", "published").contains("edition", ["gr"]).order("published_at", { ascending: false }).limit(30);
      if (section) q = q.eq("gr_section", section);
      if (tag) q = q.contains("tags", [tag]);
      if (org) q = q.eq("organisation_slug", org);
      const { data } = await q;
      return (data ?? []) as Story[];
    },
  });
}

function Empty({ lang }: { lang: Lang }) {
  return <p className="border border-dashed border-border p-6 text-sm text-muted-foreground">
    {lang === "el" ? "Δεν υπάρχει ακόμη επαληθευμένο περιεχόμενο σε αυτή την ενότητα." : "No verified items in this section yet."}
  </p>;
}

function StoryList({ items, lang }: { items: Story[]; lang: Lang }) {
  if (!items.length) return <Empty lang={lang} />;
  return <ul className="divide-y divide-border">{items.map((s) => (
    <li key={s.id} className="py-3">
      <Link to={articlePath(s.id, s.title)} className="font-serif text-lg font-semibold hover:underline">{pick(lang, s.title_el, s.title)}</Link>
      {pick(lang, s.summary_el, s.summary) && <p className="text-sm text-muted-foreground mt-1">{pick(lang, s.summary_el, s.summary)}</p>}
      {s.cross_border_note && <p className="text-xs mt-1 text-secondary-foreground">↔ {s.cross_border_note}</p>}
    </li>))}</ul>;
}

function Shell({ lang, setLang, title, children, path }: { lang: Lang; setLang: (l: Lang) => void; title: string; path: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={`${title} | BusinessHub.gr`} description="Επιχειρηματική ενημέρωση για την Ελλάδα — τράπεζες, εταιρικές ανακοινώσεις, χρηματοδοτήσεις και οικονομικά δεδομένα." path={path} />
      <TopNavigation onSearch={() => {}} />
      <div className="border-b border-border bg-muted/40">
        <div className="container mx-auto px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <Link to="/greece" className="font-bold uppercase tracking-wider">BusinessHub<span className="text-secondary">.gr</span></Link>
          <nav className="flex flex-wrap gap-x-3 gap-y-1">{GR_SECTIONS.map((s) => (
            <Link key={s.slug} to={`/greece/${s.slug}`} className="text-muted-foreground hover:text-foreground">{lang === "el" ? s.el : s.en}</Link>))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setLang("el")} className={lang === "el" ? "font-bold" : "text-muted-foreground"}>EL</button>
            <button onClick={() => setLang("en")} className={lang === "en" ? "font-bold" : "text-muted-foreground"}>EN</button>
            <Link to="/" className="underline">← Cyprus Edition</Link>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-3"><AdSlot size="leaderboard" slotId="hub-top" /></div>
      <main className="container mx-auto px-4 py-6">{children}</main>
      <Footer />
    </div>
  );
}

function Home({ lang }: { lang: Lang }) {
  const { data = [] } = useGreeceStories();
  const [lead, ...rest] = data;
  const block = (slug: string) => data.filter((s) => s.gr_section === slug).slice(0, 4);
  return <>
    <h1 className="font-serif text-3xl md:text-4xl font-bold">Επιχειρηματική ενημέρωση για την Ελλάδα</h1>
    <p className="text-muted-foreground mt-2">Εταιρικές ανακοινώσεις, τράπεζες, επενδύσεις, χρηματοδοτήσεις και οικονομικά δεδομένα.</p>
    <div className="grid md:grid-cols-3 gap-8 mt-6">
      <section className="md:col-span-2">
        {lead ? <Link to={articlePath(lead.id, lead.title)} className="block">
          {lead.image_url && <img src={lead.image_url} alt="" className="w-full aspect-video object-cover" />}
          <h2 className="font-serif text-2xl font-bold mt-3">{pick(lang, lead.title_el, lead.title)}</h2>
          <p className="text-muted-foreground mt-1">{pick(lang, lead.summary_el, lead.summary)}</p>
        </Link> : <Empty lang={lang} />}
      </section>
      <aside><h2 className="text-xs font-bold uppercase tracking-wider mb-2">{lang === "el" ? "Τελευταίες ανακοινώσεις" : "Latest announcements"}</h2>
        <StoryList items={rest.slice(0, 6)} lang={lang} /></aside>
    </div>
    <div className="grid md:grid-cols-2 gap-8 mt-10">
      {(["banking", "announcements", "funding", "indicators"] as const).map((slug) => {
        const sec = GR_SECTIONS.find((s) => s.slug === slug)!;
        return <section key={slug}><h2 className="font-serif text-xl font-bold border-b border-foreground pb-1 mb-2">
          <Link to={`/greece/${slug}`}>{lang === "el" ? sec.el : sec.en}</Link></h2><StoryList items={block(slug)} lang={lang} /></section>;
      })}
    </div>
  </>;
}

function Section({ slug, lang }: { slug: string; lang: Lang }) {
  const [params, setParams] = useSearchParams();
  const tag = params.get("filter") ?? undefined;
  const tab = params.get("tab") === "deals" ? "deals" : "listed";
  const sec = GR_SECTIONS.find((s) => s.slug === slug);
  const { data = [] } = useGreeceStories(slug, slug === "announcements" ? (tab === "deals" ? "Funding & Investment Deals" : "Listed Company Disclosures") : tag);
  const { data: orgs = [] } = useQuery({ queryKey: ["gr-orgs"], enabled: slug === "banking",
    queryFn: async () => (await supabase.from("organisations").select("slug,name_en,name_el").eq("country", "GR").order("name_en")).data ?? [] });
  if (!sec) return <Empty lang={lang} />;
  const chip = (active: boolean) => `px-3 py-1 text-xs border ${active ? "bg-foreground text-background border-foreground" : "border-border"}`;
  return <>
    <h1 className="font-serif text-3xl font-bold mb-4">{lang === "el" ? sec.el : sec.en}</h1>
    {slug === "banking" && <>
      <div className="flex flex-wrap gap-2 mb-3">
        <button className={chip(!tag)} onClick={() => setParams({})}>{lang === "el" ? "Όλα" : "All"}</button>
        {BANKING_FILTERS.map((f) => <button key={f.tag} className={chip(tag === f.tag)} onClick={() => setParams({ filter: f.tag })}>{lang === "el" ? f.el : f.tag}</button>)}
      </div>
      <div className="flex flex-wrap gap-3 mb-6 text-sm">{orgs.map((o) => <Link key={o.slug} to={`/greece/org/${o.slug}`} className="underline">{pick(lang, o.name_el, o.name_en)}</Link>)}</div>
    </>}
    {slug === "announcements" && <div className="flex gap-2 mb-4">
      <button className={chip(tab === "listed")} onClick={() => setParams({})}>Listed Company Disclosures</button>
      <button className={chip(tab === "deals")} onClick={() => setParams({ tab: "deals" })}>Funding & Investment Deals</button>
    </div>}
    <StoryList items={data} lang={lang} />
  </>;
}

function Org({ slug, lang }: { slug: string; lang: Lang }) {
  const { data: org } = useQuery({ queryKey: ["gr-org", slug],
    queryFn: async () => (await supabase.from("organisations").select("*").eq("slug", slug).maybeSingle()).data });
  const { data = [] } = useGreeceStories(undefined, undefined, slug);
  if (!org) return <Empty lang={lang} />;
  const links = (org.official_links as { label: string; url: string }[]) ?? [];
  return <>
    <h1 className="font-serif text-3xl font-bold">{pick(lang, org.name_el, org.name_en)}</h1>
    <p className="text-muted-foreground mt-1">{pick(lang, org.description_el, org.description_en)}</p>
    <ul className="flex flex-wrap gap-4 my-4 text-sm">{links.map((l) => <li key={l.url}><a href={l.url} target="_blank" rel="noopener noreferrer" className="underline">{l.label} ↗</a></li>)}</ul>
    <StoryList items={data} lang={lang} />
  </>;
}

export default function GreecePage() {
  const { section, slug } = useParams();
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem("gr-lang") === "en" ? "en" : "el"));
  const changeLang = (l: Lang) => { localStorage.setItem("gr-lang", l); setLang(l); };
  const title = slug ? "Οργανισμός" : section ? (GR_SECTIONS.find((s) => s.slug === section)?.el ?? "Ελλάδα") : "Επιχειρηματική ενημέρωση για την Ελλάδα";
  const path = slug ? `/greece/org/${slug}` : section ? `/greece/${section}` : "/greece";
  return <Shell lang={lang} setLang={changeLang} title={title} path={path}>
    {slug ? <Org slug={slug} lang={lang} /> : section ? <Section slug={section} lang={lang} /> : <Home lang={lang} />}
  </Shell>;
}
