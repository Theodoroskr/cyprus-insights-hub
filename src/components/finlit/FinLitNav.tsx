import { Fragment } from "react";
import { NavLink } from "react-router-dom";
import { LayoutGrid, Gauge, Home, ShoppingCart, CreditCard, GraduationCap, Calculator, BookOpen, Megaphone, FileSearch, type LucideIcon } from "lucide-react";
import { FINLIT_GROUPS, moduleByKey } from "@/lib/finlitModules";
import type { Lang } from "@/lib/academy";

export const MODULE_ICONS: Record<string, LucideIcon> = { LayoutGrid, Gauge, Home, ShoppingCart, CreditCard, GraduationCap, Calculator, BookOpen, Megaphone, FileSearch };

function Item({ k, lang }: { k: string; lang: Lang }) {
  const m = moduleByKey(k); const Icon = MODULE_ICONS[m.icon];
  return (
    <li className="shrink-0">
      <NavLink to={m.path} end={m.key === "overview"} title={lang === "el" ? m.el : m.en}
        className={({ isActive }) => `flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
        <Icon className="h-4 w-4" aria-hidden />{lang === "el" ? m.short_el : m.short_en}
      </NavLink>
    </li>
  );
}

/** Sticky bar: Overview, then the sections grouped as Data / Learn / About; scrolls sideways on phones. */
export function FinLitNav({ lang }: { lang: Lang }) {
  return (
    <nav aria-label={lang === "el" ? "Ενότητες" : "Financial Literacy sections"} className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
      <ul className="container mx-auto px-4 flex items-center gap-1 overflow-x-auto py-2 [scrollbar-width:thin]">
        <Item k="overview" lang={lang} />
        {FINLIT_GROUPS.map((g) => (
          <Fragment key={g.key}>
            <li aria-hidden className="shrink-0 mx-1 h-6 w-px bg-border" />
            <li className="shrink-0 hidden 2xl:block px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">{lang === "el" ? g.el : g.en}</li>
            {g.keys.map((k) => <Item key={k} k={k} lang={lang} />)}
          </Fragment>
        ))}
      </ul>
    </nav>
  );
}
