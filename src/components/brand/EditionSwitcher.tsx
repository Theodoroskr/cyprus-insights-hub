import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { currentHost, editionLinks, useNetworkEdition } from "@/lib/networkEditions";

/**
 * International · Cyprus · Greece. Chooses the edition only; the language switch lives elsewhere.
 * tone="dark" sits in the navy group strip above the masthead.
 */
export function EditionSwitcher({ lang = "en", className, onPick, tone = "light" }: { lang?: "en" | "el"; className?: string; onPick?: () => void; tone?: "light" | "dark" }) {
  const current = useNetworkEdition();
  const links = editionLinks(lang, currentHost());
  const dark = tone === "dark";
  return (
    <nav
      lang={lang}
      aria-label={lang === "el" ? "Εκδόσεις" : "Editions"}
      className={cn("inline-flex items-center rounded-full p-0.5", dark ? "bg-background/10" : "border border-border bg-muted", className)}
    >
      {links.map((l) => {
        const active = l.key === current;
        const cls = cn(
          "rounded-full font-semibold uppercase whitespace-nowrap transition-colors",
          dark ? "px-2 py-0.5 text-[10px] tracking-[0.12em]" : "px-2.5 py-1 text-[11px] tracking-wider",
          active
            ? dark ? "bg-background text-foreground" : "bg-background text-foreground shadow-sm"
            : dark ? "text-background/70 hover:text-background" : "text-muted-foreground hover:text-foreground",
        );
        return l.external
          ? <a key={l.key} href={l.href} className={cls} aria-current={active ? "page" : undefined} onClick={onPick}>{l.label}</a>
          : <Link key={l.key} to={l.href} className={cls} aria-current={active ? "page" : undefined} onClick={onPick}>{l.label}</Link>;
      })}
    </nav>
  );
}
