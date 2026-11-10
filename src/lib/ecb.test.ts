import { describe, it, expect } from "vitest";
import { ecbUrl, parseEcbCsv, nicosiaHour } from "../../supabase/functions/_shared/ecb";
import { diffObservations } from "../../supabase/functions/_shared/eurostat";

const CSV = `KEY,FREQ,REF_AREA,TIME_PERIOD,OBS_VALUE
MIR.M.CY.B.A2C.A.R.A.2250.EUR.N,M,CY,2026-08,3.30
MIR.M.CY.B.A2C.A.R.A.2250.EUR.N,M,CY,2026-09,3.26
MIR.M.U2.B.A2C.A.R.A.2250.EUR.N,M,U2,2026-09,3.62
MIR.M.U2.B.A2C.A.R.A.2250.EUR.N,M,U2,2026-07,
MIR.M.CY.B.A2C.A.R.A.2250.EUR.N,M,CY,2026-09,3.26`;

describe("ECB / Central Bank of Cyprus import", () => {
  it("builds one request for Cyprus and the euro area", () => {
    expect(ecbUrl({ dataset_code: "MIR", filters: { series: "M.{geo}.B.A2C.A.R.A.2250.EUR.N" }, geos: ["CY", "EA"], since_period: "2020-01" }))
      .toBe("https://data-api.ecb.europa.eu/service/data/MIR/M.CY+U2.B.A2C.A.R.A.2250.EUR.N?format=csvdata&detail=dataonly&startPeriod=2020-01");
  });
  it("maps U2 to euro area and keeps values", () => {
    const { rows } = parseEcbCsv(CSV, ["CY", "EA"]);
    expect(rows.find((r) => r.geo === "EA" && r.period === "2026-09")?.value).toBe(3.62);
    expect(rows.find((r) => r.geo === "CY" && r.period === "2026-09")?.period_date).toBe("2026-09-01");
  });
  it("never stores a blank cell as zero", () => {
    expect(parseEcbCsv(CSV, ["CY", "EA"]).rows.some((r) => r.geo === "EA" && r.period === "2026-07")).toBe(false);
  });
  it("rejects duplicate periods", () => {
    const p = parseEcbCsv(CSV, ["CY", "EA"]);
    expect(p.rows.filter((r) => r.geo === "CY" && r.period === "2026-09")).toHaveLength(1);
    expect(p.rejected).toContain("CY 2026-09: duplicate observation");
  });
  it("a changed past month becomes a revision, a new month publishes", () => {
    const { rows } = parseEcbCsv(CSV, ["CY", "EA"]);
    const d = diffObservations(rows, new Map([["CY|2026-08", { value: 3.4, status_flag: null }]]));
    expect(d.revisions.map((r) => r.row.period)).toEqual(["2026-08"]);
    expect(d.inserts).toHaveLength(2);
  });
  it("runs at 04:00 Cyprus time in both winter and summer", () => {
    expect(nicosiaHour(new Date("2026-12-05T02:00:00Z"))).toBe(4);
    expect(nicosiaHour(new Date("2026-07-05T01:00:00Z"))).toBe(4);
    expect(nicosiaHour(new Date("2026-07-05T02:00:00Z"))).toBe(5);
  });
});

import { comparePubs, relevantPubs } from "../../supabase/functions/_shared/oecdMonitor";
describe("OECD publication monitor", () => {
  const items = [
    { DOI: "10.1787/345ca38a-en", title: ["Financial literacy in Cyprus"], issued: { "date-parts": [[2025, 3, 13]] }, deposited: { "date-time": "2025-03-13T00:00:00Z" } },
    { DOI: "10.1787/888933485138", title: ["Figure IV.3.15 Financial literacy Cyprus"] },
    { DOI: "10.1787/81e95597-en", title: ["Strengthening Financial Literacy in Germany"] },
  ];
  it("keeps only OECD Cyprus financial reports, not figures or other countries", () => {
    expect(relevantPubs(items).map((p) => p.doi)).toEqual(["10.1787/345ca38a-en"]);
  });
  it("flags a new report and a re-deposited one", () => {
    const known = relevantPubs(items);
    const next = [{ ...known[0], deposited: "2026-12-01T00:00:00Z" }, { doi: "10.1787/new-en", title: "Financial literacy in Cyprus 2027", issued: "2027-01-01", deposited: null }];
    const r = comparePubs(next, known);
    expect(r.added.map((p) => p.doi)).toEqual(["10.1787/new-en"]);
    expect(r.changed).toHaveLength(1);
  });
});
