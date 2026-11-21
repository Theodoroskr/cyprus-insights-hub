import { cn } from "@/lib/utils";
import bhIcon from "@/assets/bh-icon.png.asset.json";

/** The approved BHub Network icon: white BH with light-blue arrow on a navy square. */
export function BhMark({ className, inverse = false }: { className?: string; inverse?: boolean }) {
  return (
    <img
      src={bhIcon.url}
      alt="BHub Network"
      width={32}
      height={32}
      className={cn("h-8 w-auto aspect-square shrink-0 rounded-[6px]", inverse && "ring-1 ring-primary-foreground/30", className)}
    />
  );
}
