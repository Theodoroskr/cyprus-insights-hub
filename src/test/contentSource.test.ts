import { describe, it, expect } from "vitest";
import { emptySourceForm, sourceFormProblem, sourceRow, sourceSlug, splitPageUrl } from "@/lib/contentSource";

const form = (o = {}) => ({ ...emptySourceForm(), name: "Hellenic Bank News", pageUrl: "https://www.hellenicbank.com/en/news?page=1", ...o });

describe("back-office news sources", () => {
  it("splits a pasted page address into site and page path", () => {
    expect(splitPageUrl("https://www.hellenicbank.com/en/news?page=1")).toEqual({ url: "https://www.hellenicbank.com", scrape_path: "/en/news?page=1" });
    expect(splitPageUrl("https://example.com")).toEqual({ url: "https://example.com", scrape_path: "/" });
    expect(splitPageUrl("not a link")).toBeNull();
  });

  it("is never collected until reuse rights are confirmed", () => {
    expect(sourceRow(form()).access_status).toBe("pending");
    expect(sourceRow(form({ rightsConfirmed: true })).access_status).toBe("active");
  });

  it("stories wait for an editor unless auto-publish is chosen for a confirmed source", () => {
    expect(sourceRow(form({ rightsConfirmed: true })).auto_publish).toBe(false);
    expect(sourceFormProblem(form({ autoPublish: true }))).toMatch(/permission/);
    expect(sourceRow(form({ autoPublish: true })).auto_publish).toBe(false);
  });

  it("files Greece sources into the Greece edition with a section", () => {
    const row = sourceRow(form({ edition: "GR", grSection: "banking" }));
    expect(row.country).toBe("GR");
    expect(row.target_section).toBe("banking");
    expect(sourceRow(form()).target_section).toBeNull();
  });

  it("rejects a page that is already a source", () => {
    const existing = [{ id: "a", url: "https://www.hellenicbank.com", scrape_path: "/en/news?page=1" }];
    expect(sourceFormProblem(form(), existing)).toMatch(/already/);
    expect(sourceFormProblem(form(), existing, "a")).toBeNull();
  });

  it("makes a unique slug", () => {
    expect(sourceSlug("Τράπεζα Κύπρου", [], "www.bankofcyprus.com")).toBe("bankofcyprus-com");
    expect(sourceSlug("Hellenic Bank News", ["hellenic-bank-news"])).toBe("hellenic-bank-news-2");
  });
});
