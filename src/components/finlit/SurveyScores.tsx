import { ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export type Finding = { id: string; publisher: string; survey: string; survey_year: number; published_year: number | null; indicator: string; value: number | null; unit: string; comparison_label: string | null; comparison_value: number | null; source_url: string; page_ref: string | null; notes: string | null; status: string };

const maxOf = (f: Finding) => { const m = f.unit.match(/out of (\d+)/i); return m ? Number(m[1]) : f.unit.trim().startsWith("%") ? 100 : null; };

function Gauge({ value, max, target }: { value: number; max: number; target?: number | null }) {
  const r = 80, c = Math.PI * r, pct = Math.min(value / max, 1);
  const t = target != null ? Math.PI * (1 - target / max) : null;
  return (
    <svg viewBox="0 0 200 120" className="w-full max-w-[280px]" role="img" aria-label={`${value} out of ${max}`}>
      <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="hsl(var(--muted))" strokeWidth="16" strokeLinecap="round" />
      <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="hsl(var(--primary))" strokeWidth="16" strokeLinecap="round" strokeDasharray={`${c * pct} ${c}`} />
      {t != null && <line x1={100 + 64 * Math.cos(t)} y1={100 - 64 * Math.sin(t)} x2={100 + 98 * Math.cos(t)} y2={100 - 98 * Math.sin(t)} stroke="hsl(var(--foreground))" strokeWidth="2" strokeDasharray="3 2" />}
      <text x="100" y="92" textAnchor="middle" className="fill-foreground font-serif" fontSize="40" fontWeight="700">{value}</text>
      <text x="100" y="114" textAnchor="middle" className="fill-muted-foreground" fontSize="11">out of {max}</text>
    </svg>
  );
}

function Bar({ f }: { f: Finding }) {
  const max = maxOf(f); const v = f.value ?? 0; const pct = max ? Math.min((v / max) * 100, 100) : null;
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{f.indicator}</span>
        <span className="font-serif text-lg font-semibold whitespace-nowrap">{f.value == null ? "n/a" : f.value.toLocaleString("en-GB")}<span className="text-xs text-muted-foreground font-sans font-normal"> {max === 100 && f.unit.startsWith("%") ? "%" : max ? `/ ${max}` : f.unit}</span></span>
      </div>
      {pct != null && <div className="h-2.5 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} /></div>}
      {f.notes && <p className="text-xs text-muted-foreground">{f.notes}</p>}
    </div>
  );
}

export function SurveyScores({ findings }: { findings: Finding[] }) {
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
        return (
          <Card key={g} className="overflow-hidden">
            <div className="px-5 py-3 border-b bg-muted/40 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">{f0.publisher} · Survey reference year: {f0.survey_year}{f0.published_year ? ` · Published: ${f0.published_year}` : ""}</p>
              <a className="text-xs underline inline-flex items-center gap-1 text-muted-foreground" href={f0.source_url} target="_blank" rel="noopener noreferrer">{f0.survey} <ExternalLink className="h-3 w-3" /></a>
            </div>
            <CardContent className="p-5 grid gap-6 md:grid-cols-[minmax(0,280px)_1fr]">
              {(hero || target) && (
                <div className="flex flex-col items-center text-center gap-3">
                  {hero && hero.value != null && heroMax && <>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{hero.indicator}</p>
                    <Gauge value={hero.value} max={heroMax} target={hero.comparison_value} />
                    {hero.comparison_label && hero.comparison_value != null && <p className="text-xs text-muted-foreground">Dashed line: {hero.comparison_label} ({hero.comparison_value})</p>}
                  </>}
                  {target && target.value != null && (
                    <div className="w-full rounded-lg bg-primary/10 p-4">
                      <p className="font-serif text-4xl font-bold text-primary">{target.value}%</p>
                      <p className="text-xs text-muted-foreground">{target.indicator.toLowerCase()}</p>
                      <div className="mt-2 flex gap-0.5" aria-hidden>{Array.from({ length: 20 }, (_, i) => <span key={i} className={`h-3 flex-1 rounded-sm ${i < Math.round(target.value! / 5) ? "bg-primary" : "bg-muted"}`} />)}</div>
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-5 self-center">{rest.map((f) => <Bar key={f.id} f={f} />)}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
