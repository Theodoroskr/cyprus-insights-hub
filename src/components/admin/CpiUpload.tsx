import { useState } from "react";
import { readSheet } from "read-excel-file/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CPI_SHEET, diffCpi, parseCpiSheet, type CpiRow } from "../../../supabase/functions/_shared/cpiWorkbook";

type Pub = { country_iso3: string; country_name: string; score: number | null; rank: number | null };

/** Added / changed / removed summary between published figures and an uploaded or staged set. */
export function CpiChanges({ published, next }: { published: Pub[]; next: CpiRow[] }) {
  const d = diffCpi(published, next);
  const key = ["CYP", "GRC"].map((i) => next.find((r) => r.country_iso3 === i)).filter(Boolean) as CpiRow[];
  const list = [...d.changed, ...d.added, ...d.removed].slice(0, 15);
  return (
    <div className="space-y-1 text-xs">
      <p>
        <strong>{next.length}</strong> countries · {d.added.length} new · {d.changed.length} changed · {d.removed.length} removed · {d.unchanged} unchanged
        {published.length === 0 && " (nothing published for this edition yet)"}
      </p>
      {key.length > 0 && <p>{key.map((r) => `${r.country_name} ${r.score}/100, ${r.rank_tied ? "tied " : ""}${r.rank}`).join(" · ")}</p>}
      {published.length > 0 && list.length > 0 && (
        <ul className="max-h-40 overflow-auto border rounded p-2">
          {list.map((c) => (
            <li key={c.iso}>{c.name}: {c.before ? `${c.before.score ?? "—"} · #${c.before.rank ?? "—"}` : "new"} → {c.after ? `${c.after.score} · #${c.after.rank}` : "removed"}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Upload a Transparency International "Country Rankings" workbook, preview it, then stage it for review. */
export function CpiUpload({ busy, onStage, publishedFor }: { busy: boolean; onStage: (table: unknown[][], release: string) => void; publishedFor: (year: number) => Promise<Pub[]> }) {
  const [table, setTable] = useState<unknown[][] | null>(null);
  const [rows, setRows] = useState<{ year: number; rows: CpiRow[]; published: Pub[] } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [release, setRelease] = useState("");

  const pick = async (f: File | undefined) => {
    setRows(null); setErrors([]); setTable(null);
    if (!f) return;
    try {
      const t = (await readSheet(f, CPI_SHEET)) as unknown[][];
      const p = parseCpiSheet(t);
      if ("errors" in p) { setErrors(p.errors); return; }
      setTable(t);
      setRows({ year: p.year, rows: p.rows, published: await publishedFor(p.year) });
    } catch (e) {
      setErrors([`Could not read the "${CPI_SHEET}" sheet: ${e instanceof Error ? e.message : String(e)}`]);
    }
  };

  return (
    <div className="border rounded p-3 space-y-2">
      <p className="text-muted-foreground">Upload the Transparency International workbook (.xlsx with a "{CPI_SHEET}" sheet). Nothing goes public until you publish the staged edition.</p>
      <div className="flex flex-wrap gap-2 items-center">
        <Input type="file" accept=".xlsx" aria-label="CPI workbook" className="max-w-xs h-9" onChange={(e) => pick(e.target.files?.[0])} />
        <label className="flex items-center gap-1 text-xs">Release date <Input type="date" className="h-9 w-40" value={release} onChange={(e) => setRelease(e.target.value)} /></label>
      </div>
      {errors.length > 0 && <ul className="text-destructive text-xs list-disc pl-4">{errors.map((e) => <li key={e}>{e}</li>)}</ul>}
      {rows && (
        <div className="space-y-2">
          <p className="font-medium">Preview changes — CPI {rows.year}</p>
          <CpiChanges published={rows.published} next={rows.rows} />
          <Button size="sm" disabled={busy || !table} onClick={() => table && onStage(table, release)}>Stage CPI {rows.year} for review</Button>
        </div>
      )}
    </div>
  );
}
