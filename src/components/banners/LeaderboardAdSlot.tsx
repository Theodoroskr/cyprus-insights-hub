import { useActiveBanner } from "@/hooks/useActiveBanner";
import { AdSlot, PLACEHOLDER_SLOTS } from "@/components/banners/AdSlot";

interface LeaderboardAdSlotProps {
  variant?: "light" | "dark";
  slotId?: string;
}

/** 728×90 leaderboard — renders nothing when no live banner is booked. */
export function LeaderboardAdSlot({ variant = "light", slotId = "leaderboard" }: LeaderboardAdSlotProps) {
  const banner = useActiveBanner(slotId);
  if (!banner && !PLACEHOLDER_SLOTS.has(slotId)) return null;
  return (
    <div className={`py-5 ${variant === "dark" ? "bg-primary/5" : ""}`}>
      <div className="container mx-auto px-4">
        <AdSlot size="leaderboard" slotId={slotId} />
      </div>
    </div>
  );
}
