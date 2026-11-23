import { describe, expect, it } from "vitest";
import { cellarRestrictiveQuery, cybarCircularNo, cybarDedupeKey, isCybarRelevant, isMokasRelevant, parseCellarResults, parseMokasNotices } from "../../supabase/functions/_shared/compliance";
import { planBatchReview } from "@/lib/compliance";

describe("EU Publications Office (Cellar) reader", () => {
  it("keeps one row per CELEX number with its document date", () => {
    const body = { results: { bindings: [
      { celex: { value: "32026R2550" }, title: { value: "Council Implementing Regulation (EU) 2026/2550 concerning restrictive measures" }, date: { value: "2026-11-16" } },
      { celex: { value: "32026R2550" }, title: { value: "duplicate title" }, date: { value: "2026-11-16" } },
      { celex: { value: "not-a-celex" }, title: { value: "x" }, date: { value: "2026-11-16" } },
    ] } };
    expect(parseCellarResults(body)).toEqual([{ celex: "32026R2550", title: "Council Implementing Regulation (EU) 2026/2550 concerning restrictive measures", date: "2026-11-16" }]);
  });
  it("returns nothing for an unexpected answer", () => {
    expect(parseCellarResults({ error: "x" })).toEqual([]);
  });
  it("refuses a malformed start date in the query", () => {
    expect(() => cellarRestrictiveQuery("2026-11-01\"} DROP")).toThrow();
    expect(cellarRestrictiveQuery("2026-10-01")).toContain('"2026-10-01"^^xsd:date');
  });
});

describe("MOKAS notifications", () => {
  const html = `<td><font class="dateformat">15/05/2026 </font><br><a href="/Law/MOKAS/mokas.nsf/All/FE557B0E95B1747CC2258DF800233FFB?OpenDocument" class="linksview">Publication of the Annual Report of the Cyprus FIU for the year 2025</a><hr></td>`;
  it("reads date, title and the notice's own address", () => {
    expect(parseMokasNotices(html)).toEqual([{ id: "FE557B0E95B1747CC2258DF800233FFB", url: "https://www.law.gov.cy/law/mokas/mokas.nsf/All/FE557B0E95B1747CC2258DF800233FFB?OpenDocument", title: "Publication of the Annual Report of the Cyprus FIU for the year 2025", date: "2026-05-15" }]);
  });
  it("skips seminars and forums", () => {
    expect(isMokasRelevant("Programme for Seminar: Countering Terrorist Financing")).toBe(false);
    expect(isMokasRelevant("MONEYVAL’s first Public-Private learning and development forum on beneficial ownership")).toBe(false);
    expect(isMokasRelevant("Publication of the Annual Report of the Cyprus FIU for the year 2025")).toBe(true);
  });
});

describe("Cyprus Bar Association", () => {
  it("files a circular posted under two categories once, by its number", () => {
    expect(cybarCircularNo("ΕΓΚΥΚΛΙΟΣ 19/2026 – ΑΝΑΘΕΩΡΗΜΕΝΗ ΛΙΣΤΑ ΜΗ ΣΥΝΕΡΓΑΣΙΜΩΝ ΔΙΚΑΙΟΔΟΣΙΩΝ")).toBe("19/2026");
    expect(cybarCircularNo("ΝΕΑ ΠΕΡΙΟΡΙΣΤΙΚΑ ΜΕΤΡΑ ΤΗΣ ΕΥΡΩΠΑΙΚΗΣ ΕΝΩΣΗΣ")).toBeNull();
  });
  it("treats the same announcement re-posted under another category as one", () => {
    expect(cybarDedupeKey("ΚΑΤΕΥΘΥΝΤΗΡΙΕΣ ΓΡΑΜΜΕΣ ΑΝΑΦΟΡΙΚΑ ΜΕ ΤΗΝ ΕΚΤΕΛΕΣΗ", "2026-09-22")).toBe(cybarDedupeKey("Κατευθυντήριες γραμμές αναφορικά με την εκτέλεση", "2026-09-22"));
    expect(cybarDedupeKey("ΚΑΤΕΥΘΥΝΤΗΡΙΕΣ ΓΡΑΜΜΕΣ", "2026-09-22")).not.toBe(cybarDedupeKey("ΚΑΤΕΥΘΥΝΤΗΡΙΕΣ ΓΡΑΜΜΕΣ", "2026-09-23"));
  });
  it("skips seminars and event participation", () => {
    expect(isCybarRelevant("ΣΕΜΙΝΑΡΙΟ – «Countering Terrorist Financing»")).toBe(false);
    expect(isCybarRelevant("ΑΝΑΚΟΙΝΩΣΗ: Συμμετοχή στο 20ο Ετήσιο Ευρωπαϊκό Συνέδριο")).toBe(false);
    expect(isCybarRelevant("ΕΓΚΥΚΛΙΟΣ 17/2026 – ΑΝΑΘΕΩΡΗΜΕΝΟΣ ΚΑΤΑΛΟΓΟΣ ΜΗ ΣΥΝΕΡΓΑΣΙΜΩΝ ΦΟΡΟΛΟΓΙΚΩΝ ΔΙΚΑΙΟΔΟΣΙΩΝ")).toBe(true);
  });
});

describe("Batch publish / reject", () => {
  const ready = { id: "a", status: "review", sections: ["updates"], title_en: "T", summary_en: "S" };
  it("publishes only records with a section, title and summary", () => {
    const plan = planBatchReview([ready, { id: "b", status: "review", sections: [], title_en: "T", summary_en: "S" }, { id: "c", status: "review", sections: ["updates"], title_en: "T", summary_en: null }], "published");
    expect(plan).toEqual({ ids: ["a"], skipped: 2 });
  });
  it("never publishes test rows or records whose source changed", () => {
    expect(planBatchReview([{ ...ready, is_test: true }, { ...ready, id: "d", change_pending: true }], "published").ids).toEqual([]);
  });
  it("rejects any selected record not already rejected or merged", () => {
    expect(planBatchReview([{ id: "e", status: "review" }, { id: "f", status: "rejected" }, { id: "g", status: "merged" }], "rejected")).toEqual({ ids: ["e"], skipped: 2 });
  });
});
