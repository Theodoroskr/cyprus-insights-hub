import { useState } from "react";
import { Crown, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LoginModal } from "@/components/auth/LoginModal";

const freeFeatures = [
  "Unlimited article access",
  "Save tool results",
  "Weekly intelligence digest",
  "Regulatory calendar",
];

const premiumFeatures = [
  "Everything in Free",
  "PDF report exports",
  "Daily briefing email",
  "Custom alerts & digests",
  "Priority directory listing",
  "1-on-1 advisory booking",
];

export function PremiumCTABanner() {
  const { user, profile } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  // Don't show to premium users
  if (profile?.tier === "premium") return null;

  return (
    <>
      <section className="section-rule">
        <div className="container mx-auto px-4 pb-8">
          <div className="navy-gradient text-primary-foreground py-10 px-8">
            <div className="text-center mb-8">
              <Crown className="h-8 w-8 text-secondary mx-auto mb-3" />
              <h2 className="text-2xl md:text-3xl font-serif font-bold mb-2">
                BusinessHub Premium
              </h2>
              <p className="text-primary-foreground/70 max-w-lg mx-auto text-sm">
                Your competitive edge in Cyprus business intelligence
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
              {/* Free tier */}
              <div className="border border-primary-foreground/20 p-6">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-secondary mb-3">Free</p>
                <ul className="space-y-2.5">
                  {freeFeatures.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-primary-foreground/80">
                      <Check className="h-3.5 w-3.5 text-secondary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {!user && (
                  <Button
                    onClick={() => setShowLogin(true)}
                    variant="outline"
                    className="w-full mt-5 rounded-none text-xs uppercase tracking-wider font-semibold border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                  >
                    Register Free
                  </Button>
                )}
              </div>

              {/* Premium tier */}
              <div className="border-2 border-secondary p-6 relative">
                <div className="absolute -top-3 left-4 bg-secondary text-secondary-foreground text-[10px] uppercase tracking-[0.15em] font-bold px-3 py-1">
                  Recommended
                </div>
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-secondary mb-3">Premium</p>
                <ul className="space-y-2.5">
                  {premiumFeatures.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-primary-foreground">
                      <Check className="h-3.5 w-3.5 text-secondary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full mt-5 bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-none text-xs uppercase tracking-wider font-semibold gap-2"
                >
                  Upgrade to Premium
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} defaultTab="register" />
    </>
  );
}
