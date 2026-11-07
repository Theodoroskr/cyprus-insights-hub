/**
 * Removes scraped website chrome (menus, logos, language pickers, link lists,
 * cookie banners, footers) from article markdown so only the story remains.
 * Shared by the article page and (mirrored) by the scrape-sources function.
 */

const FOOTER_HEADING =
  /^#{1,6}\s*(ίσως σας ενδιαφέρουν|σχετικά άρθρα|σχετικές ειδήσεις|επικοινωνία|ακολουθήστε μας|related topics|print friendly|contacts? for media|press contacts?|media contacts?|for more information|about us|related sites|related links|related content|contact( us)?|follow us|share this|useful links|quick links|newsletter|subscribe|cookies?|footer|site map|sitemap|legal notice|privacy)\b/i;
/** Plain-text section markers (heading or not) where the source site's own listings start */
const CUT_LINE =
  /^(related (press( & news)?|news|articles|stories|publications)|latest (publications|news)|more news|other news|see also|read more|download (all|selected) files.*)$/i;
const DATE_ONLY = /^(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}|\d{1,2}\s+[a-z]{3,9}\.?\s+\d{4})$/i;
const NOISE_LINE =
  /^(print|share|skip to (main )?content|back to top|available languages:.*|press release\s.*\d{4}.*|\d+\.\s*\.\.\.|search|menu|en|el)$/i;

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
  return linkiness(block) > 0.6 || plain(block).length < 3;
}

function isRealParagraph(block: string): boolean {
  if (/^\s*#/.test(block)) return false;
  const p = plain(block);
  return p.length >= 120 && linkiness(block) < 0.35 && !/available languages/i.test(p);
}

export function cleanArticleMarkdown(raw: string | null | undefined): string {
  if (!raw) return "";
  let text = raw.replace(/\\n/g, "\n").replace(/\r/g, "");
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
    if (DATE_ONLY.test(p)) return false;
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
        .filter((l) => !NOISE_LINE.test(plain(l)))
        .join("\n")
        .trim(),
    )
    .filter((b) => b && !isLinkOnly(b));

  // 4. Trim trailing short fragments (e.g. "Print", contact snippets)
  while (body.length > 1 && plain(body[body.length - 1]).length < 25) body.pop();

  return body.join("\n\n").trim();
}

/** Plain-text word count of cleaned markdown — used to decide if the body is worth showing */
export function cleanedWordCount(md: string): number {
  return plain(md).split(" ").filter(Boolean).length;
}
