import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, Menu, X, User, Newspaper, PenTool } from "lucide-react";
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

const navItems = [
  { label: "News", href: "/" },
  { label: "WhoIsWho", href: "/directory" },
  { label: "Compliance", href: "/compliance" },
  { label: "FinTech", href: "/fintech" },
  { label: "SME", href: "/sme" },
  { label: "Resources", href: "/resources" },
];

export function TopNavigation({ onSearch }: TopNavigationProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const location = useLocation();
  const { user, profile, signOut } = useAuth();

  const isActive = (href: string) => {
    const path = href.split("#")[0];
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <>
      {/* BusinessHub.cy Group Strip */}
      <div className="bg-foreground text-background text-[10px] tracking-[0.15em] uppercase font-sans">
        <div className="container mx-auto px-4 flex items-center justify-between h-7">
          <div className="flex items-center gap-3">
            <Link to="/" className="font-semibold text-secondary">
              BusinessHub.cy Group
            </Link>
            <span className="w-px h-3 bg-background/30" />
            <a href="https://www.financialmirror.com" target="_blank" rel="noopener noreferrer" className="hover:text-secondary transition-colors">Financial Mirror</a>
            <Link to="/fintech" className="hover:text-secondary transition-colors hidden sm:inline">FinTechHub.cy</Link>
            <Link to="/compliance" className="hover:text-secondary transition-colors hidden sm:inline">ComplianceHub.cy</Link>
          </div>
          <span className="hidden md:inline text-background/50">Est. Nicosia, Cyprus</span>
        </div>
      </div>

      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo — editorial masthead style */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 bg-foreground flex items-center justify-center">
                <span className="text-background font-serif font-bold text-sm">B</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="font-serif font-bold text-lg text-foreground leading-none tracking-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  BusinessHub<span className="text-secondary">.cy</span>
                </h1>
              </div>
            </Link>

          {/* Desktop Navigation — clean horizontal links */}
          <nav className="hidden lg:flex items-center">
            {navItems.map((item, i) => (
              <Link
                key={item.label}
                to={item.href}
                className={`
                  px-4 py-1.5 text-[12px] font-semibold uppercase tracking-[0.1em] transition-colors
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
                  <Link to="/dashboard">
                    <Button variant="ghost" size="icon" className="h-8 w-8 hidden sm:flex">
                      <User className="h-4 w-4" />
                    </Button>
                  </Link>
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
            <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="lg:hidden py-4 border-t border-border animate-slide-in-up">
            <div className="flex flex-col gap-0.5">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-4 py-2.5 text-sm font-medium uppercase tracking-wider transition-colors ${
                    isActive(item.href)
                      ? "text-foreground bg-muted"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="mt-4 px-4">
              <form onSubmit={handleSearch}>
                <Input
                  type="search"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-none"
                />
              </form>
            </div>
          </nav>
        )}
      </div>
      </header>
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
}
