export type ArticleSegment =
  | { type: "text"; markdown: string }
  | { type: "gallery"; images: { src: string; alt: string }[] };

const IMG_LINE = /^\s*(?:\[)?!\[([^\]]*)\]\(([^)\s]+)[^)]*\)(?:\]\([^)]*\))?\s*$/;

/** Same picture regardless of query string, hash, size suffix (-300x200) or @2x. */
export function normalizeImageUrl(url: string): string {
  return url
    .split(/[?#]/)[0]
    .toLowerCase()
    .replace(/^https?:\/\/(www\.)?/, "")
    .replace(/(-\d{2,4}x\d{2,4}|@\dx|-scaled)(?=\.[a-z0-9]+$)/, "");
}

/** Splits markdown so runs of 2+ image-only lines become one gallery segment.
 *  Repeated photos (and the article's main photo) are dropped. */
export function groupArticleImages(markdown: string, heroUrl?: string | null): ArticleSegment[] {
  const seen = new Set<string>();
  if (heroUrl) seen.add(normalizeImageUrl(heroUrl));
  const lines = markdown.split("\n");
  const segments: ArticleSegment[] = [];
  let text: string[] = [];
  let run: { src: string; alt: string }[] = [];
  let runRaw: string[] = [];

  const flushRun = () => {
    if (run.length >= 2) {
      if (text.length) segments.push({ type: "text", markdown: text.join("\n") });
      text = [];
      segments.push({ type: "gallery", images: run });
    } else {
      text.push(...runRaw);
    }
    run = [];
    runRaw = [];
  };

  for (const line of lines) {
    const m = line.match(IMG_LINE);
    if (m) {
      const key = normalizeImageUrl(m[2]);
      if (seen.has(key)) continue;
      seen.add(key);
      run.push({ alt: m[1], src: m[2] });
      runRaw.push(line);
    } else if (line.trim() === "" && run.length) {
      runRaw.push(line);
    } else {
      flushRun();
      text.push(line);
    }
  }
  flushRun();
  if (text.length) segments.push({ type: "text", markdown: text.join("\n") });
  return segments;
}

const FIRST_IMG = /!\[[^\]]*\]\((https?:\/\/[^)\s]+)[^)]*\)/;
/** First photo inside the story text, used as the main photo when the story has none. */
export function extractFirstImage(markdown: string | null | undefined): string | null {
  const m = (markdown || "").match(FIRST_IMG);
  return m ? m[1] : null;
}
