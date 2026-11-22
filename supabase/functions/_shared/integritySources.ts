// Pure helpers for the Corruption & Public Integrity source check (no network, no AI).
export type IntegritySource = { slug: string; publisher: string; url: string; audience: ("cy" | "gr" | "intl")[]; keywords: RegExp };

export const INTEGRITY_SOURCES: IntegritySource[] = [
  { slug: "ti-news", publisher: "Transparency International", url: "https://www.transparency.org/en/news", audience: ["intl"], keywords: /corruption perceptions|\bCPI\b/i },
  { slug: "ec-rule-of-law", publisher: "European Commission", url: "https://commission.europa.eu/publications/2026-rule-law-report-communication-and-country-chapters_en", audience: ["cy", "gr", "intl"], keywords: /rule of law|country chapter/i },
  { slug: "greco", publisher: "Council of Europe GRECO", url: "https://www.coe.int/en/web/greco", audience: ["cy", "gr", "intl"], keywords: /cyprus|greece|evaluation|compliance report/i },
  { slug: "oecd-wgb", publisher: "OECD Working Group on Bribery", url: "https://www.oecd.org/en/topics/sub-issues/fighting-foreign-bribery.html", audience: ["intl", "gr"], keywords: /bribery|phase \d/i },
  { slug: "cy-anticorruption", publisher: "Independent Authority Against Corruption (Cyprus)", url: "https://www.iaac.org.cy/iaac/iaac.nsf/home/home?openform=", audience: ["cy"], keywords: /investigat|finding|report|corruption|έρευν|πόρισμα|διαφθορ/i },
  { slug: "cy-audit", publisher: "Audit Office of the Republic of Cyprus", url: "https://www.audit.gov.cy/", audience: ["cy"], keywords: /report|έκθεση/i },
  { slug: "gr-nta", publisher: "National Transparency Authority (Greece)", url: "https://aead.gr/", audience: ["gr"], keywords: /έλεγχ|πόρισμ|έρευν|διαφθορ|έκθεσ|παραβ/i },
];

/** Canonical URL for dedupe: lower-case host, no hash, no tracking params, no trailing slash. */
export function canonicalIntegrityUrl(raw: string, base?: string): string {
  const u = new URL(raw, base);
  u.hash = "";
  u.hostname = u.hostname.toLowerCase();
  for (const k of [...u.searchParams.keys()]) if (/^(utm_|fbclid|gclid)/i.test(k)) u.searchParams.delete(k);
  let s = u.toString();
  if (s.endsWith("/") && u.pathname !== "/") s = s.slice(0, -1);
  return s;
}

/** Stable content fingerprint (FNV-1a over normalised text). */
export function contentFingerprint(text: string): string {
  const t = text.toLowerCase().replace(/\s+/g, " ").trim();
  let h = 0x811c9dc5;
  for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, "0");
}

/** Pull candidate links (title + href) from a listing page. */
export function extractLinks(html: string, base: string, keywords: RegExp): { title: string; url: string }[] {
  const out = new Map<string, string>();
  const re = /<a\b[^>]*href="([^"#][^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const title = m[2].replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
    if (title === title.toUpperCase() && /[A-ZΑ-Ω]{6}/.test(title)) continue; // menu items
    if (title.length < 20 || title.length > 240 || !keywords.test(title)) continue;
    try { const url = canonicalIntegrityUrl(m[1], base); if (/^https?:/.test(url)) out.set(url, title); } catch { /* skip */ }
  }
  return [...out].slice(0, 15).map(([url, title]) => ({ url, title }));
}

/** CPI edition published in year N+1 for scores of year N; the next edition page is /en/cpi/<latest+1>. */
export function nextCpiUrl(latestEdition: number): string {
  return `https://www.transparency.org/en/cpi/${latestEdition + 1}`;
}

/** Classify a claim so drafts never present an investigation as a ruling. */
export function claimStatus(title: string): "investigation" | "finding" | "ruling" | "development" {
  if (/convict|sentenc|ruling|judg(e)?ment|καταδίκ|απόφαση δικαστ/i.test(title)) return "ruling";
  if (/finding|report finds|audit report|έκθεση|πόρισμα/i.test(title)) return "finding";
  if (/investigat|probe|inquiry|έρευνα|ερευν/i.test(title)) return "investigation";
  return "development";
}

export type SourceStatus = "ok" | "empty" | "blocked" | "unreachable" | "timeout" | "error";

/** Turn a fetch outcome into a health status + plain-language reason. */
export function classifyFailure(err: unknown, httpCode?: number): { status: SourceStatus; reason: string } {
  if (httpCode === 401 || httpCode === 403 || httpCode === 429) return { status: "blocked", reason: `Site refuses automated access (${httpCode})` };
  if (httpCode === 404 || httpCode === 410) return { status: "unreachable", reason: `Page not found (${httpCode}) — address may have moved` };
  if (httpCode && httpCode >= 500) return { status: "error", reason: `Site error (${httpCode})` };
  const m = String(err instanceof Error ? `${err.name} ${err.message}` : err ?? "");
  if (/dns error|failed to lookup|name or service not known|ENOTFOUND/i.test(m)) return { status: "unreachable", reason: "Address does not exist" };
  if (/timeout|timed out|AbortError/i.test(m)) return { status: "timeout", reason: "Site did not answer within 20 seconds" };
  if (/certificate|tls|ssl|handshake/i.test(m)) return { status: "unreachable", reason: "Secure connection to the site failed" };
  if (/connect|refused|reset/i.test(m)) return { status: "unreachable", reason: "Could not connect to the site" };
  return { status: "error", reason: m.slice(0, 200) || "Unknown error" };
}

/** Working = ok or empty. Alert only when a source moves between working and failing. */
export function isWorking(s: string | null | undefined) { return s === "ok" || s === "empty"; }
export function healthChanged(prev: string | null | undefined, next: SourceStatus): boolean {
  if (!prev || prev === "unknown") return !isWorking(next);
  return isWorking(prev) !== isWorking(next);
}
