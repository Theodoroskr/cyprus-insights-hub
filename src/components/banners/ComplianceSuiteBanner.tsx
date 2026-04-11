import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function ComplianceSuiteBanner() {
  const navigate = useNavigate();

  return (
    <div className="py-5">
      <div className="container mx-auto px-4 flex justify-center">
        <div
          className="relative w-full max-w-[728px] h-[90px] rounded-lg overflow-hidden border border-border/40 bg-primary flex items-center justify-between px-6 cursor-pointer hover:border-secondary/40 transition-colors"
          onClick={() => navigate("/compliance")}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/95 to-compliance/30" />
          <div className="relative flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center shrink-0">
              <Shield className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-primary-foreground font-semibold text-sm leading-tight">
                ComplianceHub.cy — Full Regulatory Suite
              </h3>
              <p className="text-primary-foreground/60 text-xs mt-0.5">
                AML monitoring • GDPR tools • CySEC alerts • Risk dashboards
              </p>
            </div>
          </div>
          <div className="relative flex items-center gap-3">
            <span className="text-[9px] text-primary-foreground/30 uppercase tracking-wider hidden sm:block">
              Sponsored
            </span>
            <Button
              size="sm"
              variant="secondary"
              className="text-xs"
              onClick={(e) => {
                e.stopPropagation();
                navigate("/compliance");
              }}
            >
              Explore Suite
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
