/**
 * Removes scraped website chrome (menus, logos, language pickers, link lists,
 * cookie banners, footers) from article markdown so only the story remains.
 * Shared by the article page and (mirrored) by the scrape-sources function.
 */

const FOOTER_HEADING =
  /^#{1,6}\s*(ίσως σας ενδιαφέρουν|σχετικά άρθρα|σχετικές ειδήσεις|επικοινωνία|ακολουθήστε μας|related topics|print friendly|contacts? for media|press contacts?|media contacts?|for more information|about us|related sites|related links|related content|get in touch|share the release|contact( us)?|follow us|share this|useful links|quick links|newsletter|subscribe|cookies?|footer|site map|sitemap|legal notice|privacy)\b/i;
/** Plain-text section markers (heading or not) where the source site's own listings start */
const CUT_LINE =
  /^(related (press( & news)?|news|articles|stories|publications)|latest (publications|news)|more news|other news|see also|read more|download (all|selected) files.*)$/i;
const DATE_ONLY = /^(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}|\d{1,2}\s+[a-z]{3,9}\.?\s+\d{4})$/i;
/** Site-wide "we rebuilt the site, tell us what you think" banners, often scraped twice */
const SITE_FEEDBACK =
  /^(welcome to the new .{0,60} website|please share your feedback|share your feedback to help us improve|was this page helpful|did you find this page helpful|have a comment about this page)/i;
const NOISE_LINE =
  /^(print|share|skip to (main )?content|back to top|available languages:.*|press release\s.*\d{4}.*|\d+\.\s*\.\.\.|search|menu|en|el|what are you looking for\??|featured content|no results found\.?|please try again with a different search query\.?|view results|opens in a new tab)$/i;
/** Press-room datelines such as "May 15, 2026 | Miami, FL" */
const DATELINE = /^[a-z]{3,9}\.?\s+\d{1,2},\s+\d{4}\s*(\\?\|\s*[\w .,'-]{2,40})?$/i;

/**
 * Removes website code that scrapers sometimes copy as text: search-widget
 * templates (`${hit.title}`), script/style/button blocks and HTML tags.
 * Simple formatting tags keep their words (<b> becomes bold, <p> a paragraph).
 */
export function stripHtmlArtifacts(text: string): string {
  let t = text;
  t = t.replace(/<(script|style|button|noscript|template|svg|form|select)\b[\s\S]*?<\/\1>/gi, "");
  // Any block carrying JavaScript template code is site chrome, never story text
  t = t
    .split(/\n\s*\n/)
    .filter((b) => !/\$\{[^}]*\}/.test(b))
    .join("\n\n");
  t = t.replace(/<br\s*\/?>/gi, "\n");
  t = t.replace(/<\/?(b|strong)>/gi, "**");
  t = t.replace(/<\/?(i|em)>/gi, "_");
  t = t.replace(/<\/?(p|div|section|article|header|footer|span|li|ul|ol|h[1-6]|a|table|tr|td|th|tbody|thead|figure|figcaption|img|input|label|nav|main|aside|sup|sub|u|small|font|center)\b[^<>]*\/?>/gi, (m) =>
    /^<\/?(p|div|section|article|li|h[1-6]|table|tr|figure)\b/i.test(m) ? "\n\n" : "",
  );
  // Screen-reader hint glued onto link text: "[report opens in a new tab](url)"
  t = t.replace(/[\s\u00a0]*\(?opens in a new (tab|window)\)?(?=\]\()/gi, "");
  return t.replace(/\n{3,}/g, "\n\n");
}

function plain(block: string): string {
  return block
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Share of the block's characters that sit inside link/image syntax */
function linkiness(block: string): number {
  const total = block.replace(/\s+/g, "").length || 1;
  const inLinks = (block.match(/!?\[[^\]]*\]\([^)]*\)/g) || []).join("").replace(/\s+/g, "").length;
  return inLinks / total;
}

function isLinkOnly(block: string): boolean {
  if (/^\s*!\[[^\]]*\]\(https?:[^)]*\)\s*$/.test(block)) return false;
  return linkiness(block) > 0.6 || plain(block).length < 3;
}

function isRealParagraph(block: string): boolean {
  if (/^\s*#/.test(block)) return false;
  const p = plain(block);
  return p.length >= 120 && linkiness(block) < 0.35 && !/available languages/i.test(p);
}

export function cleanArticleMarkdown(raw: string | null | undefined): string {
  if (!raw) return "";
  let text = stripHtmlArtifacts(raw.replace(/\\n/g, "\n").replace(/\r/g, ""));
  // Promo "cards" whose link spans several lines: [**Headline** \\ … opens in a new tab](url)
  text = text.replace(/\[\*\*[^*\n]{3,200}\*\*[ \t]*\\{1,2}[\s\S]{0,800}?\]\(https?:\/\/[^)\s]+\)/g, "");
  // Website "cards": [![alt](img)\\ \\ **Label**](link) -> plain photo
  text = text.replace(/\[(!\[[^\]]*\]\([^)]*\))(?:\s|\\)*(?:\*\*[^*\]]*\*\*)?(?:\s|\\)*\]\([^)]*\)/g, "$1");
  text = text.replace(/^(?:\s*\\)+\s*$/gm, "");
  // Known cookie banners
  text = text.replace(/#{1,3}\s*Cookies on [\w.]+[\s\S]*?\[Adjust\]\([^)]*\)\s*/gi, "");
  text = text.replace(/\[For the analytical data,?\s*(?:please\s+)?click here\.?\]\([^)]*\)/gi, "");

  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);

  // 1. Drop everything before the first real paragraph (menus, logos, breadcrumbs, H1)
  const start = blocks.findIndex(isRealParagraph);
  if (start === -1) return "";
  let body = blocks.slice(start);

  // 2. Cut at the first footer-style heading
  const footer = body.findIndex((b, i) => i > 0 && FOOTER_HEADING.test(b));
  if (footer > 0) body = body.slice(0, footer);
  const cut = body.findIndex((b, i) => i > 0 && CUT_LINE.test(plain(b.split("\n")[0])));
  if (cut > 0) body = body.slice(0, cut);

  // 2b. Drop teaser pairs (date line + cut-off snippet) and broken/empty tables
  body = body.filter((b, i) => {
    const p = plain(b);
    if (DATE_ONLY.test(p) || DATELINE.test(b.trim())) return false;
    if (SITE_FEEDBACK.test(p)) return false;
    if (i > 0 && DATE_ONLY.test(plain(body[i - 1])) && !/[.!?"”]$/.test(p)) return false;
    if (/^\s*\|/.test(b)) {
      const cells = b.split("|").map((c) => c.trim()).filter((c) => c && !/^-+$/.test(c));
      const total = (b.match(/\|/g) || []).length;
      if (cells.length * 2 < total * 0.5 || /\|\s*\|\s*\|/.test(b.split("\n")[0]) && b.split("\n").length === 1) return false;
    }
    return true;
  });

  // 3. Remove noise lines and link-only blocks
  body = body
    .map((b) =>
      b
        .split("\n")
        .filter((l) => !NOISE_LINE.test(plain(l)) && !SITE_FEEDBACK.test(plain(l)))
        .join("\n")
        .trim(),
    )
    .filter((b) => b && !isLinkOnly(b));

  // 4. Trim trailing short fragments (e.g. "Print", contact snippets)
  while (body.length > 1 && plain(body[body.length - 1]).length < 25 && !/^\s*!\[/.test(body[body.length - 1])) body.pop();

  return body.join("\n\n").trim();
}

/** Plain-text word count of cleaned markdown — used to decide if the body is worth showing */
export function cleanedWordCount(md: string): number {
  return plain(md).split(" ").filter(Boolean).length;
}
