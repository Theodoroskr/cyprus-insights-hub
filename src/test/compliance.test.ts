import { describe, expect, it } from "vitest";
import { deadlineEntries, diffFatf, filterItems, itemText, type ComplianceItem } from "@/lib/compliance";

const base: ComplianceItem = {
  id: "1", slug: "s", status: "published", sections: ["updates"], authority: "CySEC", jurisdiction: "CY", official_id: "C810", canonical_url: "https://x",
  document_type: "circular", official_title: "Circular C810", title_en: null, title_el: null, summary_en: null, summary_el: null,
  what_changed_en: null, what_changed_el: null, action_en: null, action_el: null, source_language: "en", topics: [], sectors: [],
  publication_date: "2026-10-27", application_date: null, effective_date: null, deadline_date: null, deadline_type: null, deadline_note: null,
  legal_act_ref: null, regime: null, measure_type: null, countries: [], audience: null, related_acts: [],
};

describe("FATF release comparison", () => {
  const prev = [
    { country_name: "Iran", country_code: "IR", category: "countermeasures" },
    { country_name: "Monaco", country_code: "MC", category: "increased_monitoring" },
    { country_name: "Myanmar", country_code: "MM", category: "increased_monitoring" },
  ];
  const cur = [
    { country_name: "Iran", country_code: "IR", category: "countermeasures" },
    { country_name: "Myanmar", country_code: "MM", category: "enhanced_due_diligence" },
    { country_name: "Bolivia", country_code: "BO", category: "increased_monitoring" },
  ];
  it("lists additions, removals and category changes, and nothing for unchanged countries", () => {
    expect(diffFatf(cur, prev)).toEqual([
      { name: "Bolivia", code: "BO", kind: "added", to: "increased_monitoring" },
      { name: "Myanmar", code: "MM", kind: "moved", from: "increased_monitoring", to: "enhanced_due_diligence" },
      { name: "Monaco", code: "MC", kind: "removed", from: "increased_monitoring" },
    ]);
  });
  it("reports no change between identical releases", () => expect(diffFatf(prev, prev)).toEqual([]));
});

describe("deadlines view", () => {
  const items = [
    { ...base, id: "a", deadline_date: "2026-12-01", deadline_type: "consultation_close" },
    { ...base, id: "b", application_date: "2027-07-10" },
    { ...base, id: "c", deadline_date: "2026-10-01", deadline_type: "filing" },
  ];
  it("shows only dates from today on, soonest first", () => {
    expect(deadlineEntries(items, "2026-11-13").map((e) => [e.item.id, e.date, e.type])).toEqual([["a", "2026-12-01", "consultation_close"], ["b", "2027-07-10", "application"]]);
  });
  it("does not list the same date twice for one record", () => {
    expect(deadlineEntries([{ ...base, deadline_date: "2027-01-01", deadline_type: "application", application_date: "2027-01-01" }], "2026-01-01")).toHaveLength(1);
  });
});

describe("language fallback", () => {
  it("shows the English summary on the Greek page and says which language it is in", () => {
    expect(itemText({ ...base, summary_en: "English text" }, "summary", "el")).toEqual({ text: "English text", shownLang: "en", fallback: true });
  });
  it("prefers the Greek summary when one exists", () => {
    expect(itemText({ ...base, summary_en: "EN", summary_el: "EL" }, "summary", "el").text).toBe("EL");
  });
});

describe("regulatory update filters", () => {
  const items = [{ ...base, id: "x", topics: ["aml_cft"], sectors: ["banks"] }, { ...base, id: "y", authority: "AMLA", jurisdiction: "EU", topics: ["mica"] }];
  it("filters by authority, jurisdiction, sector and topic together", () => {
    expect(filterItems(items, { authority: "CySEC", topic: "aml_cft", sector: "banks" }).map((i) => i.id)).toEqual(["x"]);
    expect(filterItems(items, { jurisdiction: "EU" }).map((i) => i.id)).toEqual(["y"]);
  });
});
