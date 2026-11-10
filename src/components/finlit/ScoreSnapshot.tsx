import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from "recharts";
import { ExternalLink } from "lucide-react";
import { useT } from "@/lib/finlitI18n";
import { scoreExplain } from "@/lib/finlitExplain";
import { Gauge, ScoreBar, maxOf, type Finding } from "@/components/finlit/SurveyScores";

const COMPONENTS = [/^financial knowledge$/i, /^financial behaviour$/i, /^financial attitudes$/i, /^digital financial literacy$/i];
const SHORT = { en: ["Knowledge", "Behaviour", "Attitudes", "Digital"], el: ["Γνώσεις", "Συμπεριφορά", "Στάσεις", "Ψηφιακές"] };

/** Dashboard snapshot of the OECD survey: score dial, target share, and a radar of the four components (each as % of its maximum). */
export function ScoreSnapshot({ findings }: { findings: Finding[] }) {
  const t = useT();
  const overall = findings.find((f) => /overall/i.test(f.indicator));
  const target = findings.find((f) => /target score/i.test(f.indicator));
  const found = COMPONENTS.map((r, i) => ({ f: findings.find((f) => r.test(f.indicator)), i })).filter((x): x is { f: Finding; i: number } => !!x.f && x.f.value != null && !!maxOf(x.f));
  const parts = found.map((x) => x.f);
  const radar = found.map(({ f, i }) => ({ id: f.id, name: SHORT[t.lang === "el" ? "el" : "en"][i], pct: Math.round((f.value! / maxOf(f)!) * 100), raw: `${f.value} / ${maxOf(f)}` }));
  const src = overall ?? findings[0];
  if (!src) return null;
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-2xl border bg-card p-5 flex flex-col items-center text-center gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("Overall financial literacy score")}</p>
        {overall?.value != null && <Gauge value={overall.value} max={maxOf(overall) ?? 100} target={overall.comparison_value} />}
        {overall?.comparison_value != null && <p className="text-xs text-muted-foreground">{t("Dashed line")}: {t(overall.comparison_label)} ({overall.comparison_value})</p>}
        {target?.value != null && (
          <div className="w-full rounded-xl bg-primary/10 p-3">
            <p className="font-serif text-3xl font-bold text-primary">{target.value}%</p>
            <p className="text-xs text-muted-foreground">{t(target.indicator)}</p>
            <div className="mt-2 flex gap-0.5" aria-hidden>{Array.from({ length: 20 }, (_, i) => <span key={i} className={`h-2.5 flex-1 rounded-sm ${i < Math.round(target.value! / 5) ? "bg-primary" : "bg-muted"}`} />)}</div>
          </div>
        )}
        <a className="mt-auto text-[11px] underline inline-flex items-center gap-1 text-muted-foreground" href={src.source_url} target="_blank" rel="noopener noreferrer">{t(src.publisher)} · {src.survey_year}{src.published_year ? ` / ${src.published_year}` : ""} <ExternalLink className="h-3 w-3" /></a>
      </div>

      <div className="rounded-2xl border bg-card p-5 lg:col-span-2 grid gap-4 md:grid-cols-2 items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lang === "el" ? "Ανάλυση βαθμολογίας (% του μέγιστου)" : "Score breakdown (% of maximum)"}</p>
          {radar.length >= 3 && <div className="h-72" role="img" aria-label={radar.map((r) => `${r.name} ${r.pct}%`).join(", ")}>
            <ResponsiveContainer><RadarChart data={radar} outerRadius="78%">
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 600, fill: "hsl(var(--foreground))" }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Tooltip formatter={(v: number, _n, p) => [`${v}% (${p.payload.raw})`, t.lang === "el" ? "Κύπρος" : "Cyprus"]} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
              <Radar dataKey="pct" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} strokeWidth={2} dot={{ r: 3, fill: "hsl(var(--primary))" }} />
            </RadarChart></ResponsiveContainer>
          </div>}
        </div>
        <div className="space-y-3">
          <p className="text-[11px] text-muted-foreground">{t.lang === "el" ? "Πατήστε μια βαθμολογία για εξήγηση." : "Tap a score to see what it means."}</p>
          {parts.map((f) => <ScoreBar key={f.id} f={f} />)}
          {overall && scoreExplain(overall.indicator, t.lang) && <p className="text-xs text-muted-foreground border-l-2 border-accent pl-2">{scoreExplain(overall.indicator, t.lang)}</p>}
        </div>
      </div>
    </div>
  );
}
