import { describe, it, expect } from "vitest";
import { buildIndexNowPayload, isAccepted, pageUrl, urlsToSubmit, KEY_LOCATION } from "../../supabase/functions/_shared/indexNow";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("IndexNow", () => {
  it("builds story addresses on the site's own domain", () => {
    expect(pageUrl({ kind: "article", idOrSlug: "a7c5494b" })).toBe("https://businesshub.cy/article/a7c5494b");
    expect(pageUrl({ kind: "news", idOrSlug: "cysec-crypto-guidelines-2025" })).toBe("https://businesshub.cy/news/cysec-crypto-guidelines-2025");
  });

  it("never submits the same page twice", () => {
    const already = new Set(["https://businesshub.cy/article/1"]);
    const urls = ["https://businesshub.cy/article/1", "https://businesshub.cy/article/2", "https://businesshub.cy/article/2"];
    expect(urlsToSubmit(urls, already)).toEqual(["https://businesshub.cy/article/2"]);
  });

  it("only submits addresses on businesshub.cy", () => {
    expect(urlsToSubmit(["https://example.com/x"], new Set())).toEqual([]);
  });

  it("caps a run's batch", () => {
    const urls = Array.from({ length: 10 }, (_, i) => `https://businesshub.cy/article/${i}`);
    expect(urlsToSubmit(urls, new Set(), 3)).toHaveLength(3);
  });

  it("treats only 200 and 202 as accepted, so rejected pages are retried", () => {
    expect(isAccepted(200)).toBe(true);
    expect(isAccepted(202)).toBe(true);
    expect(isAccepted(403)).toBe(false);
    expect(isAccepted(422)).toBe(false);
  });

  it("serves the key file the payload points to", () => {
    const payload = buildIndexNowPayload(["https://businesshub.cy/article/1"]);
    expect(payload.keyLocation).toBe(KEY_LOCATION);
    const file = readFileSync(resolve(__dirname, `../../public/${payload.key}.txt`), "utf8").trim();
    expect(file).toBe(payload.key);
  });
});
