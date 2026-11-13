import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Calendar } from "lucide-react";
import { AdSlot } from "@/components/banners/AdSlot";
import { brands, type BrandId } from "@/config/brands";

/** Each hub front page's own top banner place (half the width of the homepage billboard). */
export const HUB_TOP_SLOTS: Partial<Record<BrandId, string>> = {
  fintechhub: "fintech-top",
  compliancehub: "compliance-top",
  regtechhub: "regtech-top",
  tourismhub: "tourism-top",
};

const ACCENT: Partial<Record<BrandId, { text: string; bg: string }>> = {
  fintechhub: { text: "text-fintech", bg: "bg-fintech" },
  compliancehub: { text: "text-compliance", bg: "bg-compliance" },
  regtechhub: { text: "text-regtech", bg: "bg-regtech" },
  tourismhub: { text: "text-tourism", bg: "bg-tourism" },
};

export interface HubQuickLink { label: string; href: string }

/** The shared hub front-page top: banner, hub name, introduction and key links. */
export function HubMasthead({ brand, kicker, intro, links = [], extra }: {
  brand: BrandId; kicker: string; intro?: string; links?: HubQuickLink[]; extra?: ReactNode;
}) {
  const b = brands[brand];
  const accent = ACCENT[brand] ?? { text: "text-secondary", bg: "bg-foreground" };
  const slot = HUB_TOP_SLOTS[brand];
  const date = new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  return (
    <div>
      {slot && <div className="py-5"><AdSlot size="half-billboard" slotId={slot} /></div>}
      <div className={`h-[3px] ${accent.bg}`} />
      <div className="py-6 text-center border-b border-border">
        <p className={`section-label mb-2 ${accent.text}`}>{kicker}</p>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground font-serif tracking-tight">
          {b.name}<span className={accent.text}>{b.domain}</span>
        </h1>
        {intro && <p className="text-sm text-muted-foreground mt-2 max-w-2xl mx-auto">{intro}</p>}
        <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" />{date}</span>
          <span className="w-1 h-1 rounded-full bg-border" />
          <span>Cyprus Edition</span>
        </div>
        {extra && <div className="mt-3 flex justify-center">{extra}</div>}
        {links.length > 0 && (
          <nav aria-label={`${b.name} key links`} className="mt-4 flex flex-wrap justify-center gap-2">
            {links.map((l) => (
              <Link key={l.href} to={l.href} className="px-3 py-1 border border-border text-[11px] font-semibold uppercase tracking-wider text-foreground hover:border-foreground transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
