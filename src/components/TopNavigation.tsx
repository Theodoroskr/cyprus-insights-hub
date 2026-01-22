import { useState } from "react";
import { Search, Menu, X, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TopNavigationProps {
  onSearch: (query: string) => void;
}

const navItems = [
  { label: "News", href: "#news" },
  { label: "Reports", href: "#reports" },
  { label: "WhoIsWho", href: "#whoiswho" },
  { label: "EU Funding", href: "#funding" },
  { label: "Compliance", href: "#compliance" },
  { label: "FinTech", href: "/fintech" },
  { label: "Resources", href: "/resources" },
];

export function TopNavigation({ onSearch }: TopNavigationProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeNav, setActiveNav] = useState("News");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg navy-gradient flex items-center justify-center">
              <span className="text-secondary font-bold text-lg">B</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-lg text-primary">BusinessHub<span className="text-secondary">.cy</span></h1>
              <p className="text-xs text-muted-foreground">Cyprus Business Intelligence</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setActiveNav(item.label)}
                className={`nav-link ${activeNav === item.label ? 'active' : ''}`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Search & Actions */}
          <div className="flex items-center gap-2">
            {isSearchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center gap-2 animate-slide-in-right">
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
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="lg:hidden py-4 border-t border-border animate-slide-in-up">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => {
                    setActiveNav(item.label);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeNav === item.label 
                      ? 'bg-secondary/10 text-secondary font-medium' 
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {item.label}
                </a>
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
