import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SectionSponsor {
  sponsor_name: string;
  sponsor_url: string;
  logo_url: string | null;
  label: string;
}

export function SectionSponsorStrip({ sectionKey }: { sectionKey: string }) {
  const [sponsor, setSponsor] = useState<SectionSponsor | null>(null);

  useEffect(() => {
    supabase
      .from("section_sponsors")
      .select("sponsor_name, sponsor_url, logo_url, label")
      .eq("section_key", sectionKey)
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) setSponsor(data[0]);
      });
  }, [sectionKey]);

  if (!sponsor) return null;

  return (
    <div className="border-b border-border bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-3 py-2.5">
          <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/50">
            {sponsor.label}
          </span>
          <a
            href={sponsor.sponsor_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            {sponsor.logo_url ? (
              <img src={sponsor.logo_url} alt={sponsor.sponsor_name} className="h-5 object-contain" />
            ) : (
              <span className="text-sm font-bold text-foreground tracking-tight">{sponsor.sponsor_name}</span>
            )}
          </a>
        </div>
      </div>
    </div>
  );
}
