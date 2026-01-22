import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Users, ArrowRight } from "lucide-react";

interface SidebarBannerProps {
  title?: string;
  description?: string;
  ctaText?: string;
  onCtaClick?: () => void;
  variant?: "advisors" | "services" | "network";
}

export function SidebarBanner({
  title = "Featured Advisors",
  description = "Connect with top industry advisors specializing in Cyprus fintech regulations",
  ctaText = "View Advisors",
  onCtaClick,
  variant = "advisors",
}: SidebarBannerProps) {
  const icons = {
    advisors: Users,
    services: Building2,
    network: Users,
  };
  
  const Icon = icons[variant];

  return (
    <div className="bento-card p-4 border-secondary/20 hover:border-secondary/40 transition-colors relative overflow-hidden">
      <Badge 
        variant="outline" 
        className="absolute top-3 right-3 text-[9px] text-muted-foreground/60 border-muted-foreground/20"
      >
        Ad
      </Badge>
      
      {/* Background decoration */}
      <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-secondary/5 rounded-full blur-2xl" />
      
      <div className="relative">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/5 flex items-center justify-center mb-3">
          <Icon className="h-6 w-6 text-secondary" />
        </div>
        
        <h4 className="font-semibold text-foreground text-sm mb-2">{title}</h4>
        <p className="text-xs text-muted-foreground mb-4 line-clamp-3">{description}</p>
        
        <Button
          size="sm"
          variant="outline"
          className="w-full text-xs gap-1 group"
          onClick={onCtaClick}
        >
          {ctaText}
          <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
        </Button>
      </div>
    </div>
  );
}
