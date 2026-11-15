import { describe, it, expect } from "vitest";
import { isInternationalStory } from "@/lib/storyOrigin";
describe("isInternationalStory", () => {
  it("labels the Nepal IMF story International", () => {
    expect(isInternationalStory({ title: "Nepal Stabilizes Its Economy—and Sets Its Sights Higher", tags: ["Nepal", "imf", "global"] })).toBe(true);
  });
  it("does not label Cyprus stories", () => {
    expect(isInternationalStory({ title: "Limassol port traffic rises", tags: [] })).toBe(false);
    expect(isInternationalStory({ title: "IMF review", summary: "The IMF says Cyprus growth will hold." })).toBe(false);
  });
});
import { matchesScope } from "@/lib/storyOrigin";
describe("matchesScope", () => {
  it("splits Cyprus and International", () => {
    const nepal = { title: "Nepal Stabilizes Its Economy" }, local = { title: "Limassol port traffic rises" };
    expect(matchesScope(nepal, "international")).toBe(true);
    expect(matchesScope(nepal, "cyprus")).toBe(false);
    expect(matchesScope(local, "cyprus")).toBe(true);
    expect(matchesScope(local, "all")).toBe(true);
  });
});
describe("short Cyprus codes", () => {
  it("does not mistake ordinary words like 'each' for Cyprus", () => {
    expect(isInternationalStory({ title: "Egypt economy", summary: "Each reform helped; ceramic exports rose." })).toBe(true);
    expect(isInternationalStory({ title: "CSE index rises" })).toBe(false);
  });
});
describe("tagger tags", () => {
  it("a 'Cyprus Economy' tag alone does not make an Egypt story local", () => {
    expect(isInternationalStory({ title: "Egypt's Economy Defied Expectations", tags: ["Egypt", "Cyprus-Egypt Trade", "Cyprus Economy", "global"] })).toBe(true);
    expect(isInternationalStory({ title: "Port traffic rises", tags: ["cyprus"] })).toBe(false);
  });
});
