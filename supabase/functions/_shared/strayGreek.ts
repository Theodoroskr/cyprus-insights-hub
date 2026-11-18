/**
 * English-language source pages sometimes carry Greek website leftovers: language
 * switchers ("ΕΛΛΗΝΙΚΑ", "ελληνικά"), internal web-team notes pasted above the
 * article, or bare WordPress image/author/date strings. These are removed from
 * English stories so a reader never sees a half-Greek, half-English article.
 * Greek lines that remain after clean-up are real content → caller translates.
 */
const GREEK = /[\u0370-\u03FF\u1F00-\u1FFF]/g;
const LATIN = /[A-Za-z]/g;
const LANG_NAMES = /^(?:български|español|čeština|dansk|deutsch|eesti|ελληνικά|english|français|gaeilge|hrvatski|italiano|latviešu|lietuvių|magyar|malti|nederlands|polski|português|română|slovenčina|slovenščina|suomi|svenska|русский|українська|el|en|gr|ελ|switch to ελληνικα|αλλαγή σε ελληνικα|μετάβαση σε ελληνικα)$/iu;

/** Visible text of a Markdown line: link labels kept, URLs and images dropped. */
function visibleText(line: string): string {
  return line
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, " $1 ")
    .replace(/https?:\/\/\S+/g, " ");
}

function count(re: RegExp, s: string): number {
  return (s.match(re) || []).length;
}

/** A line whose readable text is mostly Greek. */
export function isGreekLine(line: string): boolean {
  const t = visibleText(line);
  const g = count(GREEK, t);
  return g >= 8 && g > count(LATIN, t);
}

/** A line made only of language-picker links / flags (e.g. "- [ΕΛΛΗΝΙΚΑ](…)"). */
export function isLanguageSwitcher(line: string): boolean {
  if (!/\]\(/.test(line)) return false;
  const labels = [...line.matchAll(/!?\[([^\]]*)\]\([^)]*\)/g)].map((m) => m[1].trim()).filter(Boolean);
  if (!labels.length) return false;
  const rest = line.replace(/!?\[[^\]]*\]\([^)]*(?:\s+"[^"]*")?\)/g, "").replace(/[\s\-*|•·,]/g, "");
  return rest === "" && labels.every((l) => LANG_NAMES.test(l) || /^!?\[?el\]?$/i.test(l));
}

/** Bare WordPress meta strings: "https://…/logo_EN.png00Author2026-11-09 11:06:00…". */
export function isBareMediaMeta(line: string): boolean {
  return /^\s*https?:\/\/\S+?\.(?:png|jpe?g|gif|svg|webp)/i.test(line) && !/^\s*https?:\/\/\S+\s*$/.test(line.replace(/\\_/g, "_")) || /\.(?:png|jpe?g)\d*[A-Z][^\n]*\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(line);
}

/** Greek website labels on English pages, with their English wording ("" = drop). */
const LABELS: Array<[RegExp, string]> = [
  [/Λήψη Αρχείου\s*(Word|PDF|Excel)?/gu, "Download $1 file"],
  [/Στοιχεία Επικοινωνίας/gu, "Contact details"],
];
/** Greek chrome lines: print buttons, "published on" meta, "Ελληνικά | English". */
const CHROME = /^(?:Εκτύπωση|Κοινοποίηση|Ελληνικά\s*\\?\|\s*English|Δημοσιεύτηκε στις .*)$/u;
/** Headings that start a "related articles" tail — everything after goes. */
const TAIL = /^#{1,6}\s*(?:Σχετικά Άρθρα|Σχετικές Ειδήσεις|Δείτε επίσης)\s*$/u;

/** "[**Προγράμματα**](x) [**Programmes**](x)" → keep only the English twin. */
export function dropGreekTwinLinks(line: string): string {
  const links = [...line.matchAll(/\[([^\]]*)\]\([^)]*\)/g)];
  const label = (m: RegExpMatchArray) => m[1].replace(/[*_!]/g, "");
  if (!links.some((m) => count(LATIN, label(m)) >= 3 && !count(GREEK, label(m)))) return line;
  let out = line;
  for (const m of links) if (count(GREEK, label(m)) >= 4 && count(GREEK, label(m)) > count(LATIN, label(m))) out = out.replace(m[0], "");
  return out;
}

export interface StrayGreekResult {
  body: string;
  /** Greek lines still present (real content) — translate the body. */
  greekLeft: boolean;
  removed: number;
}

/** Clean an English story body. Leaves mainly-Greek bodies untouched (they get translated whole). */
export function removeStrayGreek(body: string): StrayGreekResult {
  if (!body) return { body, greekLeft: false, removed: 0 };
  const lines = body.split("\n");
  const out: string[] = [];
  let removed = 0;
  let seenEnglish = false;
  let inContact = false;
  for (const raw of lines) {
    let line = raw;
    for (const [re, en] of LABELS) line = line.replace(re, (_m, g1) => en.replace("$1 ", g1 ? `${g1} ` : "")).replace(/\s{2,}/g, " ");
    line = dropGreekTwinLinks(line);
    const trimmed = line.trim();
    if (!trimmed) { out.push(line); continue; }
    if (TAIL.test(trimmed)) { removed++; break; }
    if (/^#{1,6}\s/.test(trimmed)) inContact = /^#{1,6}\s*contact details\s*$/i.test(trimmed);
    if (inContact && isGreekLine(trimmed)) { removed++; continue; }
    // "- [Greek page title](url)" menu / related-link items on an English page.
    if (/^[-*]\s*\[[^\]]+\]\([^)]*\)\s*$/.test(trimmed) && isGreekLine(trimmed)) { removed++; continue; }
    if (CHROME.test(trimmed)) { removed++; continue; }
    if (isLanguageSwitcher(trimmed) || isBareMediaMeta(trimmed)) { removed++; continue; }
    if (isGreekLine(trimmed)) {
      // Greek text above the first English paragraph is site chrome / internal notes.
      if (!seenEnglish) { removed++; continue; }
    } else if (count(LATIN, visibleText(trimmed)) >= 20) {
      seenEnglish = true;
    }
    out.push(line);
  }
  // Greek lines after the last English paragraph are footer chrome (addresses, menus).
  let lastEnglish = -1;
  out.forEach((l, i) => { if (!isGreekLine(l.trim()) && count(LATIN, visibleText(l)) >= 20) lastEnglish = i; });
  for (let i = out.length - 1; i > lastEnglish && lastEnglish >= 0; i--) {
    if (isGreekLine(out[i].trim())) { out.splice(i, 1); removed++; }
  }
  const cleaned = out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  return { body: cleaned, greekLeft: cleaned.split("\n").some((l) => isGreekLine(l.trim())), removed };
}
