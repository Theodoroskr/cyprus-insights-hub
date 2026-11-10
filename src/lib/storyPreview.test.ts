import { describe, it, expect } from "vitest";
import { buildStoryHtml, previewImage } from "./storyPreview";

const tpl = `<html><head><title>Site</title>\n<meta data-rh="true" property="og:title" content="Site" />\n</head><body></body></html>`;

describe("story link previews", () => {
  it("uses the story's own title, photo and address", () => {
    const html = buildStoryHtml(tpl, { id: "abc", title: 'Bank "X" & Co', summary: "Sum", image_url: "https://img.example.com/a.jpg", vertical: "business" });
    expect(html).toContain('property="og:url" content="https://businesshub.cy/article/abc"');
    expect(html).toContain('property="og:image" content="https://img.example.com/a.jpg"');
    expect(html).toContain("Bank &quot;X&quot; &amp; Co");
    expect(html.match(/property="og:title"/g)?.length).toBe(1);
  });
  it("falls back to the hub picture when missing or blocked", () => {
    expect(previewImage({ image_url: null, vertical: "fintech" })).toBe("https://businesshub.cy/images/og-fintechhub.png");
    expect(previewImage({ image_url: "https://www.gov.cy/x.jpg", vertical: null })).toBe("https://businesshub.cy/images/og-businesshub.png");
  });
});
