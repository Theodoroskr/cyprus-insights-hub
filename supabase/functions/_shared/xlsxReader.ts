// Minimal .xlsx reader: turns the unzipped workbook XML into rows of cell values.
// Pure (no imports) — the caller unzips the file (fflate in the edge function, tests use the npm build).

export type Cell = string | number | null;
export type Sheet = { name: string; rows: Cell[][] };

const dec = (b: Uint8Array | string | undefined) => (typeof b === "string" ? b : b ? new TextDecoder().decode(b) : "");
const unxml = (s: string) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, "&");
const attr = (s: string, name: string) => (s.match(new RegExp(`\\b${name}="([^"]*)"`)) || [])[1];
/** Text of all <t> runs, ignoring phonetic hints */
const runs = (xml: string) => [...xml.replace(/<rPh\b[\s\S]*?<\/rPh>/g, "").matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((m) => unxml(m[1])).join("");
const colIndex = (ref: string) => {
  const letters = (ref.match(/^[A-Z]+/) || ["A"])[0];
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
};

export function readXlsxSheets(files: Record<string, Uint8Array | string>, wanted: (name: string) => boolean = () => true): Sheet[] {
  const wb = dec(files["xl/workbook.xml"]);
  const rels = dec(files["xl/_rels/workbook.xml.rels"]);
  const relTarget = new Map<string, string>();
  for (const m of rels.matchAll(/<Relationship\b([^>]*)\/?>/g)) {
    const id = attr(m[1], "Id"), target = attr(m[1], "Target");
    if (id && target) relTarget.set(id, target.startsWith("/") ? target.slice(1) : `xl/${target.replace(/^\.\//, "")}`);
  }
  const shared = [...dec(files["xl/sharedStrings.xml"]).matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map((m) => runs(m[1]));

  const out: Sheet[] = [];
  for (const m of wb.matchAll(/<sheet\b([^>]*)\/?>/g)) {
    const name = unxml(attr(m[1], "name") || "");
    if (!wanted(name)) continue;
    const path = relTarget.get(attr(m[1], "r:id") || "");
    const xml = path ? dec(files[path]) : "";
    const rows: Cell[][] = [];
    for (const r of xml.matchAll(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)) {
      const rowIdx = Number(attr(r[1], "r") || rows.length + 1) - 1;
      const row: Cell[] = [];
      for (const c of (r[2] || "").matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const t = attr(c[1], "t");
        const body = c[2] || "";
        const v = (body.match(/<v>([\s\S]*?)<\/v>/) || [])[1];
        let val: Cell = null;
        if (t === "s") val = v != null ? shared[Number(v)] ?? null : null;
        else if (t === "inlineStr") val = runs(body);
        else if (t === "str" || t === "e") val = v != null ? unxml(v) : null;
        else if (t === "b") val = v === "1" ? "TRUE" : "FALSE";
        else if (v != null && v !== "") val = Number(v);
        row[colIndex(attr(c[1], "r") || "A")] = val;
      }
      rows[rowIdx] = Array.from(row, (x) => x ?? null);
    }
    out.push({ name, rows: Array.from(rows, (x) => x ?? []) });
  }
  return out;
}

/** Excel date serial (1900 system) → ISO date */
export const excelDateToIso = (n: number) => new Date(Date.UTC(1899, 11, 30) + Math.round(n) * 86400000).toISOString().slice(0, 10);
