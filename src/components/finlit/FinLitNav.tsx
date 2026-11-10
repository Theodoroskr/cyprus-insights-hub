import { NavLink } from "react-router-dom";
import { LayoutGrid, Gauge, Home, ShoppingCart, CreditCard, GraduationCap, Calculator, BookOpen, Megaphone, FileSearch, type LucideIcon } from "lucide-react";
import { FINLIT_MODULES } from "@/lib/finlitModules";
import type { Lang } from "@/lib/academy";

export const MODULE_ICONS: Record<string, LucideIcon> = { LayoutGrid, Gauge, Home, ShoppingCart, CreditCard, GraduationCap, Calculator, BookOpen, Megaphone, FileSearch };

/** Sticky bar with the ten Financial Literacy modules; scrolls sideways on phones. */
export function FinLitNav({ lang }: { lang: Lang }) {
  return (
    <nav aria-label={lang === "el" ? "Ενότητες" : "Financial Literacy sections"} className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
      <ul className="container mx-auto px-4 flex gap-1 overflow-x-auto py-2 [scrollbar-width:thin]">
        {FINLIT_MODULES.map((m) => {
          const Icon = MODULE_ICONS[m.icon];
          return (
            <li key={m.key} className="shrink-0">
              <NavLink to={m.path} end={m.key === "overview"}
                className={({ isActive }) => `flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                <Icon className="h-4 w-4" aria-hidden />{lang === "el" ? m.el : m.en}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
