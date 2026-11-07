import { Link } from "react-router-dom";
import { Info, ArrowRight, Mail } from "lucide-react";

interface InsightBannerProps {
  text: string;
  ctaText?: string;
  href?: string;
  variant?: "default" | "slim" | "prominent";
}

export function InsightBanner({
  text,
  ctaText = "Learn more",
  href = "/compliance",
  variant = "default",
}: InsightBannerProps) {
  if (variant === "prominent") {
    return (
      <div className="rounded-xl bg-primary text-primary-foreground p-6 sm:p-8 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center shrink-0">
            <Mail className="h-6 w-6 text-secondary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base sm:text-lg font-semibold leading-snug">
              {text}
            </p>
          </div>
          <Link
            to={href}
            className="inline-flex items-center justify-center gap-2 shrink-0 rounded-lg bg-secondary px-5 py-3 text-sm font-bold text-secondary-foreground hover:bg-secondary/90 transition-colors group"
          >
            {ctaText}
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-secondary/20 bg-secondary/5 ${variant === "slim" ? "p-4" : "p-5"}`}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0 mt-0.5">
          <Info className="h-4 w-4 text-secondary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-muted-foreground leading-relaxed ${variant === "slim" ? "text-xs" : "text-sm"}`}>
            {text}
          </p>
          <Link
            to={href}
            className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-secondary hover:text-secondary/80 transition-colors group"
          >
            {ctaText}
            <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
