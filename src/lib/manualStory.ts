// Editors write a story or press release by hand for the main news feed (cna_articles).
import { canonicalArticleUrl } from "../../supabase/functions/scrape-sources/listingPage";
import type { Database } from "@/integrations/supabase/types";

type Vertical = Database["public"]["Enums"]["article_vertical"];

export const PRESS_RELEASE_TAG = "Press release";

export const STORY_VERTICALS: { value: Vertical; label: string }[] = [
  { value: "general", label: "Business (main feed)" },
  { value: "sme", label: "SME & Business" },
  { value: "fintech", label: "FinTech" },
  { value: "compliance", label: "Compliance" },
  { value: "regtech", label: "RegTech" },
  { value: "tourism", label: "Tourism & Hospitality" },
  { value: "energy", label: "Energy (EnergyHub)" },
];

export interface ManualStoryInput {
  kind: "story" | "press_release";
  headline: string;
  summary: string;
  vertical: Vertical;
  body: string;
  whatHappened: string;
  whyItMatters: string;
  whatToDo: string;
  sourceUrl: string;
  issuer: string;   // company or organisation issuing a press release
  contact: string;  // optional press contact shown under the release
  tags: string;     // comma-separated
  imageUrl: string;
  publishNow: boolean;
}

export const EMPTY_STORY: ManualStoryInput = {
  kind: "story", headline: "", summary: "", vertical: "general", body: "", whatHappened: "", whyItMatters: "", whatToDo: "",
  sourceUrl: "", issuer: "", contact: "", tags: "", imageUrl: "", publishNow: false,
};

/** Returns an error message, or null when the form can be saved. */
export function storyProblem(f: ManualStoryInput): string | null {
  if (!f.headline.trim()) return "Add a headline";
  if (!f.summary.trim()) return "Add a short summary";
  if (!f.body.trim() && !f.whatHappened.trim()) return "Write the story text or fill in “What happened”";
  if (f.kind === "press_release" && !f.issuer.trim()) return "Name the company or organisation issuing the press release";
  if (f.sourceUrl.trim() && !/^https?:\/\/\S+\.\S+/i.test(f.sourceUrl.trim())) return "The original link must start with https://";
  if (f.imageUrl.trim() && !/^https:\/\/\S+/i.test(f.imageUrl.trim())) return "The picture link must start with https://";
  return null;
}

/** Builds the cna_articles row. Press releases are always labelled as such for readers. */
export function storyRow(f: ManualStoryInput, now = new Date()) {
  const isPr = f.kind === "press_release";
  const url = f.sourceUrl.trim() ? canonicalArticleUrl(f.sourceUrl.trim()) ?? f.sourceUrl.trim() : null;
  const tags = Array.from(new Set([
    ...(isPr ? [PRESS_RELEASE_TAG] : []),
    ...f.tags.split(",").map((t) => t.trim()).filter(Boolean),
  ]));
  const header = isPr
    ? [`**Press release issued by ${f.issuer.trim()}.** Published as received; BusinessHub has not independently verified its claims.`]
    : [];
  const footer = isPr && f.contact.trim() ? [`**Press contact:** ${f.contact.trim()}`] : [];
  const body = [...header, f.body.trim(), ...footer].filter(Boolean).join("\n\n") || null;
  return {
    title: f.headline.trim(),
    summary: f.summary.trim(),
    vertical: f.vertical,
    body_markdown: body,
    what_happened: f.whatHappened.trim() || null,
    why_it_matters: f.whyItMatters.trim() || null,
    what_to_do: f.whatToDo.trim() || null,
    source_url: url,
    canonical_url: url,
    image_url: f.imageUrl.trim() || null,
    tags,
    event_type: isPr ? "press_release" : "editorial",
    original_language: "en",
    status: (f.publishNow ? "published" : "draft") as "published" | "draft",
    published_at: f.publishNow ? now.toISOString() : null,
  };
}
