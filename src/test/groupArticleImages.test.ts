import { describe, it, expect } from "vitest";
import { groupArticleImages } from "@/lib/groupArticleImages";

describe("groupArticleImages", () => {
  it("groups consecutive images into one gallery", () => {
    const s = groupArticleImages("Intro\n\n![a](1.jpg)\n\n![b](2.jpg)\n![c](3.jpg)\n\nOutro");
    const g = s.find((x) => x.type === "gallery");
    expect(g && g.type === "gallery" && g.images.length).toBe(3);
  });
  it("leaves a single image inline", () => {
    const s = groupArticleImages("Intro\n\n![a](1.jpg)\n\nOutro");
    expect(s.every((x) => x.type === "text")).toBe(true);
  });
});
