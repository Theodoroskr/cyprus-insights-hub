import { describe, expect, it } from "vitest";
import {
  chooseTopic, cyprusPropertyPost, cyprusTourismPost, greecePulsePost, integrityPost, periodLabel, rowsToday, shortMessage,
  type DataPost,
} from "../../supabase/functions/_shared/dataPosts";

const post = (topic: DataPost["topic"], fingerprint: string, onlyWhenNew = false): DataPost => ({
  topic, fingerprint, headline: topic, lines: [], source: "", path: "/", image: "", hashtags: [], onlyWhenNew,
});
const row = (topic: string, fingerprint: string, created_at: string) => ({ topic, fingerprint, created_at, status: "posted" });

describe("daily data post topic", () => {
  it("prefers a topic with a new release over a rerun", () => {
    const posts = [post("cyprus-economy", "a"), post("greece-pulse", "new")];
    const history = [row("cyprus-economy", "a", "2026-11-10T09:00:00Z"), row("greece-pulse", "old", "2026-11-20T09:00:00Z")];
    expect(chooseTopic(posts, history)?.topic).toBe("greece-pulse");
  });

  it("never repeats yesterday's topic when another is available", () => {
    const posts = [post("cyprus-economy", "a"), post("greece-pulse", "b")];
    const history = [row("cyprus-economy", "a", "2026-11-21T09:00:00Z"), row("greece-pulse", "b", "2026-11-20T09:00:00Z")];
    expect(chooseTopic(posts, history)?.topic).toBe("greece-pulse");
    const history2 = [row("greece-pulse", "b", "2026-11-21T09:00:00Z"), row("cyprus-economy", "a", "2026-11-01T09:00:00Z")];
    expect(chooseTopic(posts, history2)?.topic).toBe("cyprus-economy");
  });

  it("reruns the topic posted longest ago when nothing is new", () => {
    const posts = [post("cyprus-economy", "a"), post("greece-pulse", "b"), post("cyprus-tourism", "c")];
    const history = [
      row("cyprus-tourism", "c", "2026-11-21T09:00:00Z"),
      row("greece-pulse", "b", "2026-11-15T09:00:00Z"),
      row("cyprus-economy", "a", "2026-11-18T09:00:00Z"),
    ];
    expect(chooseTopic(posts, history)?.topic).toBe("greece-pulse");
  });

  it("posts the corruption index only when its edition is new", () => {
    const posts = [post("integrity", "cpi:2025", true), post("cyprus-economy", "a")];
    expect(chooseTopic(posts, [])?.topic).toBe("integrity");
    const history = [row("integrity", "cpi:2025", "2026-10-01T09:00:00Z"), row("cyprus-economy", "a", "2026-11-21T09:00:00Z")];
    expect(chooseTopic(posts, history)?.topic).toBe("cyprus-economy");
  });

  it("counts runs by Cyprus calendar day", () => {
    const now = new Date("2026-11-22T09:00:00Z");
    const rows = [{ created_at: "2026-11-21T23:30:00Z" }, { created_at: "2026-11-21T21:30:00Z" }];
    expect(rowsToday(rows, now)).toHaveLength(1); // 01:30 Cyprus time on the 22nd
  });
});

describe("data post figures", () => {
  it("labels periods", () => {
    expect(periodLabel("2026-Q2")).toBe("Q2 2026");
    expect(periodLabel("2026-10")).toBe("Oct 2026");
  });

  it("builds Greece Business Pulse with the year-on-year travellers change", () => {
    const p = greecePulsePost({
      gdp_growth: [{ geo: "EL", period: "2026-Q2", value: 1.9 }, { geo: "CY", period: "2026-Q3", value: 3 }],
      gr_travellers: [{ geo: "EL", period: "2025-Q2", value: 10694 }, { geo: "EL", period: "2026-Q2", value: 11667 }],
    })!;
    expect(p.lines[0]).toContain("1.9%");
    expect(p.lines[0]).toContain("Q2 2026");
    expect(p.lines[1]).toContain("11,667 thousand");
    expect(p.lines[1]).toContain("up 9.1% on a year earlier");
    expect(p.fingerprint).toBe("gdp:2026-Q2|tr:2026-Q2");
  });

  it("skips a property month until all five districts have reported", () => {
    const rows = ["NICOSIA", "LIMASSOL", "LARNACA", "PAPHOS"].map((d) => ({ period: "2026-09", district: d, count: 100 }));
    expect(cyprusPropertyPost(rows)).toBeNull();
    const full = [...rows, { period: "2026-09", district: "FAMAGUSTA", count: 50 }];
    expect(cyprusPropertyPost(full)!.lines[0]).toContain("450 property sale contracts filed in Sep 2026");
  });

  it("adds tourism year to date only when every month is present", () => {
    const rows = [
      { period: "2025-01", arrivals: 100 }, { period: "2025-02", arrivals: 100 },
      { period: "2026-01", arrivals: 110 }, { period: "2026-02", arrivals: 120 },
    ];
    const p = cyprusTourismPost(rows)!;
    expect(p.lines[0]).toContain("120 tourist arrivals in Feb 2026, up 20.0%");
    expect(p.lines[1]).toContain("January–Feb 2026: 230 arrivals, up 15.0%");
    expect(cyprusTourismPost(rows.filter((r) => r.period !== "2025-01"))!.lines).toHaveLength(1);
  });

  it("writes the corruption index ranks", () => {
    const p = integrityPost({ year: 2025, countries: 182, euAvg: 62, results: [{ iso3: "CYP", score: 55, rank: 49, tied: true }] })!;
    expect(p.lines[0]).toBe("🇨🇾 Cyprus: 55/100, tied 49th of 182");
    expect(p.onlyWhenNew).toBe(true);
  });

  it("keeps the X post within 280 characters", () => {
    const p = { ...post("greece-pulse", "x"), headline: "H".repeat(200), lines: ["a".repeat(40), "b".repeat(40)], path: "/greece/business-pulse?lang=en" };
    const t = shortMessage(p);
    const counted = t.replace(/https:\/\/\S+/, "x".repeat(23)).length;
    expect(counted).toBeLessThanOrEqual(280);
    expect(t).toContain("utm_source=x");
  });
});
