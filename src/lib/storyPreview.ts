// Builds per-story HTML (copy of built index.html with that story's head tags) so
// link-preview robots (Facebook, WhatsApp, LinkedIn) see the story's own title/photo.
const SITE = "https://businesshub.cy";

export interface PreviewStory {
  id: string;
  title: string;
  summary: string | null;
  what_happened?: string | null;
  image_url: string | null;
  vertical: string | null;
}

const HUB_IMAGES: Record<string, string> = {
  fintech: `${SITE}/images/og-fintechhub.png`,
  compliance: `${SITE}/images/og-compliancehub.png`,
  regtech: `${SITE}/images/og-regtechhub.png`,
};

// Sites known to block preview robots from fetching their photos.
const BLOCKED_IMAGE_HOSTS = ["gov.cy"];

export function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function plainText(s: string | null | undefined, max = 200): string {
  const t = (s ?? "").replace(/[#*_>`\[\]]/g, "").replace(/\(https?:[^)]*\)/g, "").replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max - 1).trimEnd() + "…" : t;
}

export function previewImage(story: Pick<PreviewStory, "image_url" | "vertical">): string {
  const url = story.image_url ?? "";
  if (/^https:\/\//.test(url)) {
    try {
      const host = new URL(url).hostname;
      if (!BLOCKED_IMAGE_HOSTS.some((h) => host === h || host.endsWith("." + h))) return url;
    } catch { /* fall through */ }
  }
  return HUB_IMAGES[story.vertical ?? ""] ?? `${SITE}/images/og-businesshub.png`;
}

export function storyUrl(id: string): string {
  return `${SITE}/article/${id}`;
}

export function buildStoryHtml(template: string, story: PreviewStory): string {
  const title = escapeAttr(`${plainText(story.title, 110)} | BusinessHub.cy`);
  const desc = escapeAttr(plainText(story.summary || story.what_happened) || "Cyprus business intelligence from BusinessHub.cy.");
  const img = escapeAttr(previewImage(story));
  const url = escapeAttr(storyUrl(story.id));
  const isOwnImage = img.startsWith(`${SITE}/images/og-`);
  // Drop the site-wide fallback tags; replace with this story's.
  let html = template.replace(/\s*<meta data-rh="true"[^>]*>/g, "").replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  const tags = [
    `<meta data-rh="true" name="description" content="${desc}" />`,
    `<link data-rh="true" rel="canonical" href="${url}" />`,
    `<meta data-rh="true" property="og:type" content="article" />`,
    `<meta data-rh="true" property="og:site_name" content="BusinessHub.cy" />`,
    `<meta data-rh="true" property="og:url" content="${url}" />`,
    `<meta data-rh="true" property="og:title" content="${title}" />`,
    `<meta data-rh="true" property="og:description" content="${desc}" />`,
    `<meta data-rh="true" property="og:image" content="${img}" />`,
    ...(isOwnImage ? [`<meta data-rh="true" property="og:image:width" content="1200" />`, `<meta data-rh="true" property="og:image:height" content="630" />`] : []),
    `<meta data-rh="true" name="twitter:card" content="summary_large_image" />`,
    `<meta data-rh="true" name="twitter:title" content="${title}" />`,
    `<meta data-rh="true" name="twitter:description" content="${desc}" />`,
    `<meta data-rh="true" name="twitter:image" content="${img}" />`,
  ].join("\n    ");
  html = html.replace("</head>", `    ${tags}\n  </head>`);
  return html;
}
