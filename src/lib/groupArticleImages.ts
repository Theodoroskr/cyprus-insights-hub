export type ArticleSegment =
  | { type: "text"; markdown: string }
  | { type: "gallery"; images: { src: string; alt: string }[] };

const IMG_LINE = /^\s*(?:\[)?!\[([^\]]*)\]\(([^)\s]+)[^)]*\)(?:\]\([^)]*\))?\s*$/;

/** Splits markdown so runs of 2+ image-only lines become one gallery segment. */
export function groupArticleImages(markdown: string): ArticleSegment[] {
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
