import { cn } from "@/lib/utils";

/**
 * BH monogram: navy B and H, the H's right leg rising as a light-blue arrow.
 * Drawn in code until the approved logo file is supplied.
 */
export function BhMark({ className, inverse = false }: { className?: string; inverse?: boolean }) {
  const ink = inverse ? "fill-primary-foreground" : "fill-foreground";
  return (
    <svg viewBox="0 0 52 48" className={cn("h-8 w-auto shrink-0", className)} role="img" aria-label="BH">
      {/* B */}
      <path
        className={ink}
        fillRule="evenodd"
        d="M3 8h13.5a7.5 7.5 0 0 1 5.6 12.5A8.6 8.6 0 0 1 17.5 40H3V8Zm6 5.5v6.5h7a3.25 3.25 0 0 0 0-6.5H9Zm0 12v9h8a4.5 4.5 0 0 0 0-9H9Z"
      />
      {/* H: left leg, crossbar, lower right leg */}
      <path className={ink} d="M28 8h6v32h-6zM34 22h6v6h-6zM40 25h6v15h-6z" />
      {/* Arrow: the right leg of the H shooting up */}
      <path className="fill-brand-sky" d="M40 25V15h-4.5L43 5l7.5 10H46v10z" />
    </svg>
  );
}
