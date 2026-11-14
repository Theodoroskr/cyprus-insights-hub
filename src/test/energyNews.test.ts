import { describe, expect, it } from "vitest";
import { isEnergyStory, energyTopicsFor } from "@/lib/energyNews";

describe("EnergyHub filing", () => {
  it("files electricity and CERA stories as energy", () => {
    expect(isEnergyStory("CERA approves new electricity tariffs")).toBe(true);
    expect(isEnergyStory("EAC announces smart meter rollout")).toBe(true);
  });
  it("ignores look-alike words", () => {
    expect(isEnergyStory("A powerful start for the Nicosia marathon")).toBe(false);
  });
  it("assigns the solar topic to a battery storage grant", () => {
    expect(energyTopicsFor("New grant for home batteries and solar panels")).toContain("Solar & Storage");
  });
});
