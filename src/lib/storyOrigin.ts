/** A story is "International" when nothing in its title, summary or tags ties it to Cyprus. */
const CYPRUS_RE = /\b(cyprus|cypriot|kypros|nicosia|lefkosia|limassol|lemesos|larnaca|larnaka|paphos|pafos|famagusta|ammochostos|kyrenia|troodos|ayia napa|protaras|cysec|cystat|cbc|cera|eac|cse|κύπρο|κυπρ|λευκωσ|λεμεσ|λάρνακ|πάφο)/i;

export function isInternationalStory(s: { title?: string | null; summary?: string | null; what_happened?: string | null; tags?: string[] | null }): boolean {
  const text = [s.title, s.summary, s.what_happened, ...(s.tags ?? [])].filter(Boolean).join(" ");
  if (!text.trim()) return false;
  return !CYPRUS_RE.test(text);
}

export const INTERNATIONAL_LABEL = "International";
