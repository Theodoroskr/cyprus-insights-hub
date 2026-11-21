import { cn } from "@/lib/utils";
import { BhMark } from "./BhMark";
import type { NetworkEdition } from "@/lib/networkEditions";

/** Horizontal lockup: BH mark on the left, edition name on the right. No tagline. */
export function BrandLockup({ edition, inverse = false, className, compact = false, lang: langProp }: { edition: NetworkEdition; inverse?: boolean; className?: string; compact?: boolean; lang?: "en" | "el" }) {
  // Greece pages remember the EN/EL choice; pages that do not pass it use that saved choice.
  const lang = langProp ?? (typeof localStorage !== "undefined" && localStorage.getItem("gr-lang") === "en" ? "en" : "el");
  const ink = inverse ? "text-primary-foreground" : "text-foreground";
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <BhMark inverse={inverse} className={compact ? "h-7" : "h-8"} />
      <span className={cn("font-brand font-extrabold uppercase leading-none tracking-[0.06em]", ink, compact ? "hidden sm:inline" : "")}>
        {edition === "intl" && <span className="text-[14px] sm:text-[17px]">BHub <span className="font-medium">Network</span></span>}
        {edition === "cy" && <span className="text-[14px] sm:text-[17px]">BusinessHub<span className="text-brand-sky">.cy</span></span>}
        {edition === "gr" && (
          <span className="flex flex-col">
            <span className="text-[13px] sm:text-[16px]">BusinessHub</span>
            <span className="mt-0.5 text-[10px] tracking-[0.42em] text-brand-sky">{lang === "en" ? "Greece" : "Ελλάδα"}</span>
          </span>
        )}
      </span>
    </span>
  );
}
