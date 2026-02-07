import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, ExternalLink } from "lucide-react";

interface NativeAdCardProps {
  title: string;
  description: string;
  sponsor: string;
  ctaText?: string;
  onCtaClick?: () => void;
  variant?: "default" | "compact";
}

export function NativeAdCard({
  title,
  description,
  sponsor,
  ctaText = "Explore solution",
  onCtaClick,
  variant = "default",
}: NativeAdCardProps) {
  if (variant === "compact") {
    return (
      <div className="bento-card p-4 border-secondary/30 hover:border-secondary/50 transition-colors relative group">
        <Badge 
          variant="outline" 
          className="absolute top-2 right-2 text-[10px] text-muted-foreground border-muted-foreground/30"
        >
          Sponsored
        </Badge>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5 text-secondary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground text-sm mb-1">{title}</h4>
            <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
            <p className="text-[10px] text-secondary mt-2">by {sponsor}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bento-card p-6 border-secondary/30 hover:border-secondary/50 transition-colors relative group">
      <Badge 
        variant="outline" 
        className="absolute top-4 right-4 text-[10px] text-muted-foreground border-muted-foreground/30"
      >
        Sponsored
      </Badge>
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/5 flex items-center justify-center shrink-0">
          <Building2 className="h-7 w-7 text-secondary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-lg mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground mb-3">{description}</p>
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-secondary">Brought to you by {sponsor}</p>
            <Button
              size="sm"
              variant="outline"
              className="text-xs gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={onCtaClick}
            >
              {ctaText}
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
