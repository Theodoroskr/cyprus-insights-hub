import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { EL, tr, periodLabel } from "./finlitI18n";

const files = ["src/pages/finlit/FinLitModules.tsx", "src/pages/FinancialLiteracyPage.tsx",
  ...readdirSync("src/components/finlit").map((f) => `src/components/finlit/${f}`)];

describe("Financial Literacy Greek text", () => {
  it("every fixed text passed to t() has a Greek version", () => {
    const missing: string[] = [];
    for (const f of files) for (const m of readFileSync(f, "utf8").matchAll(/\bt\("((?:[^"\\]|\\.)*)"\)/g)) if (!EL[m[1]]) missing.push(`${f}: ${m[1]}`);
    expect(missing).toEqual([]);
  });
  it("falls back to English when Greek is missing", () => { expect(tr("el", "Unknown text")).toBe("Unknown text"); });
  it("shows months in Greek", () => { expect(periodLabel("2026-09", "el")).toMatch(/Σεπ/); expect(periodLabel("2026-09", "en")).not.toMatch(/Σεπ/); });
});
