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
  it("drops repeats of the same photo at other sizes or with query strings", () => {
    const s = groupArticleImages("![a](https://x.com/p.jpg)\n![b](https://x.com/p-300x200.jpg?v=2)\n![c](https://x.com/q.jpg)");
    const g = s.find((x) => x.type === "gallery");
    expect(g && g.type === "gallery" && g.images.map((i) => i.src)).toEqual(["https://x.com/p.jpg", "https://x.com/q.jpg"]);
  });
  it("leaves out the article's main photo", () => {
    const s = groupArticleImages("![a](https://x.com/hero.jpg)\n![b](https://x.com/q.jpg)\n![c](https://x.com/r.jpg)", "https://www.x.com/hero.jpg");
    const g = s.find((x) => x.type === "gallery");
    expect(g && g.type === "gallery" && g.images.length).toBe(2);
  });
});
