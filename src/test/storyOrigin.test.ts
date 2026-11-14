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
