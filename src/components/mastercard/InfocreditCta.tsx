import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ExternalLink, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COPY, INFOCREDIT_URL, Interest, Lang, trackCta } from "@/lib/mastercard";
import { EnquiryDialog } from "./EnquiryDialog";

interface Props {
  placement: string;            // e.g. "economy", "tourism", "trade", "mastercard-hub"
  variant?: "contextual" | "full";
  lang?: Lang;
  interest?: Interest;
  showExplore?: boolean;
}

/** Infocredit Group commercial call to action. Wording is approved partner copy — do not edit casually. */
export function InfocreditCta({ placement, variant = "contextual", lang = "en", interest, showExplore = true }: Props) {
  const t = COPY[lang];
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) { trackCta("view", placement); io.disconnect(); } }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [placement]);

  const full = variant === "full";
  return (
    <section ref={ref} aria-label="Infocredit Group enquiry" className="rounded-xl border bg-card text-card-foreground p-6 md:p-8 shadow-sm">
      <div className="grid md:grid-cols-[1fr_auto] gap-6 items-center">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"><LineChart className="h-4 w-4" /> Market intelligence</div>
          <h2 className="text-xl md:text-2xl font-serif font-bold">{full ? t.fullTitle : t.ctaTitle}</h2>
          <p className="text-muted-foreground max-w-2xl">{full ? t.fullBody : t.ctaBody}</p>
          {full && <p className="font-medium max-w-2xl">{t.fullContact}</p>}
          <div className="pt-1">
            <p className="font-semibold">Infocredit Group</p>
            <p className="text-sm text-muted-foreground">{t.partner}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 md:min-w-[15rem]">
          <Button onClick={() => { trackCta("open", placement, interest); setOpen(true); }}>{t.request}</Button>
          <Button variant="outline" asChild>
            <a href={INFOCREDIT_URL} target="_blank" rel="noopener noreferrer" onClick={() => trackCta("outbound", placement)}>{t.contact} <ExternalLink className="h-3.5 w-3.5 ml-1" /></a>
          </Button>
          {showExplore && <Link to="/intelligence/mastercard" className="text-sm underline inline-flex items-center gap-1 justify-center">{t.explore} <ArrowRight className="h-3.5 w-3.5" /></Link>}
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground mt-4">{t.disclaimer}</p>
      <EnquiryDialog open={open} onOpenChange={setOpen} lang={lang} placement={placement} defaultInterest={interest} />
    </section>
  );
}
