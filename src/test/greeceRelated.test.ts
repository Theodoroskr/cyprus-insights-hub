import { describe, expect, it } from "vitest";
import { isGreeceRelated } from "@/lib/greeceRelated";
import { EMPTY_STORY, storyRow } from "@/lib/manualStory";

describe("Greece-related label", () => {
  it("labels a story with Greece in the headline", () => {
    expect(isGreeceRelated({ title: "EIOPA elects Stavros Konstantas of the Bank of Greece to its Management Board" })).toBe(true);
  });
  it("labels stories naming Greek banks or the Athens exchange", () => {
    expect(isGreeceRelated({ title: "Eurobank completes share buyback" })).toBe(true);
    expect(isGreeceRelated({ title: "Listing on Euronext Athens approved" })).toBe(true);
  });
  it("labels every Greece-edition story", () => {
    expect(isGreeceRelated({ title: "Quarterly results", edition: ["gr"] })).toBe(true);
  });
  it("does not label Cyprus stories that only say Greek Cypriot or Hellenic Bank", () => {
    expect(isGreeceRelated({ title: "Greek Cypriot negotiator meets UN envoy" })).toBe(false);
    expect(isGreeceRelated({ title: "Hellenic Bank reports nine-month profit" })).toBe(false);
  });
  it("reads the headline and summary, not country lists in the text", () => {
    expect(isGreeceRelated({ title: "EU inflation eases", body: "Greece 2.1%, Spain 2.4%. Athens, Madrid." })).toBe(false);
    expect(isGreeceRelated({ title: "EU inflation eases", summary: "Prices fell fastest in Greece." })).toBe(true);
  });
  it("labels hand-written Greece and Greece-mentioning stories, not other Cyprus stories", () => {
    const base = { ...EMPTY_STORY, headline: "Limassol port expands", summary: "S", body: "B" };
    expect(storyRow(base).greece_related).toBe(false);
    expect(storyRow({ ...base, headline: "Cyprus–Greece ferry link returns" }).greece_related).toBe(true);
  });
});
