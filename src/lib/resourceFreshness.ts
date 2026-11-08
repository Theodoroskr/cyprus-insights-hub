export const RESOURCE_REVIEW_MONTHS = 6;

/** A resource needs review when it was never reviewed or the last review is older than 6 months. */
export function needsReview(reviewedAt: string | null | undefined, now: Date = new Date()): boolean {
  if (!reviewedAt) return true;
  const limit = new Date(now);
  limit.setMonth(limit.getMonth() - RESOURCE_REVIEW_MONTHS);
  return new Date(reviewedAt) < limit;
}

export function formatReviewed(reviewedAt: string | null | undefined): string | null {
  if (!reviewedAt) return null;
  return new Date(reviewedAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}
