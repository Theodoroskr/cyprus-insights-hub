// Back-office form for news sources the collector (scrape-sources) reads.
// A source is only collected once an editor confirms reuse rights (access_status = 'active').
import type { Database } from "@/integrations/supabase/types";

type SourceInsert = Database["public"]["Tables"]["content_sources"]["Insert"];
type Vertical = Database["public"]["Enums"]["article_vertical"];

export type SourceEdition = "CY" | "GR" | "INT";

export const SOURCE_EDITIONS: { value: SourceEdition; label: string }[] = [
  { value: "CY", label: "Cyprus edition (English)" },
  { value: "GR", label: "Greece edition (Greek)" },
  { value: "INT", label: "International edition" },
];

export const SOURCE_CATEGORIES: { value: string; label: string }[] = [
  { value: "cyprus", label: "Cyprus — regulators, government & companies" },
  { value: "eu", label: "EU institutions" },
  { value: "global", label: "Global institutions" },
  { value: "news", label: "News publisher" },
  { value: "bank", label: "Bank" },
  { value: "regulator", label: "Regulator" },
  { value: "government", label: "Government" },
  { value: "chamber", label: "Chamber / association" },
  { value: "industry", label: "Industry / company" },
  { value: "exchange", label: "Stock exchange" },
  { value: "tourism", label: "Tourism" },
  { value: "funding", label: "Funding" },
  { value: "data", label: "Statistics / data" },
];

export const SOURCE_INTERVALS = [6, 12, 24, 48, 168] as const;

export interface SourceFormInput {
  name: string;
  pageUrl: string;          // full address of the news/listing page
  edition: SourceEdition;
  category: string;
  vertical: Vertical;
  grSection: string;        // Greece edition section (only for GR)
  intervalHours: number;
  autoPublish: boolean;
  rightsConfirmed: boolean; // editor confirms the site's content may be reused
  active: boolean;
  notes: string;
}

export const emptySourceForm = (): SourceFormInput => ({
  name: "", pageUrl: "", edition: "CY", category: "cyprus", vertical: "general",
  grSection: "business", intervalHours: 24, autoPublish: false, rightsConfirmed: false, active: true, notes: "",
});

/** Split a pasted page address into the site address and the page path the collector requests. */
export function splitPageUrl(raw: string): { url: string; scrape_path: string } | null {
  let u: URL;
  try { u = new URL(raw.trim()); } catch { return null; }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  if (!u.hostname.includes(".")) return null;
  const path = `${u.pathname || "/"}${u.search}`;
  return { url: u.origin, scrape_path: path || "/" };
}

/** URL-safe identifier, unique among existing sources. */
export function sourceSlug(name: string, taken: Iterable<string> = [], fallback = ""): string {
  const clean = (t: string) => t
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/^www\./, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
  const fromName = clean(name);
  // Greek-only names leave little Latin text: fall back to the site address.
  const base = (fromName.length >= 3 ? fromName : clean(fallback) || fromName) || "source";
  const used = new Set(taken);
  if (!used.has(base)) return base;
  let n = 2;
  while (used.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

/** First problem with the form, or null when it can be saved. */
export function sourceFormProblem(f: SourceFormInput, existing: { url: string; scrape_path: string; id?: string }[] = [], editingId?: string): string | null {
  if (f.name.trim().length < 2) return "Give the source a name.";
  const parts = splitPageUrl(f.pageUrl);
  if (!parts) return "Paste the full address of the news page, starting with https://";
  const dup = existing.find((s) => s.id !== editingId &&
    s.url.replace(/\/+$/, "").toLowerCase() === parts.url.toLowerCase() && (s.scrape_path || "/") === parts.scrape_path);
  if (dup) return "This page is already in the source list.";
  if (!SOURCE_INTERVALS.includes(f.intervalHours as (typeof SOURCE_INTERVALS)[number])) return "Pick how often to check the page.";
  if (f.autoPublish && !f.rightsConfirmed) return "Stories can only publish by themselves from a source we have permission to reuse.";
  return null;
}

/** Database row for the form. Without confirmed reuse rights the source is saved but never collected. */
export function sourceRow(f: SourceFormInput): Omit<SourceInsert, "slug"> {
  const parts = splitPageUrl(f.pageUrl)!;
  const markets = f.edition === "GR" ? ["GR"] : f.edition === "INT" ? ["INT"] : ["CY"];
  return {
    name: f.name.trim(),
    url: parts.url,
    scrape_path: parts.scrape_path,
    country: f.edition,
    markets,
    category: f.category,
    target_vertical: f.vertical,
    target_section: f.edition === "GR" ? (f.grSection || "business") : null,
    scrape_interval_hours: f.intervalHours,
    access_status: f.rightsConfirmed ? "active" : "pending",
    auto_publish: f.rightsConfirmed && f.autoPublish,
    active: f.active,
    source_notes: f.notes.trim() || null,
  };
}

type SourceRow = Database["public"]["Tables"]["content_sources"]["Row"];

/** Form values for an existing source (for editing). */
export function formFromSource(s: SourceRow): SourceFormInput {
  const edition: SourceEdition = s.country === "GR" ? "GR" : s.country === "INT" ? "INT" : "CY";
  return {
    name: s.name,
    pageUrl: `${s.url.replace(/\/+$/, "")}${s.scrape_path || "/"}`,
    edition,
    category: s.category,
    vertical: s.target_vertical as Vertical,
    grSection: s.target_section || "business",
    intervalHours: s.scrape_interval_hours,
    autoPublish: s.auto_publish,
    rightsConfirmed: s.access_status === "active",
    active: s.active,
    notes: s.source_notes || "",
  };
}
