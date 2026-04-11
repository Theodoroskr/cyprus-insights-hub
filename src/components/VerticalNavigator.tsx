import { useNavigate, useLocation } from "react-router-dom";
import {
  Building2,
  Landmark,
  Shield,
  AlertTriangle,
  Coins,
  Cpu,
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
  { id: "compliance", label: "Compliance", icon: Shield, href: "/compliance", count: 18 },
  { id: "fintech", label: "FinTech", icon: Landmark, href: "/fintech", count: 12, trending: true },
  { id: "risk", label: "Risk", icon: AlertTriangle, href: "/compliance#risk", count: 9 },
  { id: "funding", label: "EU Funding", icon: Coins, href: "/resources#funding", count: 7 },
  { id: "technology", label: "Technology", icon: Cpu, href: "/fintech#tech", count: 15 },
];

export function VerticalNavigator() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href.split("#")[0]);
  };

  return (
    <nav className="border-b border-border bg-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide">
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
      </div>
    </nav>
  );
}
