import { Link } from "react-router-dom";
import { XCircle, ArrowRight } from "lucide-react";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";

export default function KYBCancelledPage() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Order Cancelled — KYB Report" description="Your KYB report order was cancelled." path="/kyb/cancelled" />
      <TopNavigation onSearch={() => {}} />
      <div className="container mx-auto px-4 py-20 text-center max-w-lg">
        <XCircle className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
        <h1 className="text-2xl font-serif font-bold text-foreground mb-3">Order cancelled</h1>
        <p className="text-muted-foreground mb-8">
          No payment was taken. You can go back and try again anytime.
        </p>
        <Link to="/directory" className="text-sm text-secondary hover:underline inline-flex items-center gap-1">
          Back to Directory <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <Footer />
    </div>
  );
}
