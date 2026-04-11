import { ReactNode, useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LoginModal } from "./LoginModal";

interface ContentGateProps {
  children: ReactNode;
  teaser?: ReactNode;
  message?: string;
}

export function ContentGate({ children, teaser, message = "Register free to read the full analysis" }: ContentGateProps) {
  const { user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  if (user) return <>{children}</>;

  return (
    <>
      <div className="relative">
        {teaser && <div className="mb-0">{teaser}</div>}
        <div className="relative overflow-hidden" style={{ maxHeight: "120px" }}>
          <div className="blur-sm opacity-50 pointer-events-none">{children}</div>
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-transparent" />
        </div>
        <div className="text-center py-6 border border-border bg-card -mt-2 relative z-10">
          <Lock className="h-5 w-5 text-secondary mx-auto mb-2" />
          <p className="text-sm font-serif font-semibold text-foreground mb-1">{message}</p>
          <p className="text-xs text-muted-foreground mb-4">Join 5,000+ Cyprus business professionals</p>
          <Button onClick={() => setShowLogin(true)} className="rounded-none text-xs uppercase tracking-wider font-semibold">
            Register Free
          </Button>
        </div>
      </div>
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} defaultTab="register" />
    </>
  );
}
