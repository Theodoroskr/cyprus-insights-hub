import { useNavigate, useLocation } from "react-router-dom";
import {
  Building2,
  Landmark,
  Shield,
  TrendingUp,
  Coins,
  AlertTriangle,
  Cpu,
  ArrowRight,
} from "lucide-react";

interface Vertical {
  id: string;
  label: string;
  icon: typeof Building2;
  href: string;
  color: string;
  bgColor: string;
  borderColor: string;
  count: number;
  trending?: boolean;
}

const verticals: Vertical[] = [
  {
    id: "intelligence",
    label: "Intelligence",
    icon: Building2,
    href: "/",
    color: "text-secondary",
    bgColor: "bg-secondary/10",
    borderColor: "border-secondary/30",
    count: 24,
    trending: true,
  },
  {
    id: "compliance",
    label: "Compliance",
    icon: Shield,
    href: "/compliance",
    color: "text-compliance",
    bgColor: "bg-compliance/10",
    borderColor: "border-compliance/30",
    count: 18,
  },
  {
    id: "fintech",
    label: "FinTech",
    icon: Landmark,
    href: "/fintech",
    color: "text-fintech",
    bgColor: "bg-fintech/10",
    borderColor: "border-fintech/30",
    count: 12,
    trending: true,
  },
  {
    id: "risk",
    label: "Risk",
    icon: AlertTriangle,
    href: "/compliance#risk",
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    borderColor: "border-destructive/30",
    count: 9,
  },
  {
    id: "funding",
    label: "EU Funding",
    icon: Coins,
    href: "/resources#funding",
    color: "text-success",
    bgColor: "bg-success/10",
    borderColor: "border-success/30",
    count: 7,
  },
  {
    id: "technology",
    label: "Technology",
    icon: Cpu,
    href: "/fintech#tech",
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/30",
    count: 15,
  },
];

export function VerticalNavigator() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href.split("#")[0]);
  };

  return (
    <section className="py-6 border-b border-border bg-card/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="h-4 w-4 text-secondary" />
          <h2 className="text-sm font-semibold text-foreground tracking-wide uppercase">
            Explore Verticals
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {verticals.map((v) => {
            const active = isActive(v.href);
            return (
              <button
                key={v.id}
                onClick={() => navigate(v.href)}
                className={`
                  relative flex flex-col items-center gap-2.5 p-4 rounded-xl border transition-all duration-200
                  ${active
                    ? `${v.borderColor} ${v.bgColor} shadow-sm`
                    : "border-border hover:border-secondary/20 hover:bg-muted/50"
                  }
                `}
              >
                {/* Trending dot */}
                {v.trending && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-secondary animate-pulse" />
                )}

                <div className={`w-10 h-10 rounded-lg ${v.bgColor} flex items-center justify-center`}>
                  <v.icon className={`h-5 w-5 ${v.color}`} />
                </div>

                <div className="text-center">
                  <p className={`text-xs font-semibold ${active ? v.color : "text-foreground"}`}>
                    {v.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {v.count} articles
                  </p>
                </div>

                {active && (
                  <ArrowRight className={`h-3 w-3 ${v.color} absolute bottom-2 right-2`} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
