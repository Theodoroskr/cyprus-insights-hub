import { describe, it, expect } from "vitest";
import { cleanGemiKey, describeGemiResponse } from "../../supabase/functions/_shared/gemi";
import { hasGreekText, storyLanguage } from "@/lib/storyLanguage";

describe("GEMI access key", () => {
  it("accepts a pasted key with surrounding spaces, refuses blanks and multi-word text", () => {
    expect(cleanGemiKey("  abcd1234efgh  ")).toBe("abcd1234efgh");
    expect(cleanGemiKey("")).toBeNull();
    expect(cleanGemiKey("abc")).toBeNull();
    expect(cleanGemiKey("two words here")).toBeNull();
  });
  it("a 401/403 from GEMI means the key itself was rejected (so it is not saved)", () => {
    expect(describeGemiResponse(401, null).rejected).toBe(true);
    expect(describeGemiResponse(403, null).rejected).toBe(true);
  });
  it("rate limits, outages and timeouts are failures but not a rejected key", () => {
    for (const s of [429, 500, 503, null]) {
      const r = describeGemiResponse(s, null);
      expect(r.ok).toBe(false);
      expect(r.rejected).toBe(false);
    }
  });
  it("a 200 passes the test", () => {
    expect(describeGemiResponse(200, [{ id: 1 }, { id: 2 }])).toMatchObject({ ok: true, legalTypes: 2 });
  });
});

describe("one language per story page", () => {
  const story = { edition: ["gr"], title: "Eurobank dividend", title_el: "Μέρισμα Eurobank", summary: "S", summary_el: "Π",
    body_markdown: "English body", what_happened: "English analysis", why_it_matters: null, what_to_do: null };
  it("a Greek headline over English analysis and body is not offered as Greek", () => {
    expect(hasGreekText(story)).toBe(false);
    expect(storyLanguage(story, "el", true)).toBe("en");
  });
  it("once the analysis and body are in Greek, the Greece-only story reads in Greek", () => {
    const full = { ...story, body_el: "Ελληνικό κείμενο", what_happened_el: "Ανάλυση" };
    expect(hasGreekText(full)).toBe(true);
    expect(storyLanguage(full, null)).toBe("el");
  });
});
