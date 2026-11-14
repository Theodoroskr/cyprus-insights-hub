// Runs after `vite build` (postbuild): writes dist/<path>/index.html for section pages,
// districts, places, announcements, compliance records, resources and indexable companies,
// each with its own title, description and self-referencing canonical, so search engines
// don't treat them as copies of the homepage. Skips (without failing the publish) if the
// database can't be reached; section pages are written regardless.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { STATIC_ENTRIES } from "../src/lib/sitemap";
import { buildPageHtml, companyHead, sectionHead, type PageHead } from "../src/lib/pageHeads";
import { indexableCompanies } from "./indexableCompanies";

function readEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  const file = resolve(".env");
  if (existsSync(file)) for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/.exec(line);
    if (m) env[m[1]] = m[2];
  }
  return { ...env, ...(process.env as Record<string, string>) };
}
const env = readEnv();
const API_URL = env.VITE_SUPABASE_URL, API_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function fetchAll<T>(table: string, query: string): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const res = await fetch(`${API_URL}/rest/v1/${table}?${query}`, { headers: { apikey: API_KEY, Authorization: `Bearer ${API_KEY}`, Range: `${from}-${from + 999}` } });
    if (!res.ok) throw new Error(`${table}: HTTP ${res.status}`);
    const batch = (await res.json()) as T[];
    rows.push(...batch);
    if (batch.length < 1000) return rows;
  }
}

const tplPath = resolve("dist/index.html");
let written = 0;
function write(template: string, p: PageHead) {
  if (!/^\/[A-Za-z0-9\-/._~%]+$/.test(p.path) || p.path.includes("..")) return;
  const dir = resolve("dist" + decodeURIComponent(p.path));
  if (!dir.startsWith(resolve("dist"))) return;
  if (existsSync(resolve(dir, "index.html"))) return; // a more specific writer already made it
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, "index.html"), buildPageHtml(template, p));
  written++;
}
const safe = <T,>(p: Promise<T[]>) => p.catch((e) => { console.warn("page heads:", e.message); return [] as T[]; });

async function main() {
  if (!existsSync(tplPath)) throw new Error("dist/index.html missing");
  const template = readFileSync(tplPath, "utf8");
  for (const e of STATIC_ENTRIES) { const h = sectionHead(e.path); if (h) write(template, h); }
  if (!API_URL || !API_KEY) throw new Error("database URL/key not set");
  const [dests, places, anns, items, res, companies] = await Promise.all([
    safe(fetchAll<{ slug: string; name_en: string; intro_en: string | null }>("tour_destinations", "select=slug,name_en,intro_en&status=eq.published")),
    safe(fetchAll<{ slug: string; name_en: string; summary_en: string | null }>("tour_listings", "select=slug,name_en,summary_en&status=eq.published")),
    safe(fetchAll<{ slug: string; title: string; summary: string | null; company_name: string | null }>("company_announcements", "select=slug,title,summary,company_name&status=eq.published")),
    safe(fetchAll<{ slug: string; title_en: string | null; official_title: string | null; summary_en: string | null }>("compliance_items", "select=slug,title_en,official_title,summary_en&status=eq.published&slug=not.is.null")),
    safe(fetchAll<{ slug: string; title: string; description: string | null }>("resources", "select=slug,title,description&is_published=eq.true")),
    indexableCompanies(fetchAll).catch((e) => { console.warn("page heads: companies", e.message); return []; }),
  ]);
  for (const d of dests) write(template, { path: `/explore/${d.slug}`, title: `${d.name_en} — Explore Cyprus | TourismHub`, description: d.intro_en ?? `Visiting ${d.name_en}, Cyprus.` });
  for (const p of places) write(template, { path: `/explore/place/${p.slug}`, title: `${p.name_en} — TourismHub`, description: p.summary_en ?? `${p.name_en}, Cyprus.` });
  for (const a of anns) write(template, { path: `/company-announcements/${a.slug}`, title: a.title, description: a.summary ?? `${a.company_name ?? "Company"} announcement.`, type: "article" });
  for (const c of items) write(template, { path: `/compliance/regulatory-updates/${c.slug}`, title: `${c.title_en || c.official_title || c.slug} — ComplianceHub`, description: c.summary_en ?? "Regulatory update for Cyprus firms.", type: "article" });
  for (const r of res) write(template, { path: `/resources/${r.slug}`, title: r.title, description: r.description ?? r.title });
  for (const c of companies) if (c.slug) write(template, companyHead(c));
  console.log(`page heads: wrote ${written} pages`);
}
main().catch((e) => console.warn("page heads partial:", e.message, `(${written} written)`));
