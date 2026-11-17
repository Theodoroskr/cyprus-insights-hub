import { isInternationalStory } from "@/lib/storyOrigin";

type BlendStory = { title: string; summary: string | null; what_happened?: string | null; tags: string[] | null; greece_related?: boolean | null };

/**
 * businesshub.gr is mainly Greece with a smaller Cyprus and International blend:
 * Cyprus Edition stories split into the two blocks, Greece-related ones first, newest order kept otherwise.
 */
export function blendBlocks<T extends BlendStory>(rows: T[], size = 4): { cyprus: T[]; international: T[] } {
  const greeceFirst = (a: T, b: T) => Number(!!b.greece_related) - Number(!!a.greece_related);
  const intl = rows.filter((r) => isInternationalStory(r));
  const cyprus = rows.filter((r) => !isInternationalStory(r));
  return { cyprus: [...cyprus].sort(greeceFirst).slice(0, size), international: [...intl].sort(greeceFirst).slice(0, size) };
}
