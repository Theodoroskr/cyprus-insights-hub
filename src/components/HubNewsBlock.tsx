import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Flame, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useBlendedNews } from "@/hooks/useBlendedNews";
import { storyImage } from "@/lib/fallbackImage";
import { estimateReadingTime } from "@/lib/readingTime";

const LABEL: Record<string, string> = { compliance: "Compliance", fintech: "FinTech", regtech: "RegTech", tourism: "Tourism", sme: "SME", general: "Business" };

interface Props {
  /** Section shown in headings, e.g. "Compliance". */
  title: string;
  verticals: string[];
  /** NewsListPage hub key for the "More news" link. */
  hubKey: string;
  /** Tailwind text colour class for the section accent, e.g. "text-regtech". */
  accent?: string;
}

/** Homepage-style news block for a sub hub: lead, four stories, most read, then a six-story feed. */
export function HubNewsBlock({ title, verticals, hubKey, accent = "text-secondary" }: Props) {
  const { data: stories = [] } = useBlendedNews(verticals);
  const [mostRead, setMostRead] = useState<any[]>([]);

  useEffect(() => {
    supabase.rpc("get_most_read_articles", { _limit: 40 }).then(({ data }) => {
      setMostRead((data ?? []).filter((d: any) => verticals.includes(d.vertical)).slice(0, 5));
    });
  }, [verticals.join(",")]);

  const items = useMemo(() => stories.map((a: any) => ({
    id: a.id,
    title: a.title || a.what_happened,
    summary: a.summary || a.what_happened || "",
    image: storyImage(a.image_url, a.vertical, a.id, a.body_markdown),
    label: LABEL[a.vertical] ?? a.vertical,
    date: a.published_at ? formatDistanceToNow(new Date(a.published_at), { addSuffix: true }) : "",
    readTime: estimateReadingTime(a.what_happened, a.why_it_matters, a.what_to_do, a.summary, a.body_markdown),
  })), [stories]);

  if (!items.length) return null;
  const [lead, ...rest] = items;
  const secondary = rest.slice(0, 4);
  const feed = rest.slice(4, 10);
  const sideList = mostRead.length
    ? mostRead.map((d) => ({ id: d.article_id, title: d.title, label: LABEL[d.vertical] ?? d.vertical, image: storyImage(d.image_url, d.vertical, d.article_id) }))
    : rest.slice(10, 15);

  return (
    <section className="section-rule section-rule-thick">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <span className={`section-label ${accent}`}>Latest {title} Intelligence</span>
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">Live updates</span>
        </div>

        <div className="grid lg:grid-cols-12 gap-0">
          <div className="lg:col-span-5 lg:pr-6 lg:border-r border-border pb-6 lg:pb-0">
            <Link to={`/article/${lead.id}`} className="block group">
              <div className="relative overflow-hidden mb-4">
                <img src={lead.image} alt={lead.title} className="w-full h-64 md:h-80 object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                <Badge className="absolute top-3 left-3 bg-foreground text-background rounded-none text-[10px] uppercase tracking-wider">{lead.label}</Badge>
              </div>
              <h3 className="text-2xl md:text-3xl font-serif font-bold text-foreground leading-tight mb-3 line-clamp-4 group-hover:text-secondary transition-colors">{lead.title}</h3>
              <p className="article-body text-base mb-3 line-clamp-3">{lead.summary}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{lead.date}</span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span>{lead.readTime}</span>
              </div>
            </Link>
          </div>

          <div className="lg:col-span-4 lg:px-6 lg:border-r border-border py-6 lg:py-0 border-t lg:border-t-0">
            <div className="divide-y divide-border">
              {secondary.map((a) => (
                <Link to={`/article/${a.id}`} key={a.id} className="block py-4 first:pt-0 group">
                  <Badge variant="outline" className="rounded-none text-[10px] uppercase tracking-wider mb-2 border-muted-foreground/30">{a.label}</Badge>
                  <h4 className="font-serif text-lg font-bold text-foreground leading-snug mb-2 line-clamp-3 group-hover:text-secondary transition-colors">{a.title}</h4>
                  <p className="article-body text-sm line-clamp-2 mb-2">{a.summary}</p>
                  <div className="text-xs text-muted-foreground">{a.date} · {a.readTime}</div>
                </Link>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3 lg:pl-6 pt-6 lg:pt-0 border-t lg:border-t-0">
            <div className="flex items-center gap-2 mb-5">
              <Flame className="h-4 w-4 text-destructive" />
              <span className="section-label">Most read in {title}</span>
            </div>
            {sideList.map((a, i) => (
              <Link to={`/article/${a.id}`} key={a.id} className="group flex items-start gap-3 py-3 border-b border-border last:border-b-0">
                <span className="text-2xl font-serif font-black text-muted-foreground/15 leading-none min-w-[1.5rem] text-right pt-1 group-hover:text-secondary">{i + 1}</span>
                <h5 className="flex-1 font-serif text-[13px] font-bold text-foreground leading-snug line-clamp-3 group-hover:text-secondary">{a.title}</h5>
                <img src={a.image} alt="" className="w-[72px] h-[72px] flex-shrink-0 rounded object-cover" />
              </Link>
            ))}
          </div>
        </div>

        {feed.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10 pt-8 border-t border-border">
            {feed.map((a) => (
              <Link to={`/article/${a.id}`} key={a.id} className="group block">
                <div className="relative overflow-hidden aspect-video mb-3">
                  <img src={a.image} alt={a.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <Badge variant="outline" className="rounded-none text-[10px] uppercase tracking-wider mb-2">{a.label}</Badge>
                <h4 className="font-serif text-base font-bold text-foreground leading-snug line-clamp-3 group-hover:text-secondary transition-colors">{a.title}</h4>
                <div className="text-xs text-muted-foreground mt-1">{a.date}</div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-6 text-right">
          <Link to={`/news?hub=${hubKey}`} className={`inline-flex items-center gap-1 text-sm font-semibold ${accent} hover:underline`}>
            More {title} news <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
