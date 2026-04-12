/**
 * Check if the user has consented to analytics cookies.
 * Call this before loading any tracking scripts (GA, Meta Pixel, etc.).
 */
export function hasAnalyticsConsent(): boolean {
  const consent = localStorage.getItem("cookie_consent");
  return consent === "all";
}

/**
 * Listen for consent changes. Returns an unsubscribe function.
 */
export function onConsentChange(cb: (level: string) => void): () => void {
  const handler = (e: Event) => cb((e as CustomEvent).detail?.level);
  window.addEventListener("cookie_consent_change", handler);
  return () => window.removeEventListener("cookie_consent_change", handler);
}
