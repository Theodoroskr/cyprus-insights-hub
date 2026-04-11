import { Badge } from "@/components/ui/badge";

interface LeaderboardAdSlotProps {
  variant?: "light" | "dark";
}

export function LeaderboardAdSlot({ variant = "light" }: LeaderboardAdSlotProps) {
  const isDark = variant === "dark";

  return (
    <div className={`py-5 ${isDark ? "bg-primary/5" : ""}`}>
      <div className="container mx-auto px-4 flex justify-center">
        <div className="relative w-full max-w-[728px] h-[90px] rounded-lg overflow-hidden border border-border/40 bg-card flex items-center justify-center hover:border-secondary/20 transition-colors">
          <div className="absolute inset-0 bg-gradient-to-r from-muted/30 via-transparent to-muted/30" />
          <div className="relative flex flex-col items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground/30 font-medium tracking-wide">
              728 × 90 — Leaderboard
            </span>
            <Badge
              variant="outline"
              className="text-[8px] tracking-[0.15em] uppercase text-muted-foreground/25 border-muted-foreground/10 font-normal px-2 py-0"
            >
              Advertisement
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
