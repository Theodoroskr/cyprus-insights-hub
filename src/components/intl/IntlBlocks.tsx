import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { BrandLockup } from "@/components/brand/BrandLockup";
import { articlePath } from "@/lib/articleUrl";
import { listImage } from "@/lib/fallbackImage";
import { grHref, grEnHref } from "@/lib/edition";
import { cyprusHome, currentHost, greeceHome } from "@/lib/networkEditions";
import { MARKET_LABEL, MARKET_SOURCE, storyMarket, type IntlStory } from "@/lib/internationalHome";
import { useStatSeries } from "@/hooks/useStatSeries";
import { GEO_NAMES, formatValue, latestCommonPeriod, periodLabel } from "@/lib/greecePulse";
import { databrowserUrl } from "@/lib/eurostatView";

/** Shared pieces of the International homepage and its section pages. */
export type Row = IntlStory & { body_markdown?: string | null };

const COLUMNS = "id,title,summary,what_happened,published_at,image_url,vertical,tags,edition,greece_related,gr_section,cross_border_note,featured_until";

/** Newest published stories of the Cyprus and Greece editions; the page makes its own selection from them. */
export function useNetworkStories(limit = 300) {
  return useQuery({
    queryKey: ["intl-network-stories", limit],
    staleTime: 120_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("cna_articles").select(COLUMNS)
        .eq("status", "published").overlaps("edition", ["cy", "gr"]).not("published_at", "is", null)
        .order("published_at", { ascending: false }).limit(limit);
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });
}

/** Story links always open the original story page of its own edition. */
export const storyHref = (s: Row) => grHref(articlePath(s.id, s.title));

export function MarketTag({ s }: { s: Row }) {
  const m = storyMarket(s);
  return <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
    {MARKET_LABEL[m]}{m !== "intl" && <span className="font-normal normal-case tracking-normal"> · {MARKET_SOURCE[m]}</span>}
    {s.tags?.includes("Press release") && <span className="text-secondary"> · Press release</span>}
  </span>;
}

export function StoryList({ rows, compact }: { rows: Row[]; compact?: boolean }) {
  return <ul className="divide-y divide-border">{rows.map((s, i) => (
    <li key={s.id} className="py-3 flex gap-3">
      <Link to={storyHref(s)} className="shrink-0" tabIndex={-1} aria-hidden>
        <img src={listImage(rows, i)} alt="" loading="lazy" data-vertical={s.vertical ?? undefined} data-seed={s.id} className="w-24 h-16 sm:w-28 sm:h-[72px] object-cover rounded bg-muted" />
      </Link>
      <div className="min-w-0">
        <MarketTag s={s} />
        <Link to={storyHref(s)} className={`font-serif font-semibold hover:underline break-words line-clamp-3 ${compact ? "text-base leading-snug" : "text-lg"}`}>{s.title}</Link>
        {!compact && s.summary && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{s.summary}</p>}
      </div>
    </li>))}</ul>;
}

export function MiniCard({ s, rows, i }: { s: Row; rows: Row[]; i: number }) {
  return <Link to={storyHref(s)} className="group block">
    <div className="aspect-[16/9] overflow-hidden rounded bg-muted">
      <img src={listImage(rows, i)} alt="" loading="lazy" data-vertical={s.vertical ?? undefined} data-seed={s.id} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
    </div>
    <span className="block mt-2"><MarketTag s={s} /></span>
    <h3 className="font-serif font-semibold leading-snug line-clamp-3 group-hover:underline">{s.title}</h3>
    <p className="text-xs text-muted-foreground mt-1">{format(new Date(s.published_at), "d MMM yyyy")}</p>
  </Link>;
}

export function Heading({ id, children, more }: { id?: string; children: ReactNode; more?: { to: string; label: string } }) {
  return <div className="flex items-baseline justify-between gap-3 border-b border-foreground pb-1 mb-2">
    <h2 id={id} className="font-serif text-xl font-bold scroll-mt-24">{children}</h2>
    {more && <Link to={more.to} className="text-xs font-semibold uppercase tracking-wider text-secondary hover:underline whitespace-nowrap">{more.label}</Link>}
  </div>;
}

/** Cyprus and Greece edition cards; each opens that edition's own home. */
type More = { to: string; label: string };

export function MarketEditions({ more }: { more?: More } = {}) {
  const host = currentHost();
  const cards = [
    { key: "cy" as const, home: cyprusHome(host), text: "Cyprus business news, 61,000+ registered companies with regulator licences, and official economy, property and trade data.",
      links: [{ to: "/directory", label: "Company directory" }, { to: "/economy", label: "Economy" }, { to: "/funding", label: "Funding" }] },
    { key: "gr" as const, home: greeceHome(host), text: "Greek business news in Greek and English: banks, company announcements, funding, public tenders and official economic data.",
      links: [{ to: grEnHref("/greece/business-pulse"), label: "Business Pulse" }, { to: grEnHref("/greece/opportunities"), label: "Tenders" }, { to: grEnHref("/greece/banking"), label: "Banking" }] },
  ];
  return <section aria-labelledby="markets" className="mt-12">
    <Heading id="markets" more={more}>Market editions</Heading>
    <div className="grid md:grid-cols-2 gap-5 mt-4">
      {cards.map((c) => {
        const open = (inner: ReactNode, cls: string) => c.home.external ? <a href={c.home.href} className={cls}>{inner}</a> : <Link to={c.home.href} className={cls}>{inner}</Link>;
        return <div key={c.key} className="border border-border rounded-xl bg-card p-6 flex flex-col">
          {open(<BrandLockup edition={c.key} lang="el" />, "w-fit")}
          <p className="text-sm text-muted-foreground mt-4 flex-1">{c.text}</p>
          {c.home.external ? null : <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 text-sm">
            {c.links.map((l) => <Link key={l.to} to={l.to} className="text-foreground hover:underline">{l.label}</Link>)}
          </div>}
          {open(<>Open the {c.key === "cy" ? "Cyprus" : "Greece"} edition <ArrowRight className="h-3.5 w-3.5" /></>, "mt-5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-secondary hover:gap-2.5 transition-all")}
        </div>;
      })}
    </div>
    <p className="text-sm mt-3"><Link to="/compare/greece-cyprus" className="underline">Compare Greece and Cyprus on official indicators</Link></p>
  </section>;
}

export type FundingRow = { slug: string; title_en: string; issuer: string; deadline_date: string | null; eligibility_summary: string | null; official_url: string | null; instrument_type: string | null };

export function FundingBlock({ more = { to: "/funding", label: "All funding calls" }, title = "Funding opportunities" }: { more?: More; title?: string } = {}) {
  const { data = [] } = useQuery({
    queryKey: ["intl-funding-preview"],
    staleTime: 600_000,
    queryFn: async () => ((await supabase.rpc("get_funding_preview")).data ?? []) as FundingRow[],
  });
  if (!data.length) return null;
  return <section aria-labelledby="funding" className="mt-12">
    <Heading id="funding" more={more}>{title}</Heading>
    <div className="grid md:grid-cols-3 gap-5 mt-4">
      {data.map((f) => <div key={f.slug} className="border border-border rounded-lg bg-card p-5 flex flex-col">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Open in Cyprus · {f.issuer}</p>
        <Link to={`/funding/${f.slug}`} className="font-serif font-semibold text-lg leading-snug mt-1 hover:underline line-clamp-3">{f.title_en}</Link>
        {f.eligibility_summary && <p className="text-sm text-muted-foreground mt-2 line-clamp-3"><span className="font-medium text-foreground">Who can apply:</span> {f.eligibility_summary}</p>}
        <p className="text-sm mt-2"><span className="font-medium">Deadline:</span> {f.deadline_date ? format(new Date(f.deadline_date), "d MMM yyyy") : "Not stated"}</p>
        {f.official_url && <a href={f.official_url} target="_blank" rel="noopener noreferrer" className="mt-auto pt-3 inline-flex items-center gap-1 text-xs text-muted-foreground underline">Official call <ExternalLink className="h-3 w-3" /></a>}
      </div>)}
    </div>
    <p className="text-sm mt-3"><Link to={grEnHref("/greece/funding")} className="underline">Greece: funding and public tenders</Link></p>
  </section>;
}

export const INDICATORS = [
  { code: "gdp_growth", title: "Real GDP growth", unit: "% vs same quarter last year" },
  { code: "hicp_all", title: "Inflation (HICP)", unit: "% vs same month last year" },
  { code: "unemployment", title: "Unemployment", unit: "% of labour force" },
];

/** Same Eurostat series for Cyprus, Greece and the EU, at the latest period published for both countries. */
export function DataBlock({ more = { to: "/compare/greece-cyprus", label: "Full comparison" }, title = "Data & insights" }: { more?: More; title?: string } = {}) {
  const q = useStatSeries(INDICATORS.map((i) => i.code));
  const cards = INDICATORS.map((ind) => {
    const ds = q.data?.datasets[ind.code];
    const obs = q.data?.obs[ind.code] ?? [];
    const period = ds ? latestCommonPeriod(obs.filter((o) => o.geo === "EL" || o.geo === "CY"), ["EL", "CY"]) : null;
    return { ind, ds, obs, period };
  }).filter((c) => c.ds && c.period);
  if (!cards.length) return null;
  return <section aria-labelledby="data" className="mt-12">
    <Heading id="data" more={more}>{title}</Heading>
    <div className="grid md:grid-cols-3 gap-5 mt-4">
      {cards.map(({ ind, ds, obs, period }) => <div key={ind.code} className="border border-border rounded-lg bg-card p-5">
        <h3 className="font-serif font-semibold text-lg">{ind.title}</h3>
        <p className="text-xs text-muted-foreground">{ind.unit} · {periodLabel(period!, "en")}</p>
        <dl className="grid grid-cols-3 gap-2 mt-3">
          {["CY", "EL", "EU27_2020"].map((g) => {
            const o = obs.find((x) => x.geo === g && x.period === period);
            return <div key={g}>
              <dt className="text-[11px] text-muted-foreground">{GEO_NAMES[g]?.en ?? g}</dt>
              <dd className="text-xl font-serif font-semibold">{formatValue(o?.value, ds!.unit_label, ds!.decimals, "en") ?? "—"}</dd>
            </div>;
          })}
        </dl>
        <p className="text-[11px] text-muted-foreground mt-3">
          Source: <a href={databrowserUrl(ds!.dataset_code)} target="_blank" rel="noopener noreferrer" className="underline">Eurostat {ds!.dataset_code}</a>
          {ds!.last_success_at && <> · Updated {format(new Date(ds!.last_success_at), "d MMM yyyy")}</>}
        </p>
      </div>)}
    </div>
  </section>;
}

