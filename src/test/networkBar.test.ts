import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { hubLinks } from "@/config/brands";
import { networkHome, INTL_PATH } from "@/lib/networkEditions";

/** The strip between the network-bar comment and the header that follows it. */
function networkStrip(file: string) {
  const src = readFileSync(file, "utf8");
  const start = src.indexOf("BHub Network strip");
  expect(start, `${file} should carry the network strip`).toBeGreaterThan(-1);
  const end = src.indexOf("<header", start);
  return src.slice(start, end === -1 ? src.length : end);
}

describe("top network bar", () => {
  it("keeps only the network name and the edition switcher on the main site", () => {
    const strip = networkStrip("src/components/TopNavigation.tsx");
    expect(strip).toContain("NetworkHomeLink");
    expect(strip).toContain("EditionSwitcher");
    for (const hub of hubLinks) {
      if (hub.href === "/") continue;
      expect(strip, `top bar must not link to ${hub.href}`).not.toContain(`"${hub.href}"`);
    }
  });

  it("keeps only the network name and the edition switcher on hub pages", () => {
    const strip = networkStrip("src/components/hub/HubNavigation.tsx");
    expect(strip).toContain("NetworkHomeLink");
    expect(strip).toContain("EditionSwitcher");
    expect(strip).not.toContain("hubLinks");
    for (const hub of hubLinks) {
      if (hub.href === "/") continue;
      expect(strip, `top bar must not link to ${hub.href}`).not.toContain(`"${hub.href}"`);
    }
  });

  it("lists every hub in the footers so they stay reachable", () => {
    const footer = readFileSync("src/components/Footer.tsx", "utf8");
    const hubFooter = readFileSync("src/components/hub/HubFooter.tsx", "utf8");
    for (const hub of hubLinks) {
      if (hub.href === "/") continue;
      expect(footer, `footer must list ${hub.href}`).toContain(`to="${hub.href}"`);
    }
    expect(hubFooter).toContain("hubLinks.map");
  });
});

describe("networkHome", () => {
  it("points the network name at the International edition on the Cyprus host", () => {
    expect(networkHome(false)).toEqual({ href: INTL_PATH, external: false });
  });

  it("points it back at the Cyprus address from the Greece host", () => {
    const { href, external } = networkHome(true);
    expect(external).toBe(true);
    expect(href).toBe(`https://businesshub.cy${INTL_PATH}`);
  });
});
