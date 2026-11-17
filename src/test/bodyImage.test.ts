import { describe, it, expect } from "vitest";
import { imageMarkdown, insertAtCursor } from "@/lib/bodyImage";

describe("picture inside story text", () => {
  it("puts the picture on its own paragraph at the cursor", () => {
    const r = insertAtCursor("First.Second.", 6, imageMarkdown("https://x/a.jpg", "Cap"));
    expect(r.text).toBe("First.\n\n![Cap](https://x/a.jpg)\n\nSecond.");
  });
  it("adds to the end when there is no cursor", () => {
    expect(insertAtCursor("Text", null, "![](u)").text).toBe("Text\n\n![](u)\n");
  });
});
