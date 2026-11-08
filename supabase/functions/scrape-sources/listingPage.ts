// Helpers for a source's news listing page (pure, no Deno APIs — unit tested).

const ERROR_PAGE = new RegExp(
  [
    "^\\s*#*\\s*404\\b",
    "page not found",
    "page (?:you (?:are|were) looking for )?(?:could not be found|is no longer here|does not exist)",
    "the requested url .* was not found",
    "404 - file or directory not found",
    "^\\s*#*\\s*server error",
    "^\\s*#*\\s*not found\\s*$",
    "access denied",
    "error 404",
  ].join("|"),
  "im",
);

/** Why the listing page is unusable, or null when it looks like a real page. */
export function listingPageProblem(markdown: string, statusCode?: number | null): string | null {
  if (statusCode && statusCode >= 400) {
    return statusCode === 404 || statusCode === 410
      ? `News page not found (HTTP ${statusCode}) — the site has moved it`
      : `News page returned HTTP ${statusCode}`;
  }
  const text = (markdown || "").trim();
  if (text.length < 100) return "No meaningful content scraped";
  // Look at the top of the page (and the page title) only — articles may mention "404" later.
  const head = text.slice(0, 600);
  if (text.length < 3000 && ERROR_PAGE.test(head)) return "News page not found — the site has moved it";
  if (/^[^\n]*(?:page not found|error 404|404 not found)/i.test(head)) return "News page not found — the site has moved it";
  return null;
}

/**
 * Duplicate-check key for an article URL. Keeps meaningful query strings
 * (e.g. GetFile.aspx?guid=…, PressRelease?id=…) and drops only tracking parameters.
 */
export function canonicalArticleUrl(url: string | null | undefined): string | null {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  try {
    const u = new URL(url.trim());
    u.hash = "";
    for (const key of [...u.searchParams.keys()]) {
      if (/^(utm_|fbclid$|gclid$|mc_cid$|mc_eid$|ref$|lang$)/i.test(key)) u.searchParams.delete(key);
    }
    u.searchParams.sort();
    const path = u.pathname.replace(/\/+$/, "");
    const qs = u.searchParams.toString();
    return `${u.protocol}//${u.host}${path}${qs ? `?${qs}` : ""}`.toLowerCase();
  } catch {
    return null;
  }
}

const LANGUAGE_LINK = /^\s*[-*]?\s*\[(?:[a-z]{2})?(?:български|español|čeština|dansk|deutsch|eesti|ελληνικά|english|français|gaeilge|hrvatski|italiano|latviešu|lietuvių|magyar|malti|nederlands|polski|português|română|slovenčina|slovenščina|suomi|svenska|русский|українська|türkçe)\]\([^)]*\)\s*$/i;

/**
 * Trim site chrome from a listing page so the article list fits the extraction budget.
 * Keeps links and images (needed for article URLs and photos).
 */
export function prepareListingMarkdown(markdown: string, maxChars = 20000): string {
  const lines = (markdown || "").split("\n");
  const kept: string[] = [];
  for (const line of lines) {
    const l = line.trim();
    if (LANGUAGE_LINK.test(l)) continue;
    if (/^\[skip to (?:main )?content\]/i.test(l)) continue;
    if (/cookie|accept all|accept only essential|privacy settings/i.test(l) && l.length < 300) continue;
    if (/^(?:select your language|close|✕|×)$/i.test(l)) continue;
    if (/official (?:website of the european union|eu website)|how do you know\?|addresses are in the \*\*europa\.eu\*\*/i.test(l)) continue;
    // Empty table scaffolding ("|  |  |", "| --- |").
    if (/^\s*\|[\s|:-]*\|?\s*$/.test(line)) continue;
    kept.push(line);
  }
  let text = dropMenus(kept).join("\n").replace(/\n{3,}/g, "\n\n").trim();
  // Still too long: the page's main title usually marks where the real list starts.
  if (text.length > maxChars) {
    const h1 = text.search(/^# \S/m);
    if (h1 > 0 && text.length - h1 >= 1500) text = text.slice(h1);
  }
  return text.slice(0, maxChars);
}

// A bullet or table cell holding only a short link ("Starting a Company").
const MENU_LINK = /^\s*(?:[-*+]|\|(?:\s*\|)*)?\s*\[([^\]]{1,40})\]\([^)]*\)\s*\|?\s*$/;

function isMenuLine(line: string): boolean {
  const m = line.match(MENU_LINK);
  return !!m && m[1].trim().split(/\s+/).length <= 5;
}

/** Remove runs of 3+ short-link lines (site menus); a lone short headline is kept. */
function dropMenus(lines: string[]): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    if (!isMenuLine(lines[i])) { out.push(lines[i]); i++; continue; }
    let j = i;
    const run: string[] = [];
    while (j < lines.length && (isMenuLine(lines[j]) || lines[j].trim() === "")) { run.push(lines[j]); j++; }
    if (run.filter(isMenuLine).length < 3) out.push(...run);
    i = j;
  }
  return out;
}
