import { articleImage, storyImage } from "@/lib/fallbackImage";
import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { estimateReadingTime } from "@/lib/readingTime";
import { useHomepageStories } from "@/hooks/useHomepageStories";

interface MostReadItem {
  id: string;
  title: string;
  category: string;
  image?: string | null;
  view_count: number;
}

const verticalLabel = (v: string) => {
  const map: Record<string, string> = {
    compliance: "Compliance",
    fintech: "FinTech",
    sme: "SME",
    general: "Business",
    regtech: "RegTech",
  };
  return map[v] || v;
};

const fullDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";
const ago = (iso?: string | null) => (iso ? formatDistanceToNow(new Date(iso), { addSuffix: true }) : "");

/** Small uppercase topic label above a headline. */
function Kicker({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-sans font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-2">{children}</p>;
}

export function IntelligenceHub() {
  const { hub, latest } = useHomepageStories();
  const [mostRead, setMostRead] = useState<MostReadItem[]>([]);

  const featured = useMemo(() => hub.map((a: any) => ({
    id: a.id as string,
    title: (a.title || a.what_happened) as string,
    summary: (a.summary || a.what_happened || "") as string,
    image: storyImage(a.image_url, a.vertical, a.id, a.body_markdown),
    category: verticalLabel(a.vertical),
    publishedAt: a.published_at as string,
    readTime: estimateReadingTime(a.what_happened, a.why_it_matters, a.what_to_do, a.summary, a.body_markdown),
  })), [hub]);

  const [lead, ...secondary] = featured;

  useEffect(() => {
    supabase
      .rpc("get_most_read_articles", { _limit: 5 })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setMostRead(data.map((d: any) => ({
            id: d.article_id,
            title: d.title,
            category: verticalLabel(d.vertical),
            image: storyImage(d.image_url, d.vertical, d.article_id ?? d.id, d.body_markdown),
            view_count: Number(d.view_count),
          })));
        }
      });
  }, []);

  if (!lead && mostRead.length === 0) {
    return <p className="text-muted-foreground text-sm py-8 text-center">Loading intelligence briefings…</p>;
  }

  return (
    <section id="news" className="section-rule section-rule-thick">
      <div className="container mx-auto px-4">
        {/* Lead story — large photo with the headline beside it on a soft panel */}
        {lead && (
          <Link to={`/article/${lead.id}`} className="group grid md:grid-cols-12 gap-5 md:gap-8 bg-muted/50 p-4 md:p-6">
            <div className="md:col-span-7 overflow-hidden aspect-[16/10] bg-muted">
              <img
                src={lead.image}
                alt={lead.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </div>
            <div className="md:col-span-5 flex flex-col justify-center py-2">
              <Kicker>{lead.category}</Kicker>
              <h2 className="font-serif font-bold text-foreground text-2xl md:text-[2.15rem] leading-[1.15] mb-3 line-clamp-5 group-hover:text-secondary transition-colors">
                {lead.title}
              </h2>
              {lead.summary && <p className="text-muted-foreground text-base leading-relaxed mb-4 line-clamp-3">{lead.summary}</p>}
              <p className="text-sm text-foreground">By <span className="font-medium">BusinessHub Editorial</span></p>
              <p className="text-xs text-muted-foreground mt-0.5">{fullDate(lead.publishedAt)} · {lead.readTime}</p>
            </div>
          </Link>
        )}

        <div className="grid lg:grid-cols-12 gap-8 mt-8">
          {/* Three stories with topic labels */}
          <div className="lg:col-span-9 grid sm:grid-cols-3 gap-6 content-start">
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
                <h3 className="font-serif text-lg font-semibold text-foreground leading-snug mb-2 line-clamp-4 group-hover:text-secondary transition-colors">
                  {a.title}
                </h3>
                <p className="text-xs text-muted-foreground">{fullDate(a.publishedAt)}</p>
              </Link>
            ))}
          </div>

          {/* Latest — newest first, with how long ago each story was published */}
          <aside className="lg:col-span-3 lg:border-l border-border lg:pl-6">
            <h2 className="font-serif text-2xl font-bold text-foreground pb-2 border-b-2 border-foreground">Latest</h2>
            <ul className="divide-y divide-border" aria-label="Latest stories">
              {latest.map((a: any) => (
                <li key={a.id} className="py-3">
                  <Link to={`/article/${a.id}`} className="block font-serif text-[15px] font-semibold text-foreground leading-snug hover:text-secondary transition-colors line-clamp-3">
                    {a.title || a.what_happened}
                  </Link>
                  <time dateTime={a.published_at} title={fullDate(a.published_at)} className="text-xs text-muted-foreground">
                    {ago(a.published_at)}
                  </time>
                </li>
              ))}
            </ul>
            <Link to="/news" className="inline-flex items-center gap-1 mt-2 text-xs font-semibold uppercase tracking-wider text-secondary hover:gap-2 transition-all">
              All news <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            {mostRead.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center gap-2 pb-2 border-b border-border mb-1">
                  <Flame className="h-4 w-4 text-destructive" />
                  <span className="section-label">Most Read</span>
                </div>
                {mostRead.map((article, index) => (
                  <Link
                    to={`/article/${article.id}`}
                    key={article.id}
                    className="group flex items-start gap-3 py-3 border-b border-border last:border-b-0"
                  >
                    <span className="text-xl font-serif font-black text-muted-foreground/30 leading-none min-w-[1.25rem] text-right pt-0.5 group-hover:text-secondary transition-colors">
                      {index + 1}
                    </span>
                    <h3 className="flex-1 min-w-0 font-serif text-[13px] font-bold text-foreground leading-snug group-hover:text-secondary transition-colors line-clamp-3">
                      {article.title}
                    </h3>
                    <div className="w-14 h-14 flex-shrink-0 overflow-hidden">
                      <img src={articleImage(article.image, null, String(article.id))} alt="" className="w-full h-full object-cover" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
