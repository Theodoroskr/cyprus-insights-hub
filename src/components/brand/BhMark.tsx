import { cn } from "@/lib/utils";

/**
 * BH monogram traced from the approved BHub Network logo: bold B, tall H,
 * and a light-blue arrow running into the H's crossbar.
 */
export function BhMark({ className, inverse = false }: { className?: string; inverse?: boolean }) {
  const ink = inverse ? "fill-primary-foreground" : "fill-foreground";
  return (
    <svg viewBox="0 0 41 27" className={cn("h-8 w-auto shrink-0", className)} role="img" aria-label="BH">
      {/* B */}
      <path
        className={ink}
        fillRule="evenodd"
        d="M0.5 0.5H12a6.2 6.2 0 0 1 4.6 10.6A7.4 7.4 0 0 1 12.6 26.5H0.5Zm4.8 4.4v5.3h6a2.65 2.65 0 0 0 0-5.3Zm0 9.6v7.6h6.6a3.8 3.8 0 0 0 0-7.6Z"
      />
      {/* H: left leg, right leg, crossbar tab */}
      <path className={ink} d="M20.7 0.5h4.8v26h-4.8zM35.7 0.5h4.8v26h-4.8zM27 11.2h8.7v3.9H27.6a0.6 0.6 0 0 1-0.6-0.6z" />
      {/* Arrow inside the crossbar */}
      <path className="fill-brand-sky" d="M28.2 12.8h3.4v-1l2 1.35-2 1.35v-1h-3.4z" />
    </svg>
  );
}
