import { describe, it, expect } from "vitest";
import { headlineFigures, headlineFindings } from "./finlitHeadline";

const rows = [
  { indicator: "Overall financial literacy score", value: 56, publisher: "OECD", breakdown_dimension: null, survey_year: 2023, published_year: 2025 },
  { indicator: "Adults reaching the target score (70+)", value: 17, publisher: "OECD", breakdown_dimension: null },
  { indicator: "Answered the compound-interest question correctly", value: 34, publisher: "OECD", breakdown_dimension: null },
  { indicator: "Overall financial literacy score", value: 61, publisher: "OECD", breakdown_dimension: "gender" },
  { indicator: "Financial knowledge score", value: 4.78, publisher: "Central Bank of Cyprus", breakdown_dimension: null },
];

describe("demo headline figures", () => {
  it("reads the overall score, target share and compound result from the survey rows", () => {
    expect(headlineFigures(rows)).toEqual({ overall: 56, target: 17, compound: 34, surveyYear: 2023, publishedYear: 2025 });
  });
  it("ignores breakdown rows and non-OECD surveys", () => {
    expect(headlineFindings(rows)).toHaveLength(3);
  });
  it("shows nothing rather than a made-up figure when a result is not published", () => {
    expect(headlineFigures(rows.slice(2)).overall).toBeNull();
    expect(headlineFigures([]).target).toBeNull();
  });
});
