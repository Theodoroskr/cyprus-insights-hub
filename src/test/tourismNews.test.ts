import { describe, expect, it } from "vitest";
import { isTourismStory } from "@/lib/tourismNews";

describe("TourismHub news", () => {
  it("includes tourism, hotel and aviation headlines", () => {
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
});
