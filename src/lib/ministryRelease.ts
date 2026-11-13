// Manual intake for official Deputy Ministry of Tourism releases (crawler is blocked by the site's firewall).
import { canonicalArticleUrl } from "../../supabase/functions/scrape-sources/listingPage";

export const TOURISM_SOURCE_SLUG = "deputy-ministry-tourism";
export const TOURISM_TOPICS = ["Tourism policy", "Grants & deadlines", "Hospitality investment", "Destination campaigns", "Business notice"] as const;

export interface MinistryReleaseInput {
  url: string; sourceHeadline: string; sourceDate: string; topic: string; language: "en" | "el";
  headline: string; summary: string; whatChanged: string; whoAffected: string; action: string;
}

/** Validates the form; returns an error message or null. */
export function releaseProblem(f: MinistryReleaseInput): string | null {
  if (!/^https:\/\/(www\.)?gov\.cy\/tourism\//i.test(f.url.trim())) return "Use the original release link on gov.cy/tourism";
  if (!f.sourceHeadline.trim() || !f.headline.trim() || !f.summary.trim()) return "Source headline, headline and summary are required";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.sourceDate)) return "Enter the Ministry's announcement date";
  return null;
}

/** Builds the draft story row. The Ministry's date is kept in the body, separate from BusinessHub's published_at. */
export function releaseDraft(f: MinistryReleaseInput, sourceId: string | null) {
  const url = canonicalArticleUrl(f.url.trim()) ?? f.url.trim();
  const body = [
    `**Source:** Deputy Ministry of Tourism — [${f.sourceHeadline.trim()}](${url})`,
    `**Announced by the Ministry:** ${f.sourceDate}`,
    `**Topic:** ${f.topic}`,
    f.whoAffected.trim() && `**Who is affected:** ${f.whoAffected.trim()}`,
  ].filter(Boolean).join("\n\n");
  return {
    title: f.headline.trim(), summary: f.summary.trim(), what_happened: f.whatChanged.trim() || null,
    why_it_matters: f.whoAffected.trim() || null, what_to_do: f.action.trim() || null, body_markdown: body,
    source_url: url, canonical_url: url, source_id: sourceId, original_language: f.language,
    status: "draft" as const, vertical: "tourism" as const, published_at: null, event_type: "official_announcement",
    tags: ["Tourism", f.topic],
  };
}

/** Simple word overlap, used to flag repeat or other-language announcements for the editor. */
export function headlineSimilarity(a: string, b: string): number {
  const w = (s: string) => new Set(s.toLowerCase().replace(/[^\p{L}\p{N} ]/gu, " ").split(/\s+/).filter((x) => x.length > 3));
  const A = w(a), B = w(b);
  if (!A.size || !B.size) return 0;
  let n = 0; A.forEach((x) => B.has(x) && n++);
  return n / Math.min(A.size, B.size);
}
