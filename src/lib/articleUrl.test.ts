import { describe, it, expect } from "vitest";
import { articlePath } from "./articleUrl";
describe("articlePath", () => {
  it("adds the headline after the id", () =>
    expect(articlePath("ce2c8a9b", "AMLA identifies AML/CFT priorities for the review of MiCA"))
      .toBe("/article/ce2c8a9b/amla-identifies-aml-cft-priorities-for-the-review-of-mica"));
  it("keeps the plain id when there is no headline", () => expect(articlePath("abc", "")).toBe("/article/abc"));
});
