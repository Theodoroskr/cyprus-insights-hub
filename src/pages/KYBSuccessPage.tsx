import { useSearchParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Download, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";

export default function KYBSuccessPage() {
  const [params] = useSearchParams();
  const reportId = params.get("report_id");
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    if (!reportId) return;
    const poll = setInterval(async () => {
      const { data } = await supabase
        .from("kyb_reports")
        .select("*")
        .eq("id", reportId)
        .single();
      if (data) {
        setReport(data);
        if (data.status === "generated") clearInterval(poll);
      }
    }, 3000);
    return () => clearInterval(poll);
  }, [reportId]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Payment Successful — KYB Report" description="Your KYB report is being generated." path="/kyb/success" />
      <TopNavigation onSearch={() => {}} />
      <div className="container mx-auto px-4 py-20 text-center max-w-lg">
        <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-6" />
        <h1 className="text-2xl font-serif font-bold text-foreground mb-3">
          Payment successful
        </h1>
        <p className="text-muted-foreground mb-8">
          Your KYB report for <strong>{report?.company_name || "the company"}</strong> is being generated and will be emailed to <strong>{report?.buyer_email}</strong> within a few minutes.
        </p>

        {report?.status === "generated" ? (
          <div className="border border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30 p-6 mb-6">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-3">
              ✓ Your report is ready
            </p>
            <Link to="/dashboard">
              <Button className="gap-2 rounded-none text-xs uppercase tracking-wider font-semibold">
                <Download className="h-3.5 w-3.5" />
                View in Dashboard
              </Button>
            </Link>
          </div>
        ) : (
          <div className="border border-border p-6 mb-6">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
              Generating your report…
            </div>
          </div>
        )}

        <Link to="/directory" className="text-sm text-secondary hover:underline inline-flex items-center gap-1">
          Back to Directory <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <Footer />
    </div>
  );
}
