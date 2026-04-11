import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, Menu, X, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TopNavigationProps {
  onSearch: (query: string) => void;
}

const navItems = [
  { label: "News", href: "/" },
  { label: "Reports", href: "/resources" },
  { label: "WhoIsWho", href: "/directory" },
  { label: "EU Funding", href: "/resources#funding" },
  { label: "Compliance", href: "/compliance" },
  { label: "FinTech", href: "/fintech" },
  { label: "Resources", href: "/resources" },
];

export function TopNavigation({ onSearch }: TopNavigationProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();

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
    <header className="sticky top-0 z-50 bg-card border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-lg navy-gradient flex items-center justify-center">
              <span className="text-secondary font-bold text-lg">B</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-lg text-primary leading-tight">
                BusinessHub<span className="text-secondary">.cy</span>
              </h1>
              <p className="text-[11px] text-muted-foreground leading-none">
                Cyprus Business Intelligence
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className={`nav-link ${isActive(item.href) ? "active" : ""}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Search & Actions */}
          <div className="flex items-center gap-2">
            {isSearchOpen ? (
              <form
                onSubmit={handleSearch}
                className="flex items-center gap-2 animate-slide-in-right"
              >
                <Input
                  type="search"
                  placeholder="Search news, people, grants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 h-9"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSearchOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSearchOpen(true)}
                  className="hidden sm:flex"
                >
                  <Search className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="hidden sm:flex">
                  <Bell className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="hidden sm:flex">
                  <User className="h-4 w-4" />
                </Button>
              </>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="lg:hidden py-4 border-t border-border animate-slide-in-up">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-4 py-2.5 rounded-lg transition-colors text-sm ${
                    isActive(item.href)
                      ? "bg-secondary/10 text-secondary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
                  className="w-full"
                />
              </form>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
