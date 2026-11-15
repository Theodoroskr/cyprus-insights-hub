/** Editors paste a YouTube link on a story or press release; the story page shows it as a player. */

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

/** Returns the 11-character YouTube video id, or null when the link is not a YouTube video. */
export function youTubeVideoId(raw: string | null | undefined): string | null {
  const value = (raw ?? "").trim();
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www|m)\./i, "").toLowerCase();
  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0] ?? "";
    return VIDEO_ID.test(id) ? id : null;
  }
  if (!/(^|\.)youtube(-nocookie)?\.com$/.test(host)) return null;
  const parts = url.pathname.split("/").filter(Boolean);
  const candidate =
    url.searchParams.get("v") ??
    (["embed", "shorts", "live", "v"].includes(parts[0]) ? parts[1] ?? "" : "");
  return VIDEO_ID.test(candidate) ? candidate : null;
}

export interface VideoEmbed {
  id: string;
  /** Privacy-friendly player address (no YouTube cookies until the visitor presses play). */
  embedUrl: string;
  /** Picture shown before the visitor presses play. */
  thumbUrl: string;
}

/** The player address for a pasted YouTube link, or null when it is not a YouTube video. */
export function videoEmbed(raw: string | null | undefined): VideoEmbed | null {
  const id = youTubeVideoId(raw);
  if (!id) return null;
  return {
    id,
    embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
    thumbUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  };
}

/** Form check: an empty link is fine, anything else has to be a YouTube video. */
export function videoProblem(raw: string | null | undefined): string | null {
  const value = (raw ?? "").trim();
  if (!value) return null;
  return youTubeVideoId(value)
    ? null
    : "The video link must be a YouTube link, e.g. https://www.youtube.com/watch?v=…";
}
