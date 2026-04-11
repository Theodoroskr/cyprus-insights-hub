import { Badge } from "@/components/ui/badge";

type AdSize = "leaderboard" | "banner" | "mrec" | "skyscraper" | "billboard";

interface AdSlotProps {
  size?: AdSize;
  label?: string;
}

const AD_SIZES: Record<AdSize, { w: string; h: string; display: string }> = {
  leaderboard: { w: "728px", h: "90px", display: "728 × 90" },
  banner: { w: "468px", h: "60px", display: "468 × 60" },
  mrec: { w: "300px", h: "250px", display: "300 × 250" },
  skyscraper: { w: "160px", h: "600px", display: "160 × 600" },
  billboard: { w: "970px", h: "250px", display: "970 × 250" },
};

export function AdSlot({ size = "leaderboard", label }: AdSlotProps) {
  const spec = AD_SIZES[size];

  return (
    <div className="flex justify-center">
      <div
        className="relative rounded-lg overflow-hidden border border-dashed border-border/60 bg-muted/20 flex items-center justify-center hover:border-secondary/20 transition-colors"
        style={{ width: "100%", maxWidth: spec.w, height: spec.h }}
      >
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] text-muted-foreground/30 font-medium tracking-wide">
            {label || spec.display}
          </span>
          <Badge
            variant="outline"
            className="text-[8px] tracking-[0.15em] uppercase text-muted-foreground/20 border-muted-foreground/10 font-normal px-2 py-0"
          >
            Ad Space
          </Badge>
        </div>
      </div>
    </div>
  );
}

/** Inline ad that sits between content sections — full-width container */
export function InlineAdSlot({ size = "leaderboard", label }: AdSlotProps) {
  return (
    <div className="py-4">
      <div className="container mx-auto px-4">
        <AdSlot size={size} label={label} />
      </div>
    </div>
  );
}

/** Sticky sidebar ad — 300×250 MREC */
export function SidebarAdSlot() {
  return (
    <div className="space-y-4">
      <AdSlot size="mrec" label="300 × 250 — Sidebar" />
      <AdSlot size="mrec" label="300 × 250 — Sidebar 2" />
    </div>
  );
}
