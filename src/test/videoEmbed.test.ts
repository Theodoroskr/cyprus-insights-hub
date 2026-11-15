import { describe, expect, it } from "vitest";
import { isUprightPicture, videoEmbed, videoProblem, youTubeVideoId } from "@/lib/videoEmbed";

describe("YouTube video links on stories", () => {
  it("accepts the YouTube link shapes editors paste", () => {
    expect(youTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youTubeVideoId("https://youtu.be/dQw4w9WgXcQ?t=42")).toBe("dQw4w9WgXcQ");
    expect(youTubeVideoId("https://m.youtube.com/watch?v=dQw4w9WgXcQ&list=PL123")).toBe("dQw4w9WgXcQ");
    expect(youTubeVideoId("https://www.youtube.com/shorts/abcDEF12345")).toBe("abcDEF12345");
    expect(youTubeVideoId("https://www.youtube.com/embed/abcDEF12345")).toBe("abcDEF12345");
    expect(youTubeVideoId("youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("refuses links that are not a YouTube video", () => {
    expect(youTubeVideoId("https://vimeo.com/76979871")).toBeNull();
    expect(youTubeVideoId("https://www.youtube.com/playlist?list=PL123")).toBeNull();
    expect(youTubeVideoId("https://notyoutube.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(youTubeVideoId("just some words")).toBeNull();
    expect(youTubeVideoId("")).toBeNull();
    expect(youTubeVideoId(null)).toBeNull();
  });

  it("gives the story page a privacy-friendly player address", () => {
    expect(videoEmbed("https://youtu.be/dQw4w9WgXcQ")).toMatchObject({
      id: "dQw4w9WgXcQ",
      embedUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
      thumbUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    });
    expect(videoEmbed("https://vimeo.com/76979871")).toBeNull();
  });

  it("tells the editor what is wrong with a bad video link", () => {
    expect(videoProblem("")).toBeNull();
    expect(videoProblem("   ")).toBeNull();
    expect(videoProblem("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(videoProblem("https://vimeo.com/76979871")).toContain("must be a YouTube link");
  });
});

describe("vertical videos (Shorts)", () => {
  it("treats a pasted Shorts link as vertical and a normal watch link as not (until checked)", () => {
    expect(videoEmbed("https://www.youtube.com/shorts/AQ3w_ozIuCs")?.vertical).toBe(true);
    expect(videoEmbed("https://www.youtube.com/watch?v=AQ3w_ozIuCs")?.vertical).toBe(false);
  });
  it("checks the upright picture YouTube keeps for Shorts", () => {
    expect(videoEmbed("https://youtu.be/AQ3w_ozIuCs")?.uprightThumbUrl).toBe("https://i.ytimg.com/vi/AQ3w_ozIuCs/oardefault.jpg");
    expect(isUprightPicture(1080, 1920)).toBe(true);
    expect(isUprightPicture(120, 90)).toBe(false);
    expect(isUprightPicture(0, 0)).toBe(false);
  });
});
