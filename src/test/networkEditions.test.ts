import { describe, it, expect } from "vitest";
import { currentNetworkEdition, editionLinks } from "@/lib/networkEditions";
import { editionNav } from "@/config/siteSections";
import { hostRedirect } from "@/lib/edition";

describe("edition switcher", () => {
  it("lists International, Cyprus, Greece in that order", () =>
    expect(editionLinks("en", "cy").map((l) => l.label)).toEqual(["International", "Cyprus", "Greece"]));
  it("uses Greek names on Greek pages", () =>
    expect(editionLinks("el", "cy").map((l) => l.label)).toEqual(["Διεθνή", "Κύπρος", "Ελλάδα"]));
  it("on the Cyprus site, International opens the International homepage and Greece opens /greece", () =>
    expect(editionLinks("en", "cy", false).map((l) => l.href)).toEqual(["/intl", "/", "/greece"]));
  it("on businesshub.gr Cyprus and International open on businesshub.cy", () => {
    const l = editionLinks("el", "gr", false);
    expect(l.map((x) => x.href)).toEqual(["https://businesshub.cy/intl", "https://businesshub.cy/", "/"]);
    expect(l.map((x) => x.external)).toEqual([true, true, false]);
  });
  it("once bhubnetwork.com carries International, it is the International address everywhere", () => {
    expect(editionLinks("en", "cy", true)[0]).toMatchObject({ href: "https://bhubnetwork.com/", external: true });
    const onIntl = editionLinks("en", "intl", true);
    expect(onIntl.map((x) => x.href)).toEqual(["/", "https://businesshub.cy/", "https://businesshub.cy/greece"]);
  });
  it("highlights the edition of the page", () => {
    expect(currentNetworkEdition("gr", "/greece/banking")).toBe("gr");
    expect(currentNetworkEdition("cy", "/intl")).toBe("intl");
    expect(currentNetworkEdition("cy", "/", "intl")).toBe("intl");
    expect(currentNetworkEdition("cy", "/")).toBe("cy");
    expect(currentNetworkEdition("cy", "/news")).toBe("cy");
  });
});

describe("top links per edition", () => {
  const labels = (e: Parameters<typeof editionNav>[0], lang: "en" | "el" = "en") => editionNav(e, lang, "cy").map((i) => i.label);
  it("International: Markets, Companies & Investment, Fintech, Compliance, Funding, Data", () =>
    expect(labels("intl")).toEqual(["Markets", "Companies & Investment", "Fintech", "Compliance", "Funding", "Data"]));
  it("International links jump to blocks of the International homepage", () => {
    for (const i of editionNav("intl", "en", "cy").slice(1)) expect(i.href.startsWith("/intl#")).toBe(true);
  });
  it("International Markets lists the Cyprus and Greece editions", () =>
    expect(editionNav("intl", "en", "cy")[0].children?.map((c) => c.href)).toEqual(["/", "/greece", "/compare/greece-cyprus"]));
  it("Greece links open Greece pages, in Greek on Greek pages", () => {
    const nav = editionNav("gr", "el", "cy");
    expect(nav[0].label).toBe("Επιχειρήσεις");
    for (const i of nav) expect(i.href.startsWith("/greece/")).toBe(true);
  });
  it("Cyprus keeps its own menu starting with All news", () => expect(labels("cy")[0]).toBe("All news"));
});

describe("bhubnetwork.com address", () => {
  it("keeps the whole site in place until it carries the International edition", () => {
    expect(hostRedirect("bhubnetwork.com", "/directory", "", false, false)).toBeNull();
    expect(hostRedirect("bhubnetwork.com", "/", "", false, false)).toBeNull();
  });
  it("once live: home and stories stay, Cyprus pages open on businesshub.cy, /intl moves to the home", () => {
    expect(hostRedirect("bhubnetwork.com", "/", "", false, true)).toBeNull();
    expect(hostRedirect("bhubnetwork.com", "/article/abc/x", "", false, true)).toBeNull();
    expect(hostRedirect("bhubnetwork.com", "/directory", "?q=a", false, true)).toBe("https://businesshub.cy/directory?q=a");
    expect(hostRedirect("bhubnetwork.com", "/intl", "", false, true)).toBe("https://bhubnetwork.com/");
    expect(hostRedirect("businesshub.cy", "/intl", "", false, true)).toBe("https://bhubnetwork.com/");
    expect(hostRedirect("businesshub.cy", "/intl", "", false, false)).toBeNull();
  });
});
