import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { HubLayout } from "@/layouts/HubLayout";
import { HubMasthead, HUB_MID_SLOTS } from "@/components/hub/HubMasthead";
import { AdSlot } from "@/components/banners/AdSlot";
import { SEOHead } from "@/components/SEOHead";
import { Input } from "@/components/ui/input";
import { storyImage } from "@/lib/fallbackImage";
import { ENERGY_TOPICS } from "@/lib/energyNews";

type Lang = "en" | "el";
const T = (l: Lang, en: string, el: string) => (l === "el" ? el : en);
const fullDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "");
/** Editors feature a story on the EnergyHub front page by giving it this tag. */
export const ENERGY_FEATURED_TAG = "EnergyHub featured";

type Row = { id: string; title: string; summary: string | null; image_url: string | null; vertical: string; published_at: string | null; body_markdown: string | null; tags: string[] | null; what_happened: string | null };

export function storyTopics(a: Pick<Row, "title" | "summary" | "tags">): string[] {
  const text = `${a.title} ${a.summary ?? ""}`;
  const tags = (a.tags ?? []).map((t) => t.toLowerCase());
  return ENERGY_TOPICS.filter((t) => tags.includes(t.en.toLowerCase()) || t.re.test(text)).map((t) => t.slug);
}

/** EnergyHub.cy: front page (/energy) and searchable archive (/energy/news), both over the `energy` story section. */
export default function EnergyPage({ archive = false }: { archive?: boolean }) {
  const [params, setParams] = useSearchParams();
  const lang: Lang = params.get("lang") === "el" ? "el" : "en";
  const topic = params.get("topic") ?? "";
  const q = params.get("q") ?? "";
  const setParam = (k: string, v: string) => { const p = new URLSearchParams(params); v ? p.set(k, v) : p.delete(k); setParams(p, { replace: true }); };

  const stories = useQuery({
    queryKey: ["energy-news"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cna_articles")
        .select("id, title, summary, image_url, vertical, published_at, body_markdown, tags, what_happened")
        .eq("status", "published").eq("vertical", "energy")
        .order("published_at", { ascending: false }).limit(300);
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });
  const funding = useQuery({
    queryKey: ["energy-funding"],
    enabled: !archive,
    queryFn: async () => {
      const { data } = await supabase.from("funding_calls").select("slug, title_en, title_el, issuer, deadline_date")
        .eq("status", "verified").neq("call_state", "closed").contains("sectors", ["energy"])
        .order("deadline_date", { ascending: true, nullsFirst: false }).limit(4);
      return data ?? [];
    },
  });

  const rows = stories.data ?? [];
  const filtered = useMemo(() => rows.filter((a) =>
    (!topic || storyTopics(a).includes(topic)) &&
    (!q || `${a.title} ${a.summary ?? ""}`.toLowerCase().includes(q.toLowerCase()))), [rows, topic, q]);
  const featured = rows.find((a) => a.tags?.includes(ENERGY_FEATURED_TAG)) ?? rows[0];
  const latest = archive || topic || q ? filtered : filtered.filter((a) => a.id !== featured?.id).slice(0, 9);
  const analysis = archive ? [] : rows.filter((a) => a.what_happened && a.id !== featured?.id).slice(0, 3);
  const topicLabel = (slug: string) => { const t = ENERGY_TOPICS.find((x) => x.slug === slug); return t ? T(lang, t.en, t.el) : ""; };

  return (
    <HubLayout landing={!archive} brand="energyhub">
      <SEOHead
        title={archive ? "Energy News Archive — Cyprus | EnergyHub.cy" : "EnergyHub.cy — Cyprus energy news"}
        description="Cyprus energy news for business: electricity prices, solar and storage, the grid, CERA regulation, projects, natural gas and energy efficiency, each story linked to its source."
        path={archive ? "/energy/news" : "/energy"}
        vertical="energy"
      />
      <section className="border-b border-border bg-card">
        <div className="container mx-auto px-4">
          {!archive && (
            <HubMasthead brand="energyhub"
              kicker={T(lang, "Cyprus Energy Intelligence", "Ενεργειακή Ενημέρωση για την Κύπρο")}
              intro={T(lang, "What changed in Cyprus energy, who is affected, and when it matters.", "Τι άλλαξε στην ενέργεια στην Κύπρο, ποιους αφορά και πότε.")}
              extra={<span className="text-xs text-muted-foreground">{T(lang, "Part of", "Μέρος του")} <Link to="/" className="underline">BusinessHub.cy</Link></span>}
              links={[{ label: T(lang, "News archive", "Αρχείο ειδήσεων"), href: "/energy/news" }, { label: T(lang, "Energy funding", "Χρηματοδοτήσεις"), href: "/funding?sector=energy" }, { label: "BusinessHub", href: "/" }]} />
          )}
          {archive && (
            <div className="py-6">
              <p className="section-label text-energy mb-1">EnergyHub.cy</p>
              <h1 className="font-serif text-3xl md:text-4xl font-bold">{T(lang, "Energy news", "Ειδήσεις ενέργειας")}</h1>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 py-4">
            <button onClick={() => setParam("topic", "")} className={`px-3 py-1 border text-[11px] font-semibold uppercase tracking-wider ${!topic ? "border-energy text-energy" : "border-border"}`}>{T(lang, "All", "Όλα")}</button>
            {ENERGY_TOPICS.map((t) => (
              <button key={t.slug} onClick={() => setParam("topic", t.slug)} className={`px-3 py-1 border text-[11px] font-semibold uppercase tracking-wider ${topic === t.slug ? "border-energy text-energy" : "border-border"}`}>{T(lang, t.en, t.el)}</button>
            ))}
            <button onClick={() => setParam("lang", lang === "el" ? "" : "el")} className="ml-auto text-xs underline text-muted-foreground">{lang === "el" ? "English" : "Ελληνικά"}</button>
          </div>
          {archive && <div className="pb-4 max-w-md"><Input placeholder={T(lang, "Search energy news…", "Αναζήτηση…")} value={q} onChange={(e) => setParam("q", e.target.value)} /></div>}
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {lang === "el" && <p className="text-xs text-muted-foreground mb-4">Οι ειδήσεις δημοσιεύονται στα αγγλικά.</p>}
        {stories.isLoading ? <p className="text-sm text-muted-foreground">…</p> : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{T(lang, "No energy stories yet.", "Δεν υπάρχουν ακόμη ειδήσεις.")}</p>
        ) : (
          <>
            {!archive && !topic && featured && (
              <Link to={`/article/${featured.id}`} className="group grid md:grid-cols-12 gap-6 bg-muted/50 p-4 md:p-6 mb-8">
                <div className="md:col-span-7 aspect-[16/10] overflow-hidden bg-muted">
                  <img src={storyImage(featured.image_url, featured.vertical, featured.id, featured.body_markdown)} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="md:col-span-5 flex flex-col justify-center">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-energy mb-2">{storyTopics(featured).map(topicLabel)[0] || "Energy"}</p>
                  <h2 className="font-serif font-bold text-2xl md:text-3xl leading-tight group-hover:text-secondary transition-colors line-clamp-4">{featured.title}</h2>
                  {featured.summary && <p className="text-muted-foreground mt-3 line-clamp-3">{featured.summary}</p>}
                  <p className="text-xs text-muted-foreground mt-3">{fullDate(featured.published_at)}</p>
                </div>
              </Link>
            )}
            {!archive && <div className="mb-8"><AdSlot size="leaderboard" slotId={HUB_MID_SLOTS.energyhub} /></div>}
            <h2 className="section-label mb-4">{topic ? topicLabel(topic) : T(lang, "Latest news", "Τελευταίες ειδήσεις")}</h2>
            {latest.length === 0 ? <p className="text-sm text-muted-foreground mb-8">{T(lang, "No stories match.", "Καμία ειδήση.")}</p> : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {latest.map((a) => (
                  <Link key={a.id} to={`/article/${a.id}`} className="group block">
                    <div className="aspect-[16/10] overflow-hidden bg-muted mb-3">
                      <img src={storyImage(a.image_url, a.vertical, a.id, a.body_markdown)} alt="" loading="lazy" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-energy mb-1">{storyTopics(a).map(topicLabel)[0] || "Energy"}</p>
                    <h3 className="font-serif text-lg font-semibold leading-snug line-clamp-3 group-hover:text-secondary transition-colors">{a.title}</h3>
                    <time dateTime={a.published_at ?? undefined} title={fullDate(a.published_at)} className="text-xs text-muted-foreground">
                      {a.published_at ? formatDistanceToNow(new Date(a.published_at), { addSuffix: true }) : ""}
                    </time>
                  </Link>
                ))}
              </div>
            )}
            {!archive && !topic && <p className="mb-10"><Link to="/energy/news" className="text-sm font-semibold text-energy underline">{T(lang, "All energy news →", "Όλες οι ειδήσεις →")}</Link></p>}
            {analysis.length > 0 && !topic && (
              <section className="mb-10 border-t border-border pt-6">
                <h2 className="section-label mb-4">BusinessHub {T(lang, "Analysis", "Ανάλυση")}</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {analysis.map((a) => (
                    <Link key={a.id} to={`/article/${a.id}`} className="group block border-l-2 border-energy pl-4">
                      <h3 className="font-serif font-semibold leading-snug group-hover:text-secondary">{a.title}</h3>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-3"><strong>{T(lang, "What happened", "Τι συνέβη")}:</strong> {a.what_happened}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
        {!archive && (funding.data?.length ?? 0) > 0 && (
          <section className="border-t border-border pt-6">
            <h2 className="section-label mb-4">{T(lang, "Open energy funding", "Ανοιχτές χρηματοδοτήσεις ενέργειας")}</h2>
            <ul className="grid md:grid-cols-2 gap-4">
              {funding.data!.map((f) => (
                <li key={f.slug}><Link to={`/funding/${f.slug}`} className="block border border-border p-4 hover:border-foreground">
                  <p className="font-semibold">{lang === "el" && f.title_el ? f.title_el : f.title_en}</p>
                  <p className="text-xs text-muted-foreground mt-1">{f.issuer}{f.deadline_date ? ` · ${T(lang, "Deadline", "Προθεσμία")} ${fullDate(f.deadline_date)}` : ""}</p>
                </Link></li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </HubLayout>
  );
}
