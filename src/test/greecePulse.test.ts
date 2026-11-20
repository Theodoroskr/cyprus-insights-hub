import { describe, expect, it } from "vitest";
import { isStale, latestCommonPeriod, latestWithYoy, tradeBalance, type PulseObs } from "@/lib/greecePulse";
import { athensToIso, focusOf, isOpenTender, mapRecord, matchesSearch } from "../../supabase/functions/_shared/kimdis";

const o = (geo: string, period: string, value: number): PulseObs => ({ geo, period, period_date: `${period}-01`, value, status_flag: null });

describe("Greece Business Pulse", () => {
  it("goods balance is exports minus imports for the same month only", () => {
    const bal = tradeBalance([o("EL", "2026-08", 5163.8), o("EL", "2026-09", 4261.1)], [o("EL", "2026-08", 8228.6)]);
    expect(bal).toHaveLength(1);
    expect(bal[0]).toMatchObject({ period: "2026-08", value: -3064.8 });
  });
  it("year-on-year change only when the same period a year earlier exists", () => {
    expect(latestWithYoy([o("EL", "2025-10", 2.5), o("EL", "2026-10", 3.1)], "points").change).toBeCloseTo(0.6);
    expect(latestWithYoy([o("EL", "2025-09", 2.5), o("EL", "2026-10", 3.1)], "points").change).toBeNull();
  });
  it("a valid zero is kept as zero", () => {
    expect(latestWithYoy([o("EL", "2025-10", 1), o("EL", "2026-10", 0)], "points").latest?.value).toBe(0);
  });
  it("comparison headline uses the latest period both countries have", () => {
    expect(latestCommonPeriod([o("EL", "2026-10", 7.6), o("CY", "2026-09", 4.1), o("EL", "2026-09", 7.9)], ["EL", "CY"])).toBe("2026-09");
  });
  it("monthly figure older than four months is stale", () => {
    const now = new Date("2026-11-20T00:00:00Z");
    expect(isStale("2026-06-01", "M", null, now)).toBe(true);
    expect(isStale("2026-09-01", "M", "2026-11-19T00:00:00Z", now)).toBe(false);
  });
});

describe("KIMDIS tenders", () => {
  it("Greek local time is converted to UTC (winter +2, summer +3)", () => {
    expect(athensToIso("2026-11-26T15:00:00")).toBe("2026-11-26T13:00:00.000Z");
    expect(athensToIso("2026-07-01T10:00:00")).toBe("2026-07-01T07:00:00.000Z");
  });
  it("focus categories come from CPV codes and title words", () => {
    expect(focusOf(["72253200-5"], "Υποστήριξη συστημάτων")).toEqual(["it"]);
    expect(focusOf(["79417000-0"], "Υπηρεσίες DPO για GDPR")).toEqual(["compliance", "professional"]);
    expect(focusOf(["45000000-7"], "Κατασκευαστικές εργασίες")).toEqual([]);
  });
  it("open tender needs a future deadline and no cancellation or amendment", () => {
    const now = new Date("2026-11-20T00:00:00Z");
    expect(isOpenTender({ kind: "tender", deadline_at: "2026-11-26T13:00:00Z", cancelled: false }, now)).toBe(true);
    expect(isOpenTender({ kind: "tender", deadline_at: null, cancelled: false }, now)).toBe(false);
    expect(isOpenTender({ kind: "tender", deadline_at: "2026-11-26T13:00:00Z", cancelled: true }, now)).toBe(false);
    expect(isOpenTender({ kind: "tender", deadline_at: "2026-11-26T13:00:00Z", cancelled: false, superseded_by: "26PROC000000002" }, now)).toBe(false);
    expect(isOpenTender({ kind: "award", deadline_at: "2026-11-26T13:00:00Z", cancelled: false }, now)).toBe(false);
  });
  it("maps an official record and keeps the official link and amendment", () => {
    const m = mapRecord("tender", { referenceNumber: "26PROC020238618", title: "Λογισμικό", submissionDate: "2026-11-19T10:00:00", finalSubmissionDate: "2026-11-25T14:00:00",
      totalCostWithoutVAT: 0, organization: { key: "1", value: "ΔΗΜΟΣ" }, amendPreviousNotice: true, amendedNoticeADAM: "26PROC020000001",
      objectDetails: [{ currency: { key: "EUR" }, cpvs: [{ key: "72253200-5", value: "Υποστήριξη" }] }] });
    expect("row" in m && m.row).toMatchObject({ value_without_vat: 0, currency: "EUR", amends_reference: "26PROC020000001", official_url: "https://cerpp.eprocurement.gov.gr/khmdhs-opendata/notice/attachment/26PROC020238618" });
    expect(mapRecord("tender", { referenceNumber: "bad", title: "x" })).toHaveProperty("rejected");
  });
  it("search matches accents and case the same way", () => {
    const n = { kind: "tender" as const, title: "ΠΡΟΜΗΘΕΙΑ ΛΟΓΙΣΜΙΚΟΥ ΔΗΜΟΥ", authority_name: "ΔΗΜΟΣ ΑΘΗΝΑΙΩΝ", focus: ["it"], value_without_vat: 5000, published_at: "2026-11-19T08:00:00Z", deadline_at: "2026-12-01T10:00:00Z", cancelled: false };
    const now = new Date("2026-11-20T00:00:00Z");
    expect(matchesSearch(n, { q: "λογισμικού", authority: "Δήμος Αθηναίων", focus: "it", minValue: 1000 }, now)).toBe(true);
    expect(matchesSearch(n, { minValue: 10000 }, now)).toBe(false);
  });
});

describe("Greece data pages on businesshub.gr", async () => {
  const { grHostToAppPath, servedOnGrHost } = await import("@/lib/edition");
  it("clean .gr addresses open the Business Pulse and Opportunities pages", () => {
    expect(grHostToAppPath("/business-pulse")).toBe("/greece/business-pulse");
    expect(grHostToAppPath("/opportunities")).toBe("/greece/opportunities");
  });
  it("the comparison page is served on both domains", () => {
    expect(servedOnGrHost("/compare/greece-cyprus")).toBe(true);
  });
});
