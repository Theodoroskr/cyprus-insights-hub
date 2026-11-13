import { WHOISWHO_PUBLIC } from "@/lib/featureFlags";
import { NewsTicker } from "@/components/NewsTicker";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, Menu, X, User, PenTool, ChevronDown } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PRIMARY_NAV, visibleMenuSections } from "@/config/siteSections";
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
}

export function TopNavigation({ onSearch }: TopNavigationProps) {
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

  const visibleNav = PRIMARY_NAV;
  const menuSections = visibleMenuSections(WHOISWHO_PUBLIC);

  const isActive = (href: string, children?: { href: string }[]) => {
    if (children?.some((c) => c.href !== href && location.pathname.startsWith(c.href))) return true;
    const path = href.split("#")[0];
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

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
      {/* BusinessHub.cy Group Strip */}
      <div className="bg-foreground text-background text-[10px] tracking-[0.15em] uppercase font-sans">
        <div className="container mx-auto px-4 flex items-center justify-between h-7">
          <div className="flex items-center gap-3">
            <Link to="/" className="font-semibold text-secondary">
              BusinessHub.cy Group
            </Link>
            <span className="w-px h-3 bg-background/30" />
            <Link to="/fintech" className="hover:text-secondary transition-colors hidden sm:inline">FinTechHub.cy</Link>
            <Link to="/compliance" className="hover:text-secondary transition-colors hidden sm:inline">ComplianceHub.cy</Link>
            <Link to="/regtech" className="hover:text-secondary transition-colors hidden md:inline">RegTechHub.cy</Link>
            <Link to="/explore" className="hover:text-secondary transition-colors hidden md:inline">TourismHub.cy</Link>
          </div>
          <span className="hidden md:inline text-background/50">Est. Nicosia, Cyprus</span>
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
            <Link to="/" className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 bg-foreground flex items-center justify-center">
                <span className="text-background font-serif font-bold text-sm">B</span>
              </div>
              <div className="hidden sm:block">
                <span className="font-serif font-bold text-lg text-foreground leading-none tracking-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  BusinessHub<span className="text-secondary">.cy</span>
                </span>
              </div>
            </Link>
            </div>

          {/* Desktop Navigation — clean horizontal links */}
          <nav className="hidden lg:flex items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                    <DropdownMenuItem key={c.href} asChild><Link to={c.href}>{c.label}</Link></DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                key={item.label}
                to={item.href}
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
              </Link>
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
                        <Button variant="ghost" size="icon" className="h-8 w-8 hidden sm:flex" title="Editorial Dashboard">
                          <PenTool className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                    <Link to="/dashboard">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hidden sm:flex">
                        <User className="h-4 w-4" />
                      </Button>
                    </Link>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden sm:flex h-8 text-xs font-semibold uppercase tracking-wider"
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
          <nav className="mt-6 space-y-6" aria-label="All sections">
            {menuSections.map((section) => (
              <div key={section.title}>
                <p className="text-[11px] font-sans font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-2">{section.title}</p>
                <ul className="space-y-0.5">
                  {section.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        to={l.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`block py-1.5 font-serif text-[17px] transition-colors ${location.pathname === l.href ? "text-secondary font-semibold" : "text-foreground hover:text-secondary"}`}
                      >
                        {l.label}
                      </Link>
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
            {!user && (
              <Button size="sm" variant="outline" className="w-full sm:hidden" onClick={() => { setIsMobileMenuOpen(false); setShowLogin(true); }}>
                Sign In
              </Button>
            )}
          </nav>
        </SheetContent>
      </Sheet>
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
}
