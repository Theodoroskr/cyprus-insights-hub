import { useActiveBanner } from "@/hooks/useActiveBanner";

type AdSize = "leaderboard" | "banner" | "mrec" | "skyscraper" | "billboard";

interface AdSlotProps {
  size?: AdSize;
  label?: string;
  /** banner_placements.slot_id; defaults to the size key */
  slotId?: string;
}

const AD_SIZES: Record<AdSize, string> = {
  leaderboard: "max-w-[728px] aspect-[728/90]",
  banner: "max-w-[468px] aspect-[468/60]",
  mrec: "max-w-[300px] aspect-[300/250]",
  skyscraper: "max-w-[160px] aspect-[160/600]",
  billboard: "max-w-[970px] aspect-[970/250]",
};

/** Renders a live banner, or nothing at all when the slot has no advertiser. */
export function AdSlot({ size = "leaderboard", slotId }: AdSlotProps) {
  const banner = useActiveBanner(slotId ?? size);
  if (!banner?.image_url) return null;
  const spec = AD_SIZES[size];

  return (
    <div className="flex justify-center" data-banner-slot={slotId ?? size}>
      <a
        href={banner.click_url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className={`relative block w-full rounded-lg overflow-hidden bg-muted ${spec}`}
      >
        <img src={banner.image_url} alt={banner.name} className="w-full h-full object-contain" loading="lazy" />
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
