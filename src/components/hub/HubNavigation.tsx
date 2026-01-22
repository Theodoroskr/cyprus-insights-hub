import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Search, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandConfig, hubLinks } from "@/config/brands";

interface HubNavigationProps {
  brand: BrandConfig;
  onSearch: (query: string) => void;
}

export function HubNavigation({ brand, onSearch }: HubNavigationProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery);
      setSearchQuery("");
      setIsSearchOpen(false);
    }
  };

  const LogoIcon = brand.icon;

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={brand.id === "businesshub" ? "/" : `/${brand.id.replace("hub", "")}`} className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-${brand.colors.primary} flex items-center justify-center`}>
              <span className="font-bold text-sm text-primary-foreground">{brand.logoLetter}</span>
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground">
                {brand.name}<span className="text-secondary">{brand.domain}</span>
              </h1>
              {brand.parentBadge && (
                <p className="text-[10px] text-muted-foreground">Part of BusinessHub.cy Group</p>
              )}
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {brand.navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {isSearchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <Input
                  type="search"
                  placeholder={`Search ${brand.name}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 h-9"
                  autoFocus
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => setIsSearchOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <>
                <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)}>
                  <Search className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Bell className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <User className="h-4 w-4" />
                </Button>
              </>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-1">
              {brand.navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              {brand.parentBadge && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="px-3 text-xs text-muted-foreground mb-2">BusinessHub.cy Group</p>
                  {hubLinks.map((hub) => (
                    <Link
                      key={hub.href}
                      to={hub.href}
                      className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground flex items-center gap-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <hub.brand.icon className="h-4 w-4" />
                      {hub.brand.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
