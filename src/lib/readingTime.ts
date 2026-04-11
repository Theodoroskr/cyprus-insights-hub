/** Estimate reading time in minutes from text content */
export function estimateReadingTime(...texts: (string | null | undefined)[]): string {
  const combined = texts.filter(Boolean).join(" ");
  const words = combined.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}
