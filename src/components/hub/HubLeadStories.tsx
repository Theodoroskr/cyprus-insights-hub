import { ReactNode, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { storyImage } from "@/lib/fallbackImage";
import { estimateReadingTime } from "@/lib/readingTime";
import { useBlendedNews } from "@/hooks/useBlendedNews";
import { partitionHomepage } from "@/lib/homepageStories";
import { AdSlot } from "@/components/banners/AdSlot";
import { HUB_MID_SLOTS } from "@/components/hub/HubMasthead";
import type { BrandId } from "@/config/brands";

const verticalLabel = (v: string) =>
  ({ compliance: "Compliance", fintech: "FinTech", sme: "SME", general: "Business", regtech: "RegTech", tourism: "Tourism" } as Record<string, string>)[v] || v;
const fullDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";
const ago = (iso?: string | null) => (iso ? formatDistanceToNow(new Date(iso), { addSuffix: true }) : "");

function Kicker({ children }: { children: ReactNode }) {
  return <p className="text-[11px] font-sans font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-2">{children}</p>;
}

/** Fortune-style lead panel, three stories and a newest-first "Latest" column. Shared by the homepage and every hub. */
export function LeadStoriesView({ hub, latest, aside, below, allNewsHref = "/news" }: { hub: any[]; latest: any[]; aside?: ReactNode; below?: ReactNode; allNewsHref?: string }) {
  const featured = useMemo(() => hub.map((a) => ({
    id: a.id as string,
    title: (a.title || a.what_happened) as string,
    summary: (a.summary || a.what_happened || "") as string,
    image: storyImage(a.image_url, a.vertical, a.id, a.body_markdown),
    category: verticalLabel(a.vertical),
    publishedAt: a.published_at as string,
    readTime: estimateReadingTime(a.what_happened, a.why_it_matters, a.what_to_do, a.summary, a.body_markdown),
  })), [hub]);
  const [lead, ...secondary] = featured;
  if (!lead) return null;

  return (
    <>
      <Link to={`/article/${lead.id}`} className="group grid md:grid-cols-12 gap-5 md:gap-8 bg-muted/50 p-4 md:p-6">
        <div className="md:col-span-7 overflow-hidden aspect-[16/10] bg-muted">
          <img src={lead.image} alt={lead.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
        </div>
        <div className="md:col-span-5 flex flex-col justify-center py-2">
          <Kicker>{lead.category}</Kicker>
          <h2 className="font-serif font-bold text-foreground text-2xl md:text-[2.15rem] leading-[1.15] mb-3 line-clamp-5 group-hover:text-secondary transition-colors">{lead.title}</h2>
          {lead.summary && <p className="text-muted-foreground text-base leading-relaxed mb-4 line-clamp-3">{lead.summary}</p>}
          <p className="text-sm text-foreground">By <span className="font-medium">BusinessHub Editorial</span></p>
          <p className="text-xs text-muted-foreground mt-0.5">{fullDate(lead.publishedAt)} · {lead.readTime}</p>
        </div>
      </Link>

      <div className="grid lg:grid-cols-12 gap-8 mt-8">
        <div className="lg:col-span-9">
        <div className="grid sm:grid-cols-3 gap-6 content-start">
          {secondary.map((a, idx) => (
            <Link to={`/article/${a.id}`} key={a.id} className="group block">
              <div className="overflow-hidden aspect-[4/3] bg-muted mb-3">
                <img src={a.image} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
              </div>
              <div className="flex items-center gap-2">
                <Kicker>{a.category}</Kicker>
                {idx === 0 && (
                  <span className="mb-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-secondary">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary inline-block" /> Premium
                  </span>
                )}
              </div>
              <h3 className="font-serif text-lg font-semibold text-foreground leading-snug mb-2 line-clamp-4 group-hover:text-secondary transition-colors">{a.title}</h3>
              <p className="text-xs text-muted-foreground">{fullDate(a.publishedAt)}</p>
            </Link>
          ))}
        </div>
        {below}
        </div>

        <aside className="lg:col-span-3 lg:border-l border-border lg:pl-6">
          <h2 className="font-serif text-2xl font-bold text-foreground pb-2 border-b-2 border-foreground">Latest</h2>
          <ul className="divide-y divide-border" aria-label="Latest stories">
            {latest.map((a) => (
              <li key={a.id} className="py-3">
                <Link to={`/article/${a.id}`} className="block font-serif text-[15px] font-semibold text-foreground leading-snug hover:text-secondary transition-colors line-clamp-3">
                  {a.title || a.what_happened}
                </Link>
                <time dateTime={a.published_at} title={fullDate(a.published_at)} className="text-xs text-muted-foreground">{ago(a.published_at)}</time>
              </li>
            ))}
          </ul>
          <Link to={allNewsHref} className="inline-flex items-center gap-1 mt-2 text-xs font-semibold uppercase tracking-wider text-secondary hover:gap-2 transition-all">
            All news <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          {aside}
        </aside>
      </div>
    </>
  );
}

/** A hub's own lead story and Latest column, from its news verticals only. */
export function HubLeadStories({ verticals, brand, allNewsHref }: { verticals: string[]; brand: BrandId; allNewsHref?: string }) {
  const { data = [] } = useBlendedNews(verticals);
  const { hub, latest, feed } = useMemo(() => partitionHomepage(data), [data]);
  const slot = HUB_MID_SLOTS[brand];
  if (hub.length === 0) return slot ? <div className="container mx-auto px-4 py-6"><AdSlot size="leaderboard" slotId={slot} /></div> : null;
  return (
    <section className="section-rule">
      <div className="container mx-auto px-4">
        <LeadStoriesView hub={hub} latest={latest} allNewsHref={allNewsHref} below={
          <>
            <MoreStories items={feed.slice(0, 4)} />
            {slot && <div className="mt-8"><AdSlot size="leaderboard" slotId={slot} /></div>}
          </>
        } />
      </div>
    </section>
  );
}

/** Compact two-column list that fills the space under the three lead cards. */
export function MoreStories({ items, heading = "More stories" }: { items: any[]; heading?: string }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-8 pt-4 border-t border-border">
      <h3 className="section-label mb-3">{heading}</h3>
      <div className="grid sm:grid-cols-2 gap-x-6 divide-y sm:divide-y-0 divide-border">
        {items.map((a) => (
          <Link key={a.id} to={`/article/${a.id}`} className="group flex gap-3 py-3 sm:border-b border-border">
            <div className="w-24 h-16 shrink-0 overflow-hidden bg-muted">
              <img src={storyImage(a.image_url, a.vertical, a.id, a.body_markdown)} alt="" className="w-full h-full object-cover" loading="lazy" />
            </div>
            <div className="min-w-0">
              <Kicker>{verticalLabel(a.vertical)}</Kicker>
              <p className="font-serif text-[15px] font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-secondary transition-colors">{a.title || a.what_happened}</p>
              <time dateTime={a.published_at} className="text-xs text-muted-foreground">{ago(a.published_at)}</time>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
