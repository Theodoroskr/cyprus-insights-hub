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

const DIMENSIONS: Record<AdSize, string> = {
  leaderboard: "728×90", banner: "468×60", mrec: "300×250", skyscraper: "160×600", billboard: "970×250",
};

/** Homepage slots show a labelled placeholder while unsold. */
export const PLACEHOLDER_SLOTS = new Set(["custom-studio", "homepage-stories", "homepage-footer", "homepage-top", "homepage-feed-top", "homepage-mid"]);

export function BannerPlaceholder({ size, label }: { size: AdSize; label?: string }) {
  const compact = size === "leaderboard" || size === "banner";
  return (
    <div className="flex justify-center">
      <a
        href="mailto:advertise@businesshub.cy?subject=Banner%20enquiry"
        className={`w-full ${AD_SIZES[size]} rounded-lg border-2 border-dashed border-border bg-muted/50 flex ${compact ? "flex-row gap-3" : "flex-col gap-1"} items-center justify-center text-center text-muted-foreground hover:border-primary hover:text-foreground transition-colors`}
      >
        <span className="text-[10px] uppercase tracking-widest">{label ?? "Advertise here"}</span>
        <span className="text-xs">{DIMENSIONS[size]}</span>
        <span className="text-xs font-semibold text-primary">Partner with us →</span>
      </a>
    </div>
  );
}

/** Renders a live banner; homepage slots show a placeholder, others render nothing. */
export function AdSlot({ size = "leaderboard", slotId, label }: AdSlotProps) {
  const banner = useActiveBanner(slotId ?? size);
  if (!banner?.image_url) {
    return slotId && PLACEHOLDER_SLOTS.has(slotId) ? <BannerPlaceholder size={size} label={label} /> : null;
  }
  const spec = AD_SIZES[size];
  // House banners link to our own pages ("/economy") and open in the same tab.
  const internal = banner.click_url.startsWith("/");

  return (
    <div className="flex justify-center" data-banner-slot={slotId ?? size}>
      <a
        href={banner.click_url}
        {...(internal ? {} : { target: "_blank", rel: "noopener noreferrer sponsored" })}
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
