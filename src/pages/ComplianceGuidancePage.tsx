import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Calendar, ClipboardCheck, Download, ExternalLink, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { GDPRComplianceChecker } from "@/components/sme/GDPRComplianceChecker";
import { ComplianceShell } from "@/components/compliance/ComplianceShell";
import { documentTemplates, fallbackCalendar, regulatoryLinks } from "@/components/compliance/staticContent";

export default function ComplianceGuidancePage() {
  const { data: calendar = fallbackCalendar } = useQuery({
    queryKey: ["regulatory-calendar"],
    queryFn: async () => {
      const { data } = await supabase.from("regulatory_calendar").select("date_label, event, category").eq("active", true).order("sort_date", { ascending: true, nullsFirst: false });
      return data?.length ? data.map((r) => ({ date: r.date_label, event: r.event, category: r.category })) : fallbackCalendar;
    },
  });
  return (
    <ComplianceShell title="Guidance & Resources" intro="Self-assessment tools, templates, the regulatory horizon and links to every Cypriot and EU authority.">
      {() => (
        <>
          <SEOHead title="Guidance & Resources — ComplianceHub.cy" description="Compliance tools, templates, a regulatory horizon calendar and official authority links for Cyprus compliance officers." path="/compliance/guidance" vertical="compliance" />
          <section className="container mx-auto px-4 py-8 grid lg:grid-cols-[1fr_22rem] gap-8">
            <div>
              <h2 className="section-label text-foreground text-sm mb-1">Interactive Compliance Tools</h2>
              <p className="text-xs text-muted-foreground mb-4">Self-assessment diagnostics tailored for Cyprus-registered businesses</p>
              <GDPRComplianceChecker />
              <div className="mt-6 grid sm:grid-cols-2 gap-4">
                {[{ icon: ClipboardCheck, t: "Digital Maturity Assessment", d: "Evaluate your digital transformation readiness across 5 key dimensions." },
                  { icon: Globe, t: "EU Funding Eligibility", d: "Check if your business qualifies for EU & national funding programmes." }].map((c) => (
                  <Link key={c.t} to="/sme"><Card className="rounded-none h-full hover:border-secondary/50"><CardContent className="pt-6">
                    <c.icon className="h-7 w-7 mb-3" /><h3 className="font-serif font-bold mb-1">{c.t}</h3><p className="text-xs text-muted-foreground">{c.d}</p>
                    <span className="flex items-center gap-1 mt-3 text-[10px] uppercase tracking-wider text-secondary font-semibold">Open Tool <ArrowRight className="h-3 w-3" /></span>
                  </CardContent></Card></Link>
                ))}
              </div>
              <h2 className="section-label text-foreground text-sm mt-10 mb-4">Document Templates & Checklists</h2>
              <div className="grid sm:grid-cols-2 gap-px bg-border border border-border">
                {documentTemplates.map((doc) => (
                  <div key={doc.name} className="bg-card p-4 flex gap-3">
                    <doc.icon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div><Badge variant="outline" className="rounded-none text-[9px] uppercase mb-1">{doc.category}</Badge><h3 className="font-serif font-bold leading-snug">{doc.name}</h3>
                      <span className="flex items-center gap-1 text-[10px] text-secondary font-semibold uppercase tracking-wider mt-1"><Download className="h-3 w-3" />Coming Soon</span></div>
                  </div>
                ))}
              </div>
              <Link to="/resources" className="inline-block mt-6"><Button variant="outline" className="rounded-none gap-2 text-xs uppercase tracking-wider"><BookOpen className="h-3.5 w-3.5" />Browse Full Resource Hub<ArrowRight className="h-3 w-3" /></Button></Link>
            </div>
            <aside className="space-y-8">
              <div>
                <h2 className="section-label text-foreground text-sm mb-1">Regulatory Horizon</h2>
                <p className="text-xs text-muted-foreground mb-3">Longer-range milestones. Confirmed dates are listed under <Link to="/compliance/deadlines" className="text-secondary underline">Deadlines & Consultations</Link>.</p>
                <ul className="divide-y divide-border border border-border">
                  {calendar.map((c, i) => (
                    <li key={i} className="p-3 flex gap-3"><Calendar className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div><span className="text-[11px] font-bold text-secondary uppercase">{c.date}</span><p className="text-sm font-semibold leading-snug">{c.event}</p></div></li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="section-label text-foreground text-sm mb-3">Regulatory Authorities</h2>
                <ul className="space-y-2">
                  {regulatoryLinks.map((l) => (
                    <li key={l.name}><a href={l.url} target="_blank" rel="noopener noreferrer" className="flex items-start justify-between gap-2 border border-border p-3 hover:border-secondary/50">
                      <span><span className="font-serif font-bold">{l.name}</span><span className="block text-xs text-muted-foreground">{l.description}</span></span><ExternalLink className="h-3 w-3 mt-1 text-muted-foreground" /></a></li>
                  ))}
                </ul>
              </div>
            </aside>
          </section>
        </>
      )}
    </ComplianceShell>
  );
}
