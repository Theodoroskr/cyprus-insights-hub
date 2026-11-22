import { describe, it, expect } from "vitest";
import { briefingSignupRow, briefingSignupResult } from "./briefingSignup";

describe("weekly briefing sign-up", () => {
  it("signs people up for the weekly briefing", () => {
    expect(briefingSignupRow("a@b.cy").frequency).toBe("weekly");
  });
  it("stores the email trimmed and lowercased", () => {
    expect(briefingSignupRow("  Jane@Example.COM ").email).toBe("jane@example.com");
  });
  it("treats a duplicate email as already subscribed", () => {
    expect(briefingSignupResult({ code: "23505" })).toBe("already");
    expect(briefingSignupResult({ code: "42501" })).toBe("error");
    expect(briefingSignupResult(null)).toBe("joined");
  });
});
