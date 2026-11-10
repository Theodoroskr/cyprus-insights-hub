// Detects AI-written copy that describes a broken/missing page instead of a real story.
const AI_ERROR_SUMMARY = /\b(?:404|http 4\d\d)\b|broken link|page (?:is )?(?:currently )?(?:unavailable|not found|does not exist)|(?:report|page|link|document|content) (?:is )?currently unavailable|could not be (?:retrieved|accessed|extracted)|preventing (?:the )?(?:extraction|access)/i;

/** True when AI-written copy describes a missing/broken page instead of a real story. */
export function describesMissingPage(...texts: (string | null | undefined)[]): boolean {
  return AI_ERROR_SUMMARY.test(texts.filter(Boolean).join(" \n"));
}
