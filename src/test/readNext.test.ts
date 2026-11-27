import { describe, it, expect } from "vitest";
import { pickReadNext } from "@/lib/readNext";

const cur = { id: "x", title: "Current", tags: ["Banking"] };
describe("pickReadNext", () => {
  it("puts stories sharing topics before newer unrelated ones", () => {
    const r = pickReadNext(cur, [
      { id: "a", title: "New", published_at: "2026-11-27", tags: [] },
      { id: "b", title: "Bank", published_at: "2026-11-20", tags: ["banking"] },
    ]);
    expect(r.map((s) => s.id)).toEqual(["b", "a"]);
  });
  it("never repeats the current story or a duplicate headline", () => {
    const r = pickReadNext(cur, [
      { id: "x", title: "Current" },
      { id: "a", title: "Same" },
      { id: "b", title: "same " },
    ]);
    expect(r.map((s) => s.id)).toEqual(["a"]);
  });
  it("moves a second publisher ahead of a third story from the same one", () => {
    const c = ["1", "2", "3", "4"].map((id) => ({ id, title: id, source_id: "delphi", published_at: `2026-11-2${id}` }));
    const r = pickReadNext(cur, [...c, { id: "o", title: "Other", source_id: "cna", published_at: "2026-11-01" }]);
    expect(r.map((s) => s.id)).toEqual(["4", "3", "o", "2"]);
  });
});
