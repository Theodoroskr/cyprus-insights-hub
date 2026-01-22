import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LeaderboardBannerProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  onCtaClick?: () => void;
}

export function LeaderboardBanner({
  title = "Your Trusted Partner for EU Market Entry",
  subtitle = "Expert advisory services for fintech licensing and regulatory compliance",
  ctaText = "Learn More",
  onCtaClick,
}: LeaderboardBannerProps) {
  return (
    <div className="w-full bg-primary py-3 px-4">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5 text-secondary" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <span className="text-primary-foreground font-medium text-sm">
              {title}
            </span>
            <span className="text-primary-foreground/70 text-xs hidden md:block">
              {subtitle}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-primary-foreground/50 uppercase tracking-wider hidden sm:block">
            Advertisement
          </span>
          <Button
            size="sm"
            variant="secondary"
            className="text-xs"
            onClick={onCtaClick}
          >
            {ctaText}
          </Button>
        </div>
      </div>
    </div>
  );
}
