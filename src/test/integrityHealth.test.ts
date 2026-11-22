import { describe, it, expect } from "vitest";
import { classifyFailure, healthChanged, INTEGRITY_SOURCES } from "../../supabase/functions/_shared/integritySources";

describe("integrity source health", () => {
  it("403 is blocked", () => expect(classifyFailure(new Error("HTTP 403"), 403).status).toBe("blocked"));
  it("DNS failure is unreachable", () => expect(classifyFailure(new Error("dns error: failed to lookup address")).status).toBe("unreachable"));
  it("abort is timeout", () => expect(classifyFailure(new Error("AbortError: signal timed out")).status).toBe("timeout"));
  it("alerts only on working<->failing change", () => {
    expect(healthChanged("ok", "blocked")).toBe(true);
    expect(healthChanged("blocked", "blocked")).toBe(false);
    expect(healthChanged("blocked", "timeout")).toBe(false);
    expect(healthChanged("blocked", "ok")).toBe(true);
    expect(healthChanged("ok", "empty")).toBe(false);
  });
  it("Cyprus authority uses the official iaac.org.cy site", () =>
    expect(INTEGRITY_SOURCES.find((s) => s.slug === "cy-anticorruption")!.url).toMatch(/^https:\/\/www\.iaac\.org\.cy\//));
});
