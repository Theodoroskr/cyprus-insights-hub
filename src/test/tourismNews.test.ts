import { describe, expect, it } from "vitest";
import { isTourismStory } from "@/lib/tourismNews";
import { brands } from "@/config/brands";
import { releaseDraft } from "@/lib/ministryRelease";

describe("TourismHub news section", () => {
  it("files tourism, hotel and aviation headlines under Tourism", () => {
    expect(isTourismStory("Tourist Arrivals and Returns of Residents of Cyprus from Trips Abroad: May 2026")).toBe(true);
    expect(isTourismStory("Revenue from Tourism: January 2026")).toBe(true);
    expect(isTourismStory("European Aviation Strategy Summit concludes in Lefkosia")).toBe(true);
  });
  it("leaves out look-alike words", () => {
    expect(isTourismStory("Keynote speech by the Shipping Deputy Minister, Ms Marina Hadjimanolis")).toBe(false);
    expect(isTourismStory("Bank holiday")).toBe(false);
    expect(isTourismStory("The Minister of Finance travels to Brussels for the Eurogroup")).toBe(false);
  });
  it("includes stories an editor tagged Tourism", () => {
    expect(isTourismStory("Grant scheme opens", ["Tourism", "Grants & deadlines"])).toBe(true);
  });
  it("has its own News tab in the TourismHub menu", () => {
    expect(brands.tourismhub.navItems).toContainEqual({ label: "News", href: "/explore/news" });
  });
  it("files Ministry of Tourism releases under Tourism", () => {
    const d = releaseDraft({ url: "https://www.gov.cy/tourism/en/news/x/", sourceHeadline: "S", sourceDate: "2026-11-10", topic: "Tourism policy", language: "en", headline: "H", summary: "S", whatChanged: "", whoAffected: "", action: "" }, null);
    expect(d.vertical).toBe("tourism");
  });
});
