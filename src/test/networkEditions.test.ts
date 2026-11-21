import { describe, it, expect } from "vitest";
import { currentNetworkEdition, editionLinks } from "@/lib/networkEditions";

describe("edition switcher", () => {
  it("lists International, Cyprus, Greece in that order", () =>
    expect(editionLinks("en", false).map((l) => l.label)).toEqual(["International", "Cyprus", "Greece"]));
  it("uses Greek names on Greek pages", () =>
    expect(editionLinks("el", false).map((l) => l.label)).toEqual(["Διεθνή", "Κύπρος", "Ελλάδα"]));
  it("on businesshub.cy every edition opens in place", () =>
    expect(editionLinks("en", false).map((l) => l.href)).toEqual(["/news?scope=international", "/", "/greece"]));
  it("on businesshub.gr Cyprus and International open on businesshub.cy", () => {
    const l = editionLinks("el", true);
    expect(l.map((x) => x.href)).toEqual(["https://businesshub.cy/news?scope=international", "https://businesshub.cy/", "/"]);
    expect(l.map((x) => x.external)).toEqual([true, true, false]);
  });
  it("highlights the edition of the page", () => {
    expect(currentNetworkEdition("gr", "/greece/banking", "")).toBe("gr");
    expect(currentNetworkEdition("cy", "/news", "?scope=international")).toBe("intl");
    expect(currentNetworkEdition("cy", "/directory", "")).toBe("cy");
  });
});
