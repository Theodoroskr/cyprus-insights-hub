import { describe, it, expect } from "vitest";
import { FINLIT_MODULES } from "./finlitModules";

describe("Financial Literacy modules", () => {
  it("has exactly ten modules", () => expect(FINLIT_MODULES).toHaveLength(10));
  it("every module has English and Greek labels", () => {
    for (const m of FINLIT_MODULES) { expect(m.en.trim()).not.toBe(""); expect(m.el.trim()).not.toBe(""); }
  });
  it("addresses are unique and under /financial-literacy", () => {
    const paths = FINLIT_MODULES.map((m) => m.path);
    expect(new Set(paths).size).toBe(10);
    for (const p of paths) expect(p.startsWith("/financial-literacy")).toBe(true);
  });
  it("Overview is the landing page", () => expect(FINLIT_MODULES[0].path).toBe("/financial-literacy"));
});
