import { describe, it, expect } from "vitest";
import { EMPTY_STORY, PRESS_RELEASE_TAG, storyProblem, storyRow } from "@/lib/manualStory";
import { storyLanguage, storyText } from "@/lib/storyLanguage";

const gr = {
  ...EMPTY_STORY, kind: "press_release" as const, edition: "gr" as const, issuer: "Εθνική Τράπεζα",
  headlineEl: "Νέο πρόγραμμα για ΜμΕ", summaryEl: "Η τράπεζα ανακοινώνει πρόγραμμα.", bodyEl: "Κείμενο.",
  whatHappenedEl: "Ανακοινώθηκε πρόγραμμα.", grSection: "banking", organisationSlug: "nbg",
};

describe("Greek press releases", () => {
  it("a Greece-only press release needs no English text, but needs the Greek headline and summary", () => {
    expect(storyProblem(gr)).toBeNull();
    expect(storyProblem({ ...gr, headlineEl: "" })).toMatch(/Greek headline/);
    expect(storyProblem({ ...gr, summaryEl: "" })).toMatch(/Greek summary/);
  });
  it("is filed only in the Greece edition, in its section and bank page, labelled as a press release in Greek", () => {
    const row = storyRow(gr);
    expect(row.edition).toEqual(["gr"]);
    expect(row.gr_section).toBe("banking");
    expect(row.organisation_slug).toBe("nbg");
    expect(row.tags).toContain(PRESS_RELEASE_TAG);
    expect(row.body_el).toContain("Δελτίο Τύπου από: Εθνική Τράπεζα");
    expect(row.what_happened_el).toBe("Ανακοινώθηκε πρόγραμμα.");
    expect(row.body_markdown).toBeNull();
    expect(row.original_language).toBe("el");
  });
  it("a story for both editions needs English and Greek text and appears in both", () => {
    const both = { ...gr, edition: "both" as const };
    expect(storyProblem(both)).toMatch(/headline/);
    const ok = { ...both, headline: "New SME programme", summary: "The bank announces a programme.", body: "Text." };
    expect(storyProblem(ok)).toBeNull();
    expect(storyRow(ok).edition).toEqual(["cy", "gr"]);
  });
  it("Cyprus stories stay Cyprus-only with no Greek fields", () => {
    const row = storyRow({ ...EMPTY_STORY, headline: "H", summary: "S", body: "B" });
    expect(row.edition).toEqual(["cy"]);
    expect(row.title_el).toBeNull();
  });
  it("story page reads a Greece-only story in Greek, a both-edition story in English unless Greek is picked", () => {
    const row = storyRow(gr);
    expect(storyLanguage(row, null)).toBe("el");
    expect(storyText(row, "el").title).toBe("Νέο πρόγραμμα για ΜμΕ");
    const both = storyRow({ ...gr, edition: "both", headline: "New SME programme", summary: "S", body: "B" });
    expect(storyLanguage(both, null)).toBe("en");
    expect(storyLanguage(both, "el")).toBe("el");
    expect(storyText(both, "el").title).toBe("Νέο πρόγραμμα για ΜμΕ");
  });
});

describe("Greece edition reading language", () => {
  const both = { edition: ["cy"], title: "T", title_el: "Τ", summary: null, body_markdown: null, what_happened: null, why_it_matters: null, what_to_do: null };
  it("Cyprus stories read in Greek on the Greece edition, and the reader can switch to English", () => {
    expect(storyLanguage(both, null, true)).toBe("el");
    expect(storyLanguage(both, "en", true)).toBe("en");
  });
  it("Greece-only stories can be read in English when chosen", () => {
    expect(storyLanguage({ ...both, edition: ["gr"] }, "en")).toBe("en");
  });
});
