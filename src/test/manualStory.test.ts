import { describe, it, expect } from "vitest";
import { EMPTY_STORY, PRESS_RELEASE_TAG, storyProblem, storyRow } from "@/lib/manualStory";

const base = { ...EMPTY_STORY, headline: "Bank opens Limassol branch", summary: "A new branch.", body: "Text." };

describe("hand-written stories and press releases", () => {
  it("a press release must name who issued it", () => {
    expect(storyProblem({ ...base, kind: "press_release" })).toMatch(/issuing/);
    expect(storyProblem({ ...base, kind: "press_release", issuer: "Acme Ltd" })).toBeNull();
  });
  it("a press release is labelled for readers and names the issuer", () => {
    const row = storyRow({ ...base, kind: "press_release", issuer: "Acme Ltd", tags: "Banking" });
    expect(row.tags).toEqual([PRESS_RELEASE_TAG, "Banking"]);
    expect(row.event_type).toBe("press_release");
    expect(row.body_markdown).toContain("Press release issued by Acme Ltd");
  });
  it("save as draft stays unpublished; publish now goes live with today's time", () => {
    const now = new Date("2026-11-13T18:00:00Z");
    expect(storyRow({ ...base, publishNow: false }, now)).toMatchObject({ status: "draft", published_at: null });
    expect(storyRow({ ...base, publishNow: true }, now)).toMatchObject({ status: "published", published_at: now.toISOString() });
  });
  it("needs a headline, summary and some story text", () => {
    expect(storyProblem({ ...base, headline: "" })).not.toBeNull();
    expect(storyProblem({ ...base, summary: "" })).not.toBeNull();
    expect(storyProblem({ ...base, body: "" })).not.toBeNull();
  });
});
