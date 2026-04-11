import { useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Building2,
  Landmark,
  Shield,
  AlertTriangle,
  Coins,
  Cpu,
  TrendingUp,
  Briefcase,
  Users,
  Globe,
  Newspaper,
  BookOpen,
  Scale,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Vertical {
  id: string;
  label: string;
  icon: typeof Building2;
  href: string;
  count: number;
  trending?: boolean;
}

const verticals: Vertical[] = [
  { id: "intelligence", label: "Intelligence", icon: Building2, href: "/", count: 24, trending: true },
  { id: "news", label: "News", icon: Newspaper, href: "/news", count: 32, trending: true },
  { id: "trade", label: "Trade", icon: TrendingUp, href: "/trade", count: 10, trending: true },
  { id: "compliance", label: "Compliance", icon: Shield, href: "/compliance", count: 18 },
  { id: "fintech", label: "FinTech", icon: Landmark, href: "/fintech", count: 12, trending: true },
  { id: "sme", label: "SME", icon: Briefcase, href: "/sme", count: 8 },
  { id: "directory", label: "Directory", icon: Users, href: "/directory", count: 150 },
  { id: "whoiswho", label: "Who's Who", icon: Globe, href: "/whoiswho", count: 45 },
  { id: "interviews", label: "Interviews", icon: BookOpen, href: "/interviews", count: 14 },
  { id: "risk", label: "Risk", icon: AlertTriangle, href: "/compliance#risk", count: 9 },
  { id: "funding", label: "EU Funding", icon: Coins, href: "/resources#funding", count: 7 },
  { id: "technology", label: "Technology", icon: Cpu, href: "/fintech#tech", count: 15 },
  { id: "regulatory", label: "Regulatory", icon: Scale, href: "/compliance#regulatory", count: 11 },
];

export function VerticalNavigator() {
  const navigate = useNavigate();
  const location = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href.split("#")[0]);
  };

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 200;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <nav className="border-b border-border bg-card relative">
      <div className="container mx-auto px-4">
        <div className="relative flex items-center">
          {/* Left scroll button */}
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 z-10 p-1 bg-gradient-to-r from-card via-card to-transparent pr-4 hidden md:flex items-center"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>

          <div
            ref={scrollRef}
            className="flex items-center gap-0 overflow-x-auto scrollbar-hide scroll-smooth md:mx-6"
          >
            {verticals.map((v) => {
              const active = isActive(v.href);
              return (
                <button
                  key={v.id}
                  onClick={() => navigate(v.href)}
                  className={`
                    relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2
                    ${active
                      ? "border-secondary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                    }
                  `}
                >
                  <v.icon className="h-3.5 w-3.5" />
                  <span className="tracking-wide uppercase text-[11px] font-semibold">{v.label}</span>
                  <span className="text-[10px] text-muted-foreground font-normal">{v.count}</span>
                  {v.trending && (
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right scroll button */}
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 z-10 p-1 bg-gradient-to-l from-card via-card to-transparent pl-4 hidden md:flex items-center"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </nav>
  );
}
