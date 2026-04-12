import { Link } from "react-router-dom";
import { Shield, Landmark, AlertTriangle, Cpu, ArrowRight } from "lucide-react";

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
      <div className="py-5 flex flex-col h-full">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-8 h-8 rounded flex items-center justify-center bg-muted shrink-0">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-serif font-bold text-foreground text-base mb-1">{title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed article-body">{description}</p>
          </div>
        </div>
        <div className="mt-auto pt-3">
          <span className="text-xs text-secondary font-semibold flex items-center gap-1 group-hover:gap-2 transition-all uppercase tracking-wider font-sans">
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
    <section className="section-rule">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="section-label">Verticals</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="grid md:grid-cols-4 gap-0 divide-y md:divide-y-0 md:divide-x divide-border">
          <div className="md:pr-6">
            <SectionBannerItem
              icon={<Shield className="h-4 w-4 text-compliance" />}
              title="Compliance Intelligence"
              description="AML, KYC, and EU regulatory frameworks for Cyprus-based firms. Stay informed on obligations."
              href="/compliance"
              ctaText="Compliance"
            />
          </div>
          <div className="md:px-6">
            <SectionBannerItem
              icon={<Landmark className="h-4 w-4 text-fintech" />}
              title="FinTech &amp; Licensing"
              description="EU licensing, MiCA, and DORA requirements for fintech firms operating from Cyprus."
              href="/fintech"
              ctaText="FinTech"
            />
          </div>
          <div className="md:px-6">
            <SectionBannerItem
              icon={<Cpu className="h-4 w-4 text-primary" />}
              title="RegTech &amp; ICT Risk"
              description="DORA readiness, NIS2 compliance, and cyber risk frameworks for regulated entities."
              href="/regtech"
              ctaText="RegTech"
            />
          </div>
          <div className="md:pl-6">
            <SectionBannerItem
              icon={<AlertTriangle className="h-4 w-4 text-warning" />}
              title="Risk &amp; Due Diligence"
              description="Country risk scores, FATF evaluations, and cross-border due diligence requirements."
              href="/compliance#alerts"
              ctaText="Risk"
            />
          </div>
        </div>
      </div>
    </section>
  );
}