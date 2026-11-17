// Editors write a story or press release by hand for the main news feed (cna_articles).
import { canonicalArticleUrl } from "../../supabase/functions/scrape-sources/listingPage";
import { videoProblem } from "@/lib/videoEmbed";
import { isGreeceRelated } from "@/lib/greeceRelated";
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
  videoUrl: string; // optional YouTube link, shown as a player under the headline
  publishNow: boolean;
  /** Which edition shows the story: Cyprus (English), Greece (Greek) or both. */
  edition: StoryEdition;
  headlineEl: string;
  summaryEl: string;
  bodyEl: string;
  whatHappenedEl: string;
  whyItMattersEl: string;
  whatToDoEl: string;
  grSection: string;        // Greece edition section slug (GR_SECTIONS)
  organisationSlug: string; // optional bank/organisation page on the Greece edition
  crossBorderNote: string;  // optional Greece–Cyprus angle
}

export type StoryEdition = "cy" | "gr" | "both";

export const STORY_EDITIONS: { value: StoryEdition; label: string }[] = [
  { value: "cy", label: "Cyprus Edition (English)" },
  { value: "gr", label: "Greece Edition (Greek)" },
  { value: "both", label: "Both editions (English + Greek)" },
];

const hasEn = (e: StoryEdition) => e !== "gr";
const hasGr = (e: StoryEdition) => e !== "cy";

export const EMPTY_STORY: ManualStoryInput = {
  kind: "story", headline: "", summary: "", vertical: "general", body: "", whatHappened: "", whyItMatters: "", whatToDo: "",
  sourceUrl: "", issuer: "", contact: "", tags: "", imageUrl: "", videoUrl: "", publishNow: false,
  edition: "cy", headlineEl: "", summaryEl: "", bodyEl: "", whatHappenedEl: "", whyItMattersEl: "", whatToDoEl: "",
  grSection: "business", organisationSlug: "", crossBorderNote: "",
};

/** Returns an error message, or null when the form can be saved. */
export function storyProblem(f: ManualStoryInput): string | null {
  const edition = f.edition ?? "cy";
  if (hasEn(edition)) {
    if (!f.headline.trim()) return "Add a headline";
    if (!f.summary.trim()) return "Add a short summary";
    if (!f.body.trim() && !f.whatHappened.trim()) return "Write the story text or fill in “What happened”";
  }
  if (hasGr(edition)) {
    if (!f.headlineEl?.trim()) return "Add the Greek headline (Τίτλος)";
    if (!f.summaryEl?.trim()) return "Add the Greek summary (Περίληψη)";
    if (!f.bodyEl?.trim() && !f.whatHappenedEl?.trim()) return "Write the Greek story text or fill in “Τι συνέβη”";
    if (!f.grSection?.trim()) return "Choose the Greece edition section";
  }
  if (f.kind === "press_release" && !f.issuer.trim()) return "Name the company or organisation issuing the press release";
  if (f.sourceUrl.trim() && !/^https?:\/\/\S+\.\S+/i.test(f.sourceUrl.trim())) return "The original link must start with https://";
  if (f.imageUrl.trim() && !/^https:\/\/\S+/i.test(f.imageUrl.trim())) return "The picture link must start with https://";
  const video = videoProblem(f.videoUrl);
  if (video) return video;
  return null;
}

/** Builds the cna_articles row. Press releases are always labelled as such for readers, in each language used. */
export function storyRow(f: ManualStoryInput, now = new Date()) {
  const isPr = f.kind === "press_release";
  const edition = f.edition ?? "cy";
  const en = hasEn(edition), gr = hasGr(edition);
  const url = f.sourceUrl.trim() ? canonicalArticleUrl(f.sourceUrl.trim()) ?? f.sourceUrl.trim() : null;
  const tags = Array.from(new Set([
    ...(isPr ? [PRESS_RELEASE_TAG] : []),
    ...f.tags.split(",").map((t) => t.trim()).filter(Boolean),
  ]));
  const issuer = f.issuer.trim(), contact = f.contact.trim();
  const wrap = (text: string, header: string, footer: string) =>
    [isPr ? header : "", text.trim(), isPr && contact ? footer : ""].filter(Boolean).join("\n\n") || null;
  const bodyEn = en ? wrap(f.body,
    `**Press release issued by ${issuer}.** Published as received; BusinessHub has not independently verified its claims.`,
    `**Press contact:** ${contact}`) : null;
  const bodyEl = gr ? wrap(f.bodyEl ?? "",
    `**Δελτίο Τύπου από: ${issuer}.** Δημοσιεύεται όπως ελήφθη· το BusinessHub δεν έχει επαληθεύσει ανεξάρτητα όσα αναφέρει.`,
    `**Επικοινωνία Τύπου:** ${contact}`) : null;
  const t = (v: string | undefined) => (v ?? "").trim() || null;
  return {
    // A Greece-only story has no English text; its Greek headline/summary fill the required fields.
    title: en ? f.headline.trim() : (f.headlineEl ?? "").trim(),
    summary: en ? f.summary.trim() : t(f.summaryEl),
    vertical: f.vertical,
    body_markdown: bodyEn,
    what_happened: en ? t(f.whatHappened) : null,
    why_it_matters: en ? t(f.whyItMatters) : null,
    what_to_do: en ? t(f.whatToDo) : null,
    title_el: gr ? t(f.headlineEl) : null,
    summary_el: gr ? t(f.summaryEl) : null,
    body_el: bodyEl,
    what_happened_el: gr ? t(f.whatHappenedEl) : null,
    why_it_matters_el: gr ? t(f.whyItMattersEl) : null,
    what_to_do_el: gr ? t(f.whatToDoEl) : null,
    gr_section: gr ? t(f.grSection) : null,
    organisation_slug: gr ? t(f.organisationSlug) : null,
    cross_border_note: gr ? t(f.crossBorderNote) : null,
    edition: edition === "both" ? ["cy", "gr"] : [edition],
    greece_related: isGreeceRelated({
      title: `${f.headline} ${f.headlineEl ?? ""}`, summary: `${f.summary} ${f.summaryEl ?? ""}`,
      body: `${f.body} ${f.bodyEl ?? ""}`, tags, edition: edition === "cy" ? ["cy"] : ["gr"],
    }),
    source_url: url,
    canonical_url: url,
    image_url: f.imageUrl.trim() || null,
    video_url: f.videoUrl.trim() || null,
    tags,
    event_type: isPr ? "press_release" : "editorial",
    original_language: en ? "en" : "el",
    status: (f.publishNow ? "published" : "draft") as "published" | "draft",
    published_at: f.publishNow ? now.toISOString() : null,
  };
}
