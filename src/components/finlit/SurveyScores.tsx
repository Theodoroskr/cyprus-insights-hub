import { useT, periodLabel } from "@/lib/finlitI18n";
import { useEffect, useState } from "react";
import { ExternalLink, Info } from "lucide-react";
import { scoreExplain } from "@/lib/finlitExplain";
import { FL_BG, FL_BORDER_SOFT, FL_SOFT, FL_TEXT, FL_TINT, flCss, indicatorAccent, type FlAccent } from "@/lib/finlitPalette";
import { Card, CardContent } from "@/components/ui/card";

export type Finding = { id: string; publisher: string; survey: string; survey_year: number; published_year: number | null; indicator: string; value: number | null; unit: string; comparison_label: string | null; comparison_value: number | null; source_url: string; page_ref: string | null; notes: string | null; status: string };

export const maxOf = (f: Finding) => { const m = f.unit.match(/out of (\d+)/i); return m ? Number(m[1]) : f.unit.trim().startsWith("%") ? 100 : null; };

export function Gauge({ value, max, target, accent = 1 }: { value: number; max: number; target?: number | null; accent?: FlAccent }) {
  const t = useT();
  const r = 80, c = Math.PI * r;
  const [shown, setShown] = useState(0);
  useEffect(() => { const id = requestAnimationFrame(() => setShown(value)); return () => cancelAnimationFrame(id); }, [value]);
  const pct = Math.min(shown / max, 1);
  const ang = target != null ? Math.PI * (1 - target / max) : null;
  return (
    <svg viewBox="0 0 200 120" className="w-full max-w-[280px]" role="img" aria-label={`${value} out of ${max}`}>
      <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="hsl(var(--muted))" strokeWidth="16" strokeLinecap="round" />
      <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke={flCss(accent)} strokeWidth="16" strokeLinecap="round" strokeDasharray={`${c * pct} ${c}`} style={{ transition: "stroke-dasharray 1.1s ease-out" }} />
      {ang != null && <line x1={100 + 64 * Math.cos(ang)} y1={100 - 64 * Math.sin(ang)} x2={100 + 98 * Math.cos(ang)} y2={100 - 98 * Math.sin(ang)} stroke="hsl(var(--foreground))" strokeWidth="2" strokeDasharray="3 2" />}
      <text x="100" y="92" textAnchor="middle" className="fill-foreground font-serif" fontSize="40" fontWeight="700">{value}</text>
      <text x="100" y="114" textAnchor="middle" className="fill-muted-foreground" fontSize="11">{t("out of")} {max}</text>
    </svg>
  );
}

export function ScoreBar({ f, accent = 1 }: { f: Finding; accent?: FlAccent }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [grow, setGrow] = useState(false);
  useEffect(() => { const id = requestAnimationFrame(() => setGrow(true)); return () => cancelAnimationFrame(id); }, []);
  const max = maxOf(f); const v = f.value ?? 0; const pct = max ? Math.min((v / max) * 100, 100) : null;
  const cmp = max && f.comparison_value != null ? Math.min((f.comparison_value / max) * 100, 100) : null;
  const note = scoreExplain(f.indicator, t.lang);
  return (
    <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} disabled={!note && !f.notes}
      className="group block w-full text-left space-y-1.5 rounded-lg p-2 -m-2 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:hover:bg-transparent">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium inline-flex items-center gap-1.5">{t(f.indicator)}{(note || f.notes) && <Info className={`h-3.5 w-3.5 transition-colors ${open ? FL_TEXT[accent] : "text-muted-foreground group-hover:text-foreground"}`} aria-hidden />}</span>
        <span className="font-serif text-lg font-semibold whitespace-nowrap">{f.value == null ? "n/a" : f.value.toLocaleString("en-GB")}<span className="text-xs text-muted-foreground font-sans font-normal"> {max === 100 && f.unit.startsWith("%") ? "%" : max ? `/ ${max}` : t(f.unit)}</span></span>
      </div>
      {pct != null && <div className="relative h-2.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full" style={{ width: grow ? `${pct}%` : "0%", background: flCss(accent), transition: "width 1s ease-out" }} />
        {cmp != null && <span className="absolute top-0 h-full w-0.5 bg-foreground" style={{ left: `${cmp}%` }} aria-hidden />}
      </div>}
      {open && <div className={`rounded-md border ${FL_BORDER_SOFT[accent]} ${FL_TINT[accent]} p-2.5 text-xs leading-relaxed space-y-1`}>
        {note && <p>{note}</p>}
        {f.notes && <p className="text-muted-foreground">{t(f.notes)}</p>}
        {f.comparison_label && f.comparison_value != null && <p className="text-muted-foreground">{t(f.comparison_label)}: {f.comparison_value}</p>}
      </div>}
    </button>
  );
}

export function SurveyScores({ findings }: { findings: Finding[] }) {
  const t = useT();
  const groups = [...new Set(findings.map((f) => `${f.publisher} — ${f.survey}`))];
  return (
    <div className="space-y-6">
      {groups.map((g) => {
        const items = findings.filter((f) => `${f.publisher} — ${f.survey}` === g);
        const f0 = items[0];
        const hero = items.find((f) => /overall/i.test(f.indicator)) ?? (items.length > 1 ? null : items[0]);
        const target = items.find((f) => /target/i.test(f.indicator));
        const rest = items.filter((f) => f !== hero && f !== target);
        const heroMax = hero ? maxOf(hero) : null;
        const ga = hero ? indicatorAccent(hero.indicator) : indicatorAccent(f0.indicator);
        return (
          <Card key={g} className="overflow-hidden">
            <div className={`px-5 py-3 border-b ${FL_TINT[ga]} flex flex-wrap items-center justify-between gap-2`}>
              <p className="text-sm font-semibold">{t(f0.publisher)} · {t("Survey reference year")}: {f0.survey_year}{f0.published_year ? ` · ${t("Published")}: ${f0.published_year}` : ""}</p>
              <a className="text-xs underline inline-flex items-center gap-1 text-muted-foreground" href={f0.source_url} target="_blank" rel="noopener noreferrer">{t(f0.survey)} <ExternalLink className="h-3 w-3" /></a>
            </div>
            <CardContent className="p-5 grid gap-6 md:grid-cols-[minmax(0,280px)_1fr]">
              {(hero || target) && (
                <div className="flex flex-col items-center text-center gap-3">
                  {hero && hero.value != null && heroMax && <>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{t(hero.indicator)}</p>
                    <Gauge value={hero.value} max={heroMax} target={hero.comparison_value} accent={ga} />
                    {hero.comparison_label && hero.comparison_value != null && <p className="text-xs text-muted-foreground">{t("Dashed line")}: {t(hero.comparison_label)} ({hero.comparison_value})</p>}
                    {scoreExplain(hero.indicator, t.lang) && <p className="text-xs leading-relaxed max-w-[260px]">{scoreExplain(hero.indicator, t.lang)}</p>}
                  </>}
                  {target && target.value != null && (
                    <div className={`w-full rounded-lg ${FL_SOFT[2]} p-4`}>
                      <p className={`font-serif text-4xl font-bold ${FL_TEXT[2]}`}>{target.value}%</p>
                      <p className="text-xs text-muted-foreground">{t(target.indicator)}</p>
                      <div className="mt-2 flex gap-0.5" aria-hidden>{Array.from({ length: 20 }, (_, i) => <span key={i} className={`h-3 flex-1 rounded-sm ${i < Math.round(target.value! / 5) ? FL_BG[2] : "bg-foreground/25"}`} />)}</div>
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-4 self-center">{rest.length > 0 && <p className="text-[11px] text-muted-foreground">{t.lang === "el" ? "Πατήστε μια βαθμολογία για εξήγηση." : "Tap a score to see what it means."}</p>}{rest.map((f) => <ScoreBar key={f.id} f={f} accent={indicatorAccent(f.indicator)} />)}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
