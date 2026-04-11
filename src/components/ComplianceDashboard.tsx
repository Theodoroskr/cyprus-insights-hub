import { Link } from "react-router-dom";
import { Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ComplianceDashboard() {
  return (
    <section id="compliance" className="py-8 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-primary">Compliance & Risk</h2>
            <p className="text-muted-foreground text-sm">Regulatory intelligence for Cyprus</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto text-center bento-card py-10 px-6">
          <Shield className="h-12 w-12 mx-auto text-secondary mb-4" />
          <h3 className="text-xl font-semibold text-primary mb-2">ComplianceHub.cy</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Access regulatory alerts, AML compliance tools, and country risk analysis on the dedicated compliance hub.
          </p>
          <Link to="/compliance">
            <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2">
              Open Compliance Hub
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
