/** Markdown line for a picture placed inside the story text (own paragraph). */
export function imageMarkdown(url: string, caption = ""): string {
  const alt = caption.replace(/[[\]\n]/g, " ").trim();
  return `![${alt}](${url})`;
}

/** Inserts the picture at the cursor, on its own line with blank lines around it. */
export function insertAtCursor(text: string, pos: number | null | undefined, snippet: string): { text: string; cursor: number } {
  const at = pos == null || pos < 0 || pos > text.length ? text.length : pos;
  const before = text.slice(0, at).replace(/[ \t]+$/, "");
  const after = text.slice(at).replace(/^[ \t]+/, "");
  const pre = before === "" ? "" : before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
  const post = after === "" ? "\n" : after.startsWith("\n\n") ? "" : after.startsWith("\n") ? "\n" : "\n\n";
  const head = before + pre + snippet;
  return { text: head + post + after, cursor: head.length + post.length };
}
