import { cn } from "@/lib/utils";

/**
 * BH monogram traced from the approved BHub Network icon: bold B whose two
 * counters join along the stem, tall H, and a light-blue arrow inside the
 * H's crossbar (which has a rounded left end).
 */
export function BhMark({ className, inverse = false }: { className?: string; inverse?: boolean }) {
  const ink = inverse ? "fill-primary-foreground" : "fill-foreground";
  return (
    <svg viewBox="0 0 84 52.4" className={cn("h-8 w-auto shrink-0", className)} role="img" aria-label="BH">
      {/* B */}
      <path
        className={ink}
        fillRule="evenodd"
        d="M0 0H19.5C30 0 36.8 5.5 36.8 15C36.8 19.8 34 23.6 29.5 25.5C35 27.4 38.5 32 38.5 38.2C38.5 47 31.5 52.4 20.5 52.4H0Z M10.2 8H19.5C24 8 27 10.6 27 15C27 19 24 21.9 19.5 21.9H14.2V29.2H20.5C25 29.2 28.2 32.3 28.2 37C28.2 41.4 24.8 44.4 20.5 44.4H10.2Z"
      />
      {/* H: left leg, right leg, crossbar with rounded left end */}
      <path
        className={ink}
        d="M41.6 0H52.1V52.4H41.6Z M73.4 0H84V52.4H73.4Z M61.6 21.4H73.4V29.5H55.6V27.4A6 6 0 0 1 61.6 21.4Z"
      />
      {/* Arrow inside the crossbar */}
      <path
        className="stroke-brand-sky"
        fill="none"
        strokeWidth="1.7"
        strokeLinecap="square"
        strokeLinejoin="miter"
        d="M58.6 25.5H67.2M64.4 22.7L67.2 25.5L64.4 28.3"
      />
    </svg>
  );
}
