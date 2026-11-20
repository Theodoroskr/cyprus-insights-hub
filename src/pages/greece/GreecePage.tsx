import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { AdSlot } from "@/components/banners/AdSlot";
import { articlePath } from "@/lib/articleUrl";
import { Fragment, useState } from "react";
import { BANKING_FILTERS, CY_HOST, GR_PAGES, GR_SECTIONS, grHref, onGrHost } from "@/lib/edition";
import { BusinessPulse } from "@/components/greece/BusinessPulse";
import { Opportunities } from "@/components/greece/Opportunities";
import { blendBlocks, readableIn, sectionFill } from "@/lib/greeceBlend";
import { isInternationalStory } from "@/lib/storyOrigin";
import { listImage } from "@/lib/fallbackImage";
import { Helmet } from "react-helmet-async";
import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, formatDistanceToNow } from "date-fns";
import { el as elLocale } from "date-fns/locale";

type Lang = "el" | "en";
type Story = { id: string; title: string; title_el: string | null; summary: string | null; summary_el: string | null;
  published_at: string | null; image_url: string | null; vertical?: string | null; tags: string[] | null; gr_section: string | null; cross_border_note: string | null };

const pick = (lang: Lang, el: string | null | undefined, en: string | null | undefined) => (lang === "el" ? el || en : en || el) || "";

function useGreeceStories(section?: string, tag?: string, org?: string) {
  return useQuery({
    queryKey: ["gr-stories", section, tag, org],
    queryFn: async () => {
      let q = supabase.from("cna_articles")
        .select("id,title,title_el,summary,summary_el,published_at,image_url,vertical,tags,gr_section,cross_border_note,body_markdown")
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

function StoryList({ items, lang, compact }: { items: Story[]; lang: Lang; compact?: boolean }) {
  // In Greek, show only stories that have a Greek headline, so the page never mixes languages.
  const rows = readableIn(lang, items);
  if (!rows.length) return <Empty lang={lang} />;
  return <ul className="divide-y divide-border">{rows.map((s, i) => (
    <li key={s.id} className="py-3 flex gap-3">
      <Link to={grHref(articlePath(s.id, s.title))} className="shrink-0"><img src={listImage(rows, i)} alt="" loading="lazy" data-vertical={s.vertical ?? undefined} data-seed={s.id} className="w-24 h-16 sm:w-28 sm:h-[72px] object-cover rounded bg-muted" /></Link>
      <div className="min-w-0">
      {!s.gr_section && <span lang={lang} className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">{isInternationalStory(s) ? (lang === "el" ? "Διεθνή" : "International") : (lang === "el" ? "Κύπρος" : "Cyprus")}</span>}
      {s.tags?.includes("Press release") && <span lang={lang} className="block text-[11px] font-semibold uppercase tracking-wider text-secondary mb-0.5">{lang === "el" ? "Δελτίο Τύπου" : "Press release"}</span>}
      <Link to={grHref(articlePath(s.id, s.title))} lang={lang} className={`font-serif font-semibold hover:underline break-words line-clamp-3 ${compact ? "text-base leading-snug" : "text-lg"}`}>{pick(lang, s.title_el, s.title)}</Link>
      {!compact && pick(lang, s.summary_el, s.summary) && <p lang={lang} className="text-sm text-muted-foreground mt-1 line-clamp-2">{pick(lang, s.summary_el, s.summary)}</p>}
      {s.cross_border_note && <p className="text-xs mt-1 text-secondary-foreground">↔ {s.cross_border_note}</p>}
      </div>
    </li>))}</ul>;
}

/** Section pages: same lead card + 3-column card grid as the Cyprus Edition news pages. */
function StoryGrid({ items, lang }: { items: Story[]; lang: Lang }) {
  const rows = readableIn(lang, items);
  if (!rows.length) return <Empty lang={lang} />;
  const loc = lang === "el" ? { locale: elLocale } : undefined;
  const label = (s: Story) => {
    if (s.tags?.includes("Press release")) return lang === "el" ? "Δελτίο Τύπου" : "Press release";
    if (!s.gr_section) return isInternationalStory(s) ? (lang === "el" ? "Διεθνή" : "International") : (lang === "el" ? "Κύπρος" : "Cyprus");
    const sec = GR_SECTIONS.find((g) => g.slug === s.gr_section);
    return sec ? (lang === "el" ? sec.el : sec.en) : (lang === "el" ? "Ελλάδα" : "Greece");
  };
  const meta = (d: string | null, long: boolean) => d && (
    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
      <Calendar className="h-3 w-3" />
      <span>{format(new Date(d), long ? "d MMM yyyy, HH:mm" : "d MMM yyyy", loc)}</span>
      <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
      <span>{formatDistanceToNow(new Date(d), { addSuffix: true, ...loc })}</span>
    </div>);
  const [lead, ...rest] = rows;
  const href = (s: Story) => grHref(articlePath(s.id, s.title));
  return <div lang={lang}>
    <Link to={href(lead)} className="group block mb-10">
      <div className="grid md:grid-cols-2 gap-6 border border-border rounded-xl overflow-hidden bg-card hover:shadow-xl transition-all">
        <div className="relative aspect-[16/9] overflow-hidden">
          <img src={listImage(rows, 0)} alt="" data-vertical={lead.vertical ?? undefined} data-seed={lead.id} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
        <div className="p-8 flex flex-col justify-center">
          <Badge variant="outline" className="w-fit mb-3">{label(lead)}</Badge>
          <h2 className="text-2xl font-serif font-bold text-foreground group-hover:text-secondary transition-colors leading-snug line-clamp-3">{pick(lang, lead.title_el, lead.title)}</h2>
          {pick(lang, lead.summary_el, lead.summary) && <p className="text-muted-foreground mt-3 line-clamp-3">{pick(lang, lead.summary_el, lead.summary)}</p>}
          {meta(lead.published_at, true)}
        </div>
      </div>
    </Link>
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
      {rest.map((s, i) => (<Fragment key={s.id}>
        {i === 6 && <div className="md:col-span-2 lg:col-span-3 py-2"><AdSlot size="leaderboard" slotId="greece-mid" label={adLabel(lang)} /></div>}
        <Link to={href(s)} className="group border border-border rounded-lg overflow-hidden bg-card hover:shadow-lg transition-all">
          <div className="relative aspect-[16/9] overflow-hidden">
            <img src={listImage(rows, i + 1)} alt="" loading="lazy" data-vertical={s.vertical ?? undefined} data-seed={s.id} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <Badge className="absolute top-3 left-3 bg-foreground/80 text-background text-xs">{label(s)}</Badge>
          </div>
          <div className="p-4">
            <h3 className="font-serif font-bold text-foreground group-hover:text-secondary transition-colors line-clamp-2">{pick(lang, s.title_el, s.title)}</h3>
            {pick(lang, s.summary_el, s.summary) && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{pick(lang, s.summary_el, s.summary)}</p>}
            {meta(s.published_at, false)}
          </div>
        </Link></Fragment>))}
    </div>
    {rest.length <= 6 && <div className="mt-8"><AdSlot size="leaderboard" slotId="greece-mid" label={adLabel(lang)} /></div>}
  </div>;
}

const adLabel = (lang: Lang) => (lang === "el" ? "Διαφημιστείτε εδώ" : "Advertise here");

function Shell({ lang, setLang, title, children, path }: { lang: Lang; setLang: (l: Lang) => void; title: string; path: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Helmet><link rel="alternate" type="application/rss+xml" title="BusinessHub.gr — Ελλάδα" href="/rss/greece.xml" /></Helmet>
      <SEOHead title={`${title} | BusinessHub.gr`} description={lang === "el" ? "Επιχειρηματική ενημέρωση για την Ελλάδα — τράπεζες, εταιρικές ανακοινώσεις, χρηματοδοτήσεις και οικονομικά δεδομένα." : "Business intelligence for Greece — banking, company announcements, funding and economic data."} path={path} />
      <TopNavigation onSearch={() => {}} />
      <div className="border-b border-border bg-muted/40">
        <div className="container mx-auto px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <Link to={grHref("/greece")} className="font-bold uppercase tracking-wider">BusinessHub<span className="text-secondary">.gr</span></Link>
          <nav className="flex flex-wrap gap-x-3 gap-y-1">{GR_SECTIONS.map((s) => (
            <Link key={s.slug} to={grHref(`/greece/${s.slug}`)} className="text-muted-foreground hover:text-foreground">{lang === "el" ? s.el : s.en}</Link>))}
            {GR_PAGES.map((s) => (
            <Link key={s.slug} to={grHref(`/greece/${s.slug}`)} className="font-medium text-foreground hover:underline">{lang === "el" ? s.el : s.en}</Link>))}
            <Link to="/compare/greece-cyprus" className="font-medium text-foreground hover:underline">{lang === "el" ? "Σύγκριση με την Κύπρο" : "Compare with Cyprus"}</Link>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setLang("el")} className={lang === "el" ? "font-bold" : "text-muted-foreground"}>EL</button>
            <button onClick={() => setLang("en")} className={lang === "en" ? "font-bold" : "text-muted-foreground"}>EN</button>
            {onGrHost()
              ? <a href={`${CY_HOST}/`} className="underline">← Cyprus Edition</a>
              : <Link to="/" className="underline">← Cyprus Edition</Link>}
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 pt-5"><AdSlot size="wide-banner" slotId="greece-top" label={adLabel(lang)} /></div>
      <main className="container mx-auto px-4 py-6">{children}</main>
      <Footer />
    </div>
  );
}

type Other = Story & { what_happened: string | null; greece_related: boolean };
/** Recent Cyprus Edition stories (not also in the Greece edition), used to fill out the Greece pages. */
function useOthers() {
  return useQuery({
    queryKey: ["gr-others"],
    queryFn: async () => {
      const { data } = await supabase.from("cna_articles")
        .select("id,title,title_el,summary,summary_el,what_happened,published_at,image_url,vertical,tags,gr_section,cross_border_note,greece_related")
        .eq("status", "published").contains("edition", ["cy"]).not("edition", "cs", "{gr}")
        .order("published_at", { ascending: false }).limit(250);
      return (data ?? []) as Other[];
    },
  });
}
/** Small picture card used under the home lead story. */
function MiniCard({ s, rows, i, lang }: { s: Story; rows: Story[]; i: number; lang: Lang }) {
  return <Link to={grHref(articlePath(s.id, s.title))} lang={lang} className="group block">
    <div className="aspect-[16/9] overflow-hidden rounded bg-muted">
      <img src={listImage(rows, i)} alt="" loading="lazy" data-vertical={s.vertical ?? undefined} data-seed={s.id} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
    </div>
    <h3 className="font-serif font-semibold leading-snug mt-2 line-clamp-3 group-hover:underline">{pick(lang, s.title_el, s.title)}</h3>
    {s.published_at && <p className="text-xs text-muted-foreground mt-1">{format(new Date(s.published_at), "d MMM yyyy", lang === "el" ? { locale: elLocale } : undefined)}</p>}
  </Link>;
}

const HOME_BLOCKS = ["banking", "announcements", "funding", "indicators", "business", "fintech"] as const;

function Home({ lang }: { lang: Lang }) {
  const { data: raw = [] } = useGreeceStories();
  const { data: rawOthers = [] } = useOthers();
  // Pick only stories readable in the chosen language first, so no block is emptied afterwards.
  const data = readableIn(lang, raw);
  const others = readableIn(lang, rawOthers);
  const [lead, ...rest] = data;
  const side = rest.slice(0, 7), under = rest.slice(7, 11);
  // Each story appears once on the page: top stories, then each block, then the Cyprus/International blend.
  const used = new Set<string>([lead, ...side, ...under].filter(Boolean).map((s) => s!.id));
  const blocks: { slug: string; rows: Story[] }[] = [];
  for (const slug of HOME_BLOCKS) {
    const rows = sectionFill(slug, data.filter((s) => s.gr_section === slug && !used.has(s.id)), others.filter((o) => !used.has(o.id)), { size: 4, cyprusMax: 1 });
    rows.forEach((r) => used.add(r.id));
    if (rows.length) blocks.push({ slug, rows });
  }
  // Keep the two-column grid even so no half-row is left blank.
  const shown = blocks.length % 2 ? blocks.slice(0, -1) : blocks;
  const blend = blendBlocks(others.filter((s) => !used.has(s.id)).slice(0, 80));
  const blendCols = [
    { id: "gr-blend-cy", title: lang === "el" ? "Από την Κύπρο" : "From Cyprus", rows: blend.cyprus },
    { id: "gr-blend-intl", title: lang === "el" ? "Διεθνή" : "International", rows: blend.international },
  ].filter((c) => c.rows.length);
  const heading = (title: string, to?: string, id?: string) => <h2 id={id} className="font-serif text-xl font-bold border-b border-foreground pb-1 mb-2">{to ? <Link to={to} className="hover:underline">{title}</Link> : title}</h2>;
  return <>
    <h1 className="font-serif text-3xl md:text-4xl font-bold">{lang === "el" ? "Επιχειρηματική ενημέρωση για την Ελλάδα" : "Business intelligence for Greece"}</h1>
    <p className="text-muted-foreground mt-2">{lang === "el" ? "Εταιρικές ανακοινώσεις, τράπεζες, επενδύσεις, χρηματοδοτήσεις και οικονομικά δεδομένα." : "Company announcements, banking, investment, funding and economic data."}</p>
    <div className="grid lg:grid-cols-3 gap-8 mt-6">
      <section className="lg:col-span-2 min-w-0">
        {lead ? <Link to={grHref(articlePath(lead.id, lead.title))} lang={lang} className="group block">
          <div className="aspect-video overflow-hidden rounded bg-muted">
            <img src={listImage(data, 0)} alt="" data-vertical={lead.vertical ?? undefined} data-seed={lead.id} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>
          <h2 className="font-serif text-2xl md:text-3xl font-bold mt-3 leading-tight group-hover:underline">{pick(lang, lead.title_el, lead.title)}</h2>
          <p className="text-muted-foreground mt-2 line-clamp-3">{pick(lang, lead.summary_el, lead.summary)}</p>
        </Link> : <Empty lang={lang} />}
        {under.length > 0 && <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border">
          {under.map((s, i) => <MiniCard key={s.id} s={s} rows={data} i={8 + i} lang={lang} />)}
        </div>}
      </section>
      <aside className="min-w-0">
        <h2 className="text-xs font-bold uppercase tracking-wider border-b border-foreground pb-1">{lang === "el" ? "Τελευταίες ανακοινώσεις" : "Latest announcements"}</h2>
        <StoryList items={side} lang={lang} compact />
      </aside>
    </div>
    <div className="mt-10"><AdSlot size="leaderboard" slotId="greece-mid" label={adLabel(lang)} /></div>
    {shown.length > 0 && <div className="grid md:grid-cols-2 gap-x-8 gap-y-10 mt-10">
      {shown.map(({ slug, rows }) => {
        const sec = GR_SECTIONS.find((s) => s.slug === slug)!;
        return <section key={slug} className="min-w-0">{heading(lang === "el" ? sec.el : sec.en, grHref(`/greece/${slug}`))}<StoryList items={rows} lang={lang} /></section>;
      })}
    </div>}
    <div className="mt-10"><AdSlot size="leaderboard" slotId="greece-footer" label={adLabel(lang)} /></div>
    {blendCols.length > 0 && <div className={`grid gap-8 mt-10 pt-6 border-t border-border ${blendCols.length === 2 ? "md:grid-cols-2" : ""}`}>
      {blendCols.map((c) => <section key={c.id} aria-labelledby={c.id} className="min-w-0">{heading(c.title, undefined, c.id)}<StoryList items={c.rows} lang={lang} /></section>)}
    </div>}
  </>;
}

function Section({ slug, lang }: { slug: string; lang: Lang }) {
  const [params, setParams] = useSearchParams();
  const tag = params.get("filter") ?? undefined;
  const tab = params.get("tab") === "deals" ? "deals" : "listed";
  const sec = GR_SECTIONS.find((s) => s.slug === slug);
  const { data: own = [] } = useGreeceStories(slug, slug === "announcements" ? (tab === "deals" ? "Funding & Investment Deals" : "Listed Company Disclosures") : tag);
  const { data: others = [] } = useOthers();
  // Banking filters stay Greece-only; other pages (and both announcement tabs) add matching International/Cyprus stories.
  const fillSlug = slug === "announcements" && tab === "deals" ? "deals" : slug;
  const data = tag ? readableIn(lang, own) : sectionFill(fillSlug, readableIn(lang, own), readableIn(lang, others), { size: 30 });
  const { data: orgs = [] } = useQuery({ queryKey: ["gr-orgs"], enabled: slug === "banking",
    queryFn: async () => (await supabase.from("organisations").select("slug,name_en,name_el").eq("country", "GR").order("name_en")).data ?? [] });
  if (!sec) return <Empty lang={lang} />;
  const chip = (active: boolean) => (active ? "default" : "outline") as "default" | "outline";
  return <>
    <div className="bg-card border border-border rounded-xl p-6 md:p-8 mb-10">
    <h1 className="text-3xl font-serif font-bold text-foreground">{lang === "el" ? sec.el : sec.en}</h1>
    {slug === "banking" && <>
      <div className="flex flex-wrap gap-2 mt-5">
        <Button size="sm" variant={chip(!tag)} onClick={() => setParams({})}>{lang === "el" ? "Όλα" : "All"}</Button>
        {BANKING_FILTERS.map((f) => <Button key={f.tag} size="sm" variant={chip(tag === f.tag)} onClick={() => setParams({ filter: f.tag })}>{lang === "el" ? f.el : f.tag}</Button>)}
      </div>
      <div className="flex flex-wrap gap-3 mt-4 text-sm">{orgs.map((o) => <Link key={o.slug} to={grHref(`/greece/org/${o.slug}`)} className="underline">{pick(lang, o.name_el, o.name_en)}</Link>)}</div>
    </>}
    {slug === "announcements" && <div className="flex flex-wrap gap-2 mt-5">
      <Button size="sm" variant={chip(tab === "listed")} onClick={() => setParams({})}>{lang === "el" ? "Ανακοινώσεις εισηγμένων εταιρειών" : "Listed Company Disclosures"}</Button>
      <Button size="sm" variant={chip(tab === "deals")} onClick={() => setParams({ tab: "deals" })}>{lang === "el" ? "Χρηματοδοτήσεις & Επενδυτικές Συμφωνίες" : "Funding & Investment Deals"}</Button>
    </div>}
    </div>
    <StoryGrid items={data} lang={lang} />
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
    <ul className="flex flex-wrap gap-4 my-4 mb-8 text-sm">{links.map((l) => <li key={l.url}><a href={l.url} target="_blank" rel="noopener noreferrer" className="underline">{l.label} ↗</a></li>)}</ul>
    <StoryGrid items={data} lang={lang} />
  </>;
}

export default function GreecePage() {
  const { section, slug } = useParams();
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem("gr-lang") === "en" ? "en" : "el"));
  const changeLang = (l: Lang) => { localStorage.setItem("gr-lang", l); setLang(l); };
  const el = lang === "el"; const sec = section ? (GR_SECTIONS.find((s) => s.slug === section) ?? GR_PAGES.find((s) => s.slug === section)) : undefined;
  const title = slug ? (el ? "Οργανισμός" : "Organisation") : section ? ((el ? sec?.el : sec?.en) ?? (el ? "Ελλάδα" : "Greece")) : (el ? "Επιχειρηματική ενημέρωση για την Ελλάδα" : "Business intelligence for Greece");
  const path = slug ? `/greece/org/${slug}` : section ? `/greece/${section}` : "/greece";
  return <Shell lang={lang} setLang={changeLang} title={title} path={path}>
    {slug ? <Org slug={slug} lang={lang} />
      : section === "business-pulse" ? <BusinessPulse lang={lang} />
      : section === "opportunities" ? <Opportunities lang={lang} />
      : section ? <Section slug={section} lang={lang} /> : <Home lang={lang} />}
  </Shell>;
}
