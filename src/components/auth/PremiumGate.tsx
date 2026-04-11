import { ReactNode, useState } from "react";
import { Lock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { LoginModal } from "./LoginModal";

interface PremiumGateProps {
  children: ReactNode;
  message?: string;
  blurHeight?: string;
}

export function PremiumGate({
  children,
  message = "Upgrade to Premium for full access",
  blurHeight = "280px",
}: PremiumGateProps) {
  const { user, profile } = useAuth();
  const isPremium = profile?.tier === "premium";
  const [showLogin, setShowLogin] = useState(false);

  if (isPremium) return <>{children}</>;

  return (
    <>
      <div className="relative rounded-xl border border-border overflow-hidden">
        {/* Blurred content preview */}
        <div className="relative overflow-hidden" style={{ maxHeight: blurHeight }}>
          <div className="blur-[6px] opacity-40 pointer-events-none select-none">
            {children}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
        </div>

        {/* CTA overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center max-w-sm mx-auto px-4">
            <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto mb-4">
              <Crown className="h-7 w-7 text-secondary" />
            </div>
            <Badge className="bg-secondary/10 text-secondary border-secondary/20 mb-3">
              Premium
            </Badge>
            <p className="font-serif font-bold text-foreground text-lg mb-1.5">
              {message}
            </p>
            <p className="text-sm text-muted-foreground mb-5">
              Get detailed analytics, sector breakdowns, AI insights, and executive summaries.
            </p>
            {!user ? (
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => setShowLogin(true)}
                  className="rounded-full px-8 bg-secondary text-secondary-foreground hover:bg-secondary/90"
                >
                  Register Free to Start
                </Button>
                <span className="text-xs text-muted-foreground">
                  Then upgrade for €29/month
                </span>
              </div>
            ) : (
              <Button className="rounded-full px-8 bg-secondary text-secondary-foreground hover:bg-secondary/90">
                Upgrade to Premium — €29/mo
              </Button>
            )}
          </div>
        </div>
      </div>
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} defaultTab="register" />
    </>
  );
}
