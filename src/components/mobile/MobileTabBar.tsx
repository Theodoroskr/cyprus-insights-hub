import { Link, useLocation } from "react-router-dom";
import { Home, Newspaper, Building2, Search, Menu } from "lucide-react";

export const OPEN_MENU_EVENT = "bh:open-menu";

const TABS = [
  { label: "Home", href: "/", icon: Home },
  { label: "News", href: "/news", icon: Newspaper },
  { label: "Directory", href: "/directory", icon: Building2 },
  { label: "Search", href: "/search", icon: Search },
];

/** App-style bottom bar on phones; Menu opens the full section drawer in TopNavigation. */
export function MobileTabBar() {
  const { pathname } = useLocation();
  if (pathname.startsWith("/editorial")) return null;
  const active = (h: string) => (h === "/" ? pathname === "/" : pathname.startsWith(h));
  const cls = (on: boolean) =>
    `flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide ${on ? "text-secondary" : "text-muted-foreground"}`;
  return (
    <>
      <div className="h-16 md:hidden" aria-hidden />
      <nav
        aria-label="App navigation"
        className="fixed inset-x-0 bottom-0 z-50 flex border-t border-border bg-card/95 backdrop-blur-sm md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {TABS.map(({ label, href, icon: Icon }) => (
          <Link key={href} to={href} className={cls(active(href))} aria-current={active(href) ? "page" : undefined}>
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
        <button type="button" className={cls(false)} onClick={() => window.dispatchEvent(new Event(OPEN_MENU_EVENT))}>
          <Menu className="h-5 w-5" />
          Menu
        </button>
      </nav>
    </>
  );
}
