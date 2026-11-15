import { describe, expect, it } from "vitest";
import { EMPTY_STORY, storyProblem, storyRow } from "@/lib/manualStory";

const base = { ...EMPTY_STORY, headline: "Test story", summary: "A summary", body: "The text." };

describe("YouTube video link on a hand-written story", () => {
  it("saves the video link with the story", () => {
    const row = storyRow({ ...base, videoUrl: "https://youtu.be/dQw4w9WgXcQ" });
    expect(row.video_url).toBe("https://youtu.be/dQw4w9WgXcQ");
  });

  it("leaves the video link empty when the editor does not add one", () => {
    expect(storyRow(base).video_url).toBeNull();
    expect(storyRow({ ...base, videoUrl: "   " }).video_url).toBeNull();
  });

  it("refuses to save a story whose video link is not YouTube", () => {
    expect(storyProblem({ ...base, videoUrl: "https://vimeo.com/76979871" })).toContain("must be a YouTube link");
    expect(storyProblem({ ...base, videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" })).toBeNull();
    expect(storyProblem(base)).toBeNull();
  });
});
