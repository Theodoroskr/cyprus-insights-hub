import { Link } from "react-router-dom";
import { Shield, Landmark, AlertTriangle, ArrowRight } from "lucide-react";

interface SectionBannerItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  ctaText: string;
}

function SectionBannerItem({ icon, title, description, href, ctaText }: SectionBannerItemProps) {
  return (
    <Link to={href} className="group">
      <div className="bento-card h-full p-5 flex flex-col hover:border-secondary/40 transition-all">
        <div className="flex items-start gap-4 mb-3">
          <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm mb-1">{title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
          </div>
        </div>
        <div className="mt-auto pt-3 border-t border-border">
          <span className="text-xs text-secondary font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
            {ctaText}
            <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function SectionBanners() {
  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-4">
          <SectionBannerItem
            icon={<Shield className="h-5 w-5 text-compliance" />}
            title="Compliance Intelligence"
            description="Understand how AML, KYC, and EU regulatory frameworks apply to Cyprus-based firms. Stay informed on obligations and industry approaches."
            href="/compliance"
            ctaText="View compliance insights"
          />
          <SectionBannerItem
            icon={<Landmark className="h-5 w-5 text-fintech" />}
            title="FinTech & Licensing"
            description="Explore how fintech firms navigate EU licensing, MiCA, and DORA requirements when operating from Cyprus as a gateway to Europe."
            href="/fintech"
            ctaText="Explore fintech landscape"
          />
          <SectionBannerItem
            icon={<AlertTriangle className="h-5 w-5 text-warning" />}
            title="Risk & Due Diligence"
            description="Monitor country risk scores, FATF evaluations, and due diligence requirements relevant to firms with cross-border operations."
            href="/compliance#alerts"
            ctaText="Review risk intelligence"
          />
        </div>
      </div>
    </section>
  );
}
