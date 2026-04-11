import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = (level: "all" | "essential") => {
    localStorage.setItem("cookie_consent", level);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-card border border-border rounded-xl shadow-2xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
          <Cookie className="h-8 w-8 text-secondary shrink-0 hidden md:block" />
          <div className="flex-1">
            <p className="text-sm text-foreground font-medium mb-1">We use cookies to enhance your experience</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We use cookies and similar technologies to personalise content, analyse traffic, and improve our services.
              Read our{" "}
              <Link to="/cookies" className="text-secondary hover:underline">Cookie Policy</Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-secondary hover:underline">Privacy Policy</Link>{" "}
              for more details.
            </p>
          </div>
          <div className="flex gap-2 shrink-0 w-full md:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => accept("essential")}
              className="flex-1 md:flex-none text-xs"
            >
              Essential Only
            </Button>
            <Button
              size="sm"
              onClick={() => accept("all")}
              className="flex-1 md:flex-none text-xs bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              Accept All
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
