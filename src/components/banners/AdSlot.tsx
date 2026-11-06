import { useActiveBanner } from "@/hooks/useActiveBanner";

type AdSize = "leaderboard" | "banner" | "mrec" | "skyscraper" | "billboard";

interface AdSlotProps {
  size?: AdSize;
  label?: string;
  /** banner_placements.slot_id; defaults to the size key */
  slotId?: string;
}

const AD_SIZES: Record<AdSize, { w: string; h: string }> = {
  leaderboard: { w: "728px", h: "90px" },
  banner: { w: "468px", h: "60px" },
  mrec: { w: "300px", h: "250px" },
  skyscraper: { w: "160px", h: "600px" },
  billboard: { w: "970px", h: "250px" },
};

/** Renders a live banner, or nothing at all when the slot has no advertiser. */
export function AdSlot({ size = "leaderboard", slotId }: AdSlotProps) {
  const banner = useActiveBanner(slotId ?? size);
  if (!banner) return null;
  const spec = AD_SIZES[size];

  return (
    <div className="flex justify-center">
      <a
        href={banner.click_url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="relative block rounded-lg overflow-hidden"
        style={{ width: "100%", maxWidth: spec.w, height: spec.h }}
      >
        <img src={banner.image_url!} alt={banner.name} className="w-full h-full object-cover" loading="lazy" />
        <span className="absolute top-1 right-1 text-[8px] uppercase tracking-widest bg-background/80 text-muted-foreground px-1.5 rounded">
          Ad
        </span>
      </a>
    </div>
  );
}

/** Inline ad between content sections — collapses fully when unsold */
export function InlineAdSlot({ size = "leaderboard", slotId }: AdSlotProps) {
  const banner = useActiveBanner(slotId ?? size);
  if (!banner) return null;
  return (
    <div className="py-4">
      <div className="container mx-auto px-4">
        <AdSlot size={size} slotId={slotId} />
      </div>
    </div>
  );
}

/** Sidebar ads — 300×250 MREC, only when sold */
export function SidebarAdSlot() {
  return (
    <div className="space-y-4">
      <AdSlot size="mrec" slotId="mrec" />
      
    </div>
  );
}
