/** A story is "International" when nothing in its title, summary or tags ties it to Cyprus. */
const CYPRUS_RE = /\b(cyprus|cypriot|kypros|nicosia|lefkosia|limassol|lemesos|larnaca|larnaka|paphos|pafos|famagusta|ammochostos|kyrenia|troodos|ayia napa|protaras|cysec|cystat|cbc|cera|eac|cse)\b|(κύπρο|κυπρ|λευκωσ|λεμεσ|λάρνακ|πάφο)/i;

export function isInternationalStory(s: { title?: string | null; summary?: string | null; what_happened?: string | null; tags?: string[] | null }): boolean {
  // Tags like "Cyprus Economy" are added to almost every story by the tagger, so only an exact "cyprus" tag counts.
  if ((s.tags ?? []).some((t) => t?.trim().toLowerCase() === "cyprus")) return false;
  const text = [s.title, s.summary, s.what_happened].filter(Boolean).join(" ");
  if (!text.trim()) return false;
  return !CYPRUS_RE.test(text);
}

export const INTERNATIONAL_LABEL = "International";

export type StoryScope = "all" | "cyprus" | "international";
export const SCOPES: { key: StoryScope; label: string }[] = [
  { key: "all", label: "All" }, { key: "cyprus", label: "Cyprus" }, { key: "international", label: INTERNATIONAL_LABEL },
];
/** Keep only stories in the chosen scope; untagged (empty) stories count as Cyprus. */
export function matchesScope(s: Parameters<typeof isInternationalStory>[0], scope: StoryScope): boolean {
  if (scope === "all") return true;
  return isInternationalStory(s) === (scope === "international");
}
export function readScope(): StoryScope {
  const v = new URLSearchParams(window.location.search).get("scope");
  return v === "cyprus" || v === "international" ? v : "all";
}
export function writeScope(scope: StoryScope) {
  const u = new URL(window.location.href);
  if (scope === "all") u.searchParams.delete("scope"); else u.searchParams.set("scope", scope);
  window.history.replaceState(window.history.state, "", u.toString());
}
