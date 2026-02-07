import { Link } from "react-router-dom";
import { Settings, CheckCircle2, ArrowRight } from "lucide-react";

interface OperationaliseBannerProps {
  title?: string;
  items?: string[];
  ctaText?: string;
  href?: string;
}

export function OperationaliseBanner({
  title = "How firms operationalise compliance",
  items = [
    "Ongoing transaction monitoring and screening",
    "Automated regulatory reporting and record-keeping",
    "Risk-based customer due diligence workflows",
    "Policy management and audit trail documentation",
  ],
  ctaText = "Explore solution approach",
  href = "/resources",
}: OperationaliseBannerProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-compliance/10 flex items-center justify-center">
          <Settings className="h-4 w-4 text-compliance" />
        </div>
        <h3 className="font-semibold text-foreground text-sm">{title}</h3>
      </div>
      <ul className="space-y-2.5 mb-5">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-compliance shrink-0 mt-0.5" />
            <span className="text-sm text-muted-foreground leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
      <div className="pt-4 border-t border-border">
        <Link
          to={href}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-compliance hover:text-compliance-light transition-colors group"
        >
          {ctaText}
          <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
