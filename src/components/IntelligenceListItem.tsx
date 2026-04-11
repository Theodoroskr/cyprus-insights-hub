import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Zap, Target, Lightbulb, Bookmark, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { estimateReadingTime } from "@/lib/readingTime";

interface IntelligenceListItemProps {
  category: string;
  date: string;
  whatHappened: string;
  whyItMatters: string;
  whatToDo: string;
  hub?: "businesshub" | "fintechhub" | "compliancehub";
  imageUrl?: string | null;
  linkedPerson?: {
    name: string;
    title: string;
    image: string;
  };
  href?: string;
  articleId?: string;
  isLead?: boolean;
  bodyMarkdown?: string | null;
  tags?: string[] | null;
}

const ORIGIN_KEYWORDS: Record<string, { label: string; className: string }> = {
  cyprus: { label: "Cyprus", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
  eu: { label: "EU", className: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20" },
  global: { label: "Global", className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20" },
};

function getOriginTags(tags: string[] | null | undefined, title: string): { label: string; className: string }[] {
  const text = `${(tags || []).join(" ")} ${title}`.toLowerCase();
  const results: { label: string; className: string }[] = [];
  if (text.includes("cyprus") || text.includes("cypriot") || text.includes("nicosia") || text.includes("limassol") || text.includes("cysec") || text.includes("cbcyprus"))
    results.push(ORIGIN_KEYWORDS.cyprus);
  if (text.includes("eu ") || text.includes("european") || text.includes("brussels") || text.includes("directive") || text.includes("mica") || text.includes("psd") || text.includes("amla"))
    results.push(ORIGIN_KEYWORDS.eu);
  if (text.includes("global") || text.includes("international") || text.includes("world") || text.includes("imf") || text.includes("oecd") || text.includes("fatf"))
    results.push(ORIGIN_KEYWORDS.global);
  return results;
}

const hubColors: Record<string, { badge: string; accent: string; border: string }> = {
  businesshub: { badge: "bg-secondary/15 text-secondary border-secondary/20", accent: "text-secondary", border: "group-hover:border-l-secondary" },
  fintechhub: { badge: "bg-fintech/15 text-fintech border-fintech/20", accent: "text-fintech", border: "group-hover:border-l-fintech" },
  compliancehub: { badge: "bg-compliance/15 text-compliance border-compliance/20", accent: "text-compliance", border: "group-hover:border-l-compliance" },
};

export function IntelligenceListItem({
  category,
  date,
  whatHappened,
  whyItMatters,
  whatToDo,
  hub = "businesshub",
  imageUrl,
  linkedPerson,
  href = "#",
  articleId,
  isLead = false,
  bodyMarkdown,
  tags,
}: IntelligenceListItemProps) {
  const originTags = getOriginTags(tags, whatHappened);
  const readTime = estimateReadingTime(whatHappened, whyItMatters, whatToDo, bodyMarkdown);
  const colors = hubColors[hub];
  const itemId = articleId || category + date;
  const { user } = useAuth();
  const [bookmarked, setBookmarked] = useState(false);
  const navigate = useNavigate();

  const toggleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    if (bookmarked) {
      await supabase.from("saved_items").delete().match({ user_id: user.id, item_type: "article", item_id: itemId });
    } else {
      await supabase.from("saved_items").insert({ user_id: user.id, item_type: "article", item_id: itemId, item_title: whatHappened.slice(0, 80) });
    }
    setBookmarked(!bookmarked);
  };

  const handleClick = () => {
    if (href && href !== "#") navigate(href);
  };

  const fallbackImage = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&q=80";

  if (isLead) {
    return (
      <article className="group pb-6 mb-6 border-b border-border cursor-pointer" onClick={handleClick}>
        {/* Large hero image */}
        <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden mb-5">
          <img
            src={imageUrl || fallbackImage}
            alt={whatHappened}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-primary/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className={`text-[10px] font-semibold backdrop-blur-sm bg-background/20 border-white/30 text-white`}>
                {category}
              </Badge>
              <span className="text-xs text-white/80">{date}</span>
              <span className="text-xs text-white/60 flex items-center gap-1"><Clock className="h-3 w-3" />{readTime}</span>
            </div>
            <h3 className="font-serif font-bold text-2xl md:text-3xl text-white leading-tight mb-2 drop-shadow-lg">
              {whatHappened}
            </h3>
          </div>
        </div>

        {/* Content below image */}
        <p className="text-base text-muted-foreground leading-relaxed mb-4 line-clamp-3">
          {whyItMatters}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {linkedPerson && (
              <div className="flex items-center gap-2">
                <img
                  src={linkedPerson.image}
                  alt={linkedPerson.name}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-border"
                />
                <div>
                  <span className="text-xs font-medium text-foreground">{linkedPerson.name}</span>
                  <span className="text-[10px] text-muted-foreground ml-1">· {linkedPerson.title}</span>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider font-semibold">
              <span className="flex items-center gap-1 text-secondary">
                <Zap className="h-3 w-3" /> What
              </span>
              <span className="flex items-center gap-1 text-destructive">
                <Target className="h-3 w-3" /> Why
              </span>
              <span className="flex items-center gap-1 text-success">
                <Lightbulb className="h-3 w-3" /> Action
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <button onClick={toggleBookmark} className="text-muted-foreground hover:text-secondary transition-colors">
                <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-secondary text-secondary" : ""}`} />
              </button>
            )}
            <span className={`inline-flex items-center gap-1 text-sm font-medium ${colors.accent} hover:opacity-80 transition-opacity group/link`}>
              Read full analysis
              <ArrowRight className="h-3.5 w-3.5 group-hover/link:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className={`group flex gap-5 py-5 border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors px-2 -mx-2 rounded-lg cursor-pointer`} onClick={handleClick}>
      {/* Image — left side */}
      <div className="flex-shrink-0 w-[200px] h-[140px] rounded-lg overflow-hidden relative">
        <img
          src={imageUrl || fallbackImage}
          alt={whatHappened}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-transparent group-hover:bg-primary/5 transition-colors" />
      </div>

      {/* Content — right side */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        {/* Top: category + date + bookmark */}
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className={`text-[10px] font-semibold whitespace-nowrap shrink-0 ${colors.badge}`}>
            {category}
          </Badge>
          <span className="text-xs text-muted-foreground">{date}</span>
          <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{readTime}</span>
          <div className="flex-1" />
          {user && (
            <button onClick={toggleBookmark} className="text-muted-foreground hover:text-secondary transition-colors opacity-0 group-hover:opacity-100">
              <Bookmark className={`h-3.5 w-3.5 ${bookmarked ? "fill-secondary text-secondary" : ""}`} />
            </button>
          )}
        </div>

        {/* Headline */}
        <h3 className="font-serif font-bold text-base text-foreground leading-snug mb-2 group-hover:text-secondary transition-colors line-clamp-2">
          {whatHappened}
        </h3>

        {/* Why it matters — as the description */}
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-3">
          {whyItMatters}
        </p>

        {/* Bottom: person + action items */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {linkedPerson && (
              <div className="flex items-center gap-2">
                <img
                  src={linkedPerson.image}
                  alt={linkedPerson.name}
                  className="w-6 h-6 rounded-full object-cover ring-1 ring-border"
                />
                <span className="text-xs text-muted-foreground">{linkedPerson.name}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider font-semibold">
              <span className="flex items-center gap-1 text-secondary">
                <Zap className="h-3 w-3" /> What
              </span>
              <span className="flex items-center gap-1 text-destructive">
                <Target className="h-3 w-3" /> Why
              </span>
              <span className="flex items-center gap-1 text-success">
                <Lightbulb className="h-3 w-3" /> Action
              </span>
            </div>
          </div>

          <span className={`inline-flex items-center gap-1 text-xs font-medium ${colors.accent} hover:opacity-80 transition-opacity group/link opacity-0 group-hover:opacity-100`}>
            Read full analysis
            <ArrowRight className="h-3 w-3 group-hover/link:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </article>
  );
}
