import { describe, expect, it } from "vitest";
import { highlightUntil, isHighlighted, pinHighlighted } from "@/lib/highlight";

const now = new Date("2026-11-15T15:00:00Z");
const story = (id: string, hour: number, featured_until: string | null = null) => ({
  id, published_at: `2026-11-15T${String(hour).padStart(2, "0")}:00:00Z`, featured_until,
});

describe("editor highlights", () => {
  it("a 2-hour highlight ends exactly two hours later", () => {
    expect(highlightUntil(2, now)).toBe("2026-11-15T17:00:00.000Z");
  });
  it("a highlighted older story leads the homepage until its time runs out", () => {
    const pool = [story("new", 14), story("old", 9, "2026-11-15T16:00:00Z")];
    expect(pinHighlighted(pool, [], now)[0].id).toBe("old");
    expect(pinHighlighted(pool, [], new Date("2026-11-15T16:00:01Z"))[0].id).toBe("new");
  });
  it("finds a highlighted story that is no longer among the newest", () => {
    const result = pinHighlighted([story("a", 14), story("b", 13)], [story("old", 3, "2026-11-15T16:00:00Z")], now);
    expect(result.map((s) => s.id)).toEqual(["old", "a", "b"]);
  });
  it("a story without a highlight time is not highlighted", () => {
    expect(isHighlighted({ featured_until: null }, now)).toBe(false);
  });
});
