import { WHOISWHO_PUBLIC } from "@/lib/featureFlags";
import { grHref } from "@/lib/edition";
import { cyprusHome, currentHost, intlHome, useNetworkEdition } from "@/lib/networkEditions";
import { BrandLockup } from "@/components/brand/BrandLockup";
import { EditionSwitcher } from "@/components/brand/EditionSwitcher";
import { NetworkHomeLink } from "@/components/brand/NetworkHomeLink";
import { NewsTicker } from "@/components/NewsTicker";
import { forwardRef, useEffect, useState, type AnchorHTMLAttributes } from "react";
import { OPEN_MENU_EVENT } from "@/components/mobile/MobileTabBar";
import { InstallAppButton } from "@/components/mobile/InstallAppButton";
import { Link, useLocation } from "react-router-dom";
import { Search, Menu, X, User, PenTool, ChevronDown } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { editionMenuSection, editionNav, visibleMenuSections } from "@/config/siteSections";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { LoginModal } from "@/components/auth/LoginModal";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TopNavigationProps {
  onSearch: (query: string) => void;
  /** Reading language of the page, for the edition switcher labels (Greece pages can be Greek). */
  lang?: "en" | "el";
}

const grHome = () => grHref("/greece");

/** A menu link: inside the site it navigates in place, an address on another domain opens normally. */
const NavAnchor = forwardRef<HTMLAnchorElement, Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string }>(
  ({ href, children, ...rest }, ref) => /^https?:/.test(href)
    ? <a ref={ref} href={href} {...rest}>{children}</a>
    : <Link ref={ref} to={href} {...rest}>{children}</Link>,
);
NavAnchor.displayName = "NavAnchor";

export function TopNavigation({ onSearch, lang: langProp }: TopNavigationProps) {
  const lang = langProp ?? "en";
  const edition = useNetworkEdition();
  const host = currentHost();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut } = useAuth();

  const { data: isAdmin } = useQuery({
    queryKey: ["admin-check", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      return !!data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    const open = () => setIsMobileMenuOpen(true);
    window.addEventListener(OPEN_MENU_EVENT, open);
    return () => window.removeEventListener(OPEN_MENU_EVENT, open);
  }, []);

  // Each edition shows its own top links; the Menu drawer lists that edition's links first.
  const visibleNav = editionNav(edition, lang, host);
  const ownSection = editionMenuSection(edition, lang, host);
  const menuSections = [...(ownSection ? [ownSection] : []), ...visibleMenuSections(WHOISWHO_PUBLIC)];
  const home = edition === "intl" ? intlHome(host) : edition === "gr" ? { href: grHome(), external: false } : cyprusHome(host);

  /** A link is current when its page is open; shortcuts to a block of one page (#…) and other domains never are. */
  const opens = (href: string) => {
    if (/^https?:/.test(href) || href.includes("#")) return false;
    const path = href.split("?")[0];
    if (path === "/" || path === "/greece") return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };
  const isActive = (href: string, children?: { href: string }[]) => opens(href) || !!children?.some((c) => opens(c.href));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
    onSearch(searchQuery);
  };

  return (
    <>
      {location.pathname !== "/" && <NewsTicker />}
      {/* BHub Network strip: the network name and the edition switcher only — the hubs live in the footer */}
      <div className="bg-foreground text-background text-[10px] tracking-[0.15em] uppercase font-sans">
        <div className="container mx-auto px-4 flex items-center justify-between h-7">
          <NetworkHomeLink className="font-semibold text-secondary hover:text-background transition-colors" />
          <EditionSwitcher lang={lang} tone="dark" className="ml-auto sm:ml-0" />
        </div>
      </div>

      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            {/* Menu — every section, grouped */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 gap-1.5 text-xs font-semibold uppercase tracking-wider"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open menu with all sections"
            >
              <Menu className="h-5 w-5" /><span className="hidden xl:inline">Menu</span>
            </Button>
            {/* Logo — editorial masthead style */}
            <NavAnchor href={home.href} className="flex items-center shrink-0">
              <span className="sr-only">{edition === "intl" ? "BHub Network" : edition === "gr" ? "BusinessHub Ελλάδα" : "BusinessHub.cy"}</span>
              <BrandLockup edition={edition} lang={langProp} />
            </NavAnchor>
            </div>

          {/* Desktop Navigation — clean horizontal links */}
          <nav lang={lang} className="hidden lg:flex items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {visibleNav.map((item, i) => item.children ? (
              <DropdownMenu key={item.label}>
                <DropdownMenuTrigger
                  className={`inline-flex items-center gap-0.5 px-1.5 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.04em] whitespace-nowrap shrink-0 transition-colors outline-none
                    ${isActive(item.href, item.children) ? "text-foreground" : "text-muted-foreground hover:text-foreground"}
                    ${i > 0 ? "border-l border-border" : ""}`}
                >
                  {item.label}<ChevronDown className="h-3 w-3" aria-hidden />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {item.children.map((c) => (
                    <DropdownMenuItem key={c.href} asChild><NavAnchor href={c.href}>{c.label}</NavAnchor></DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <NavAnchor
                key={item.label}
                href={item.href}
                className={`
                  px-1.5 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.04em] whitespace-nowrap shrink-0 transition-colors
                  ${isActive(item.href)
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                  }
                  ${i > 0 ? "border-l border-border" : ""}
                `}
              >
                {item.label}
              </NavAnchor>
            ))}
          </nav>

          {/* Search & Actions */}
          <div className="flex items-center gap-1">
            {isSearchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center gap-2 animate-slide-in-right">
                <Input
                  type="search"
                  placeholder="Search news, people, grants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 h-8 text-sm rounded-none border-foreground/20"
                  autoFocus
                />
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsSearchOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <>
                <Button variant="ghost" size="icon" className="h-8 w-8 hidden sm:flex" onClick={() => setIsSearchOpen(true)}>
                  <Search className="h-4 w-4" />
                </Button>
                <div className="hidden sm:flex">
                  <NotificationDropdown />
                </div>
                {user ? (
                  <>
                    {isAdmin && (
                      <Link to="/editorial">
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Editorial Dashboard">
                          <PenTool className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                    <Link to="/dashboard" aria-label="My account">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <User className="h-4 w-4" />
                      </Button>
                    </Link>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs font-semibold uppercase tracking-wider"
                    onClick={() => setShowLogin(true)}
                  >
                    Sign In
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

      </div>
      </header>
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-[320px] sm:w-[360px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-serif text-xl text-left">All sections</SheetTitle>
          </SheetHeader>
          <form onSubmit={(e) => { handleSearch(e); setIsMobileMenuOpen(false); }} className="mt-4">
            <Input
              type="search"
              placeholder="Search news, companies, grants…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-none"
              aria-label="Search"
            />
          </form>
          <div className="mt-4">
            {user ? (
              <div className="flex gap-2">
                <Button asChild size="sm" variant="outline" className="flex-1"><Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>My account</Link></Button>
                <Button size="sm" variant="ghost" onClick={() => { setIsMobileMenuOpen(false); signOut(); }}>Sign out</Button>
              </div>
            ) : (
              <Button size="sm" className="w-full" onClick={() => { setIsMobileMenuOpen(false); setShowLogin(true); }}>Sign In</Button>
            )}
            <div className="mt-2"><InstallAppButton onDone={() => setIsMobileMenuOpen(false)} /></div>
            <p className="mt-5 mb-2 text-[11px] font-sans font-semibold uppercase tracking-[0.18em] text-muted-foreground">{lang === "el" ? "Έκδοση" : "Edition"}</p>
            <EditionSwitcher lang={lang} onPick={() => setIsMobileMenuOpen(false)} />
          </div>
          <nav className="mt-6 space-y-6" aria-label="All sections">
            {menuSections.map((section) => (
              <div key={section.title}>
                <p className="text-[11px] font-sans font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-2">{section.title}</p>
                <ul className="space-y-0.5">
                  {section.links.map((l) => (
                    <li key={l.href}>
                      <NavAnchor
                        href={l.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`block py-1.5 font-serif text-[17px] transition-colors ${location.pathname === l.href ? "text-secondary font-semibold" : "text-foreground hover:text-secondary"}`}
                      >
                        {l.label}
                      </NavAnchor>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {isAdmin && (
              <Link to="/editorial" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-secondary">
                <PenTool className="h-3.5 w-3.5" /> Editorial dashboard
              </Link>
            )}
          </nav>
        </SheetContent>
      </Sheet>
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
}
