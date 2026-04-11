import { Building2 } from "lucide-react";

interface PartnerStripProps {
  title?: string;
  partners?: { name: string; logo?: string }[];
}

export function PartnerStrip({
  title = "Our Partners",
  partners,
}: PartnerStripProps) {
  // Don't render if no real partners are provided
  if (!partners || partners.length === 0) return null;

  return (
    <div className="w-full py-8 bg-muted/30 border-y border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            {title}
          </span>
          <span className="text-[10px] text-muted-foreground/50">•</span>
          <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">
            Advertisement
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
          {partners.map((partner, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background/50 border border-border/50 hover:border-secondary/30 transition-colors cursor-pointer group"
            >
              {partner.logo ? (
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="h-6 w-auto grayscale group-hover:grayscale-0 transition-all"
                />
              ) : (
                <>
                  <Building2 className="h-4 w-4 text-muted-foreground group-hover:text-secondary transition-colors" />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    {partner.name}
                  </span>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
