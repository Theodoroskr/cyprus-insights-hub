/** Rules for the free weekly Cyprus business briefing sign-up. */
export const BRIEFING_FREQUENCY = "weekly" as const;

export type BriefingSignupResult = "joined" | "already" | "error";

/** Normalises the email and builds the row stored in newsletter_subscribers. */
export function briefingSignupRow(email: string, extra: { name?: string; company?: string; job_title?: string; verticals?: string[] } = {}) {
  return {
    email: email.trim().toLowerCase(),
    name: extra.name?.trim() || null,
    company: extra.company?.trim() || null,
    job_title: extra.job_title?.trim() || null,
    verticals: extra.verticals?.length ? extra.verticals : ["general"],
    frequency: BRIEFING_FREQUENCY,
  };
}

/** Maps the insert error (if any) to a result; 23505 = email already on the list. */
export function briefingSignupResult(error: { code?: string } | null): BriefingSignupResult {
  if (!error) return "joined";
  return error.code === "23505" ? "already" : "error";
}
