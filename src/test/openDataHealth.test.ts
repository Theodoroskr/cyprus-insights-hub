import { describe, it, expect } from "vitest";
import { assessSource } from "../../supabase/functions/_shared/openDataHealth";

const now = new Date("2026-11-08T12:00:00Z");
const base = { status: "ok", last_error: null, last_checked_at: "2026-11-01T00:00:00Z", latest_period: "2026-09-01", max_staleness_days: 35, max_period_lag_months: 3 };

describe("assessSource", () => {
  it("healthy when recently checked and month is recent", () => expect(assessSource(base, now).state).toBe("ok"));
  it("missed check after 35 days", () => expect(assessSource({ ...base, last_checked_at: "2026-10-01T00:00:00Z" }, now).state).toBe("missed_check"));
  it("weekly source missed after 9 days", () => expect(assessSource({ ...base, max_staleness_days: 9, max_period_lag_months: null, last_checked_at: "2026-10-29T00:00:00Z" }, now).state).toBe("missed_check"));
  it("stale when latest month more than 3 months behind", () => expect(assessSource({ ...base, latest_period: "2026-07-01" }, now).state).toBe("stale_period"));
  it("3 months behind is still fine", () => expect(assessSource({ ...base, latest_period: "2026-08-01" }, now).state).toBe("ok"));
  it("error wins", () => expect(assessSource({ ...base, status: "error", last_error: "x" }, now).state).toBe("error"));
});
