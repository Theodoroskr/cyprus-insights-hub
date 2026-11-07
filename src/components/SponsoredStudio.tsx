import { useActiveBanner } from "@/hooks/useActiveBanner";
import { BannerPlaceholder } from "@/components/banners/AdSlot";
import { Badge } from "@/components/ui/badge";

export function SponsoredStudio() {
  const banner = useActiveBanner("custom-studio");

  return (
    <section aria-label="Custom Studio" className="py-4 border-y border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs font-bold uppercase text-muted-foreground">
            Custom Studio
          </span>
          <div className="flex-1 h-px bg-border" />
          <Badge variant="outline" className="text-[10px] uppercase text-muted-foreground font-normal">
            Sponsored
          </Badge>
        </div>
        {banner?.image_url ? (
        <a href={banner.click_url} target="_blank" rel="noopener noreferrer sponsored"
          className="block mx-auto w-full max-w-[970px] aspect-[970/250] overflow-hidden rounded-lg bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <img src={banner.image_url} alt={banner.name} loading="lazy" className="w-full h-full object-contain" />
        </a>
        ) : (
          <BannerPlaceholder size="billboard" label="Custom Studio — Advertise here" />
        )}
      </div>
    </section>
  );
}
