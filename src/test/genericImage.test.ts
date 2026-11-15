import { describe, it, expect } from "vitest";
import { isGenericImage } from "../../supabase/functions/_shared/genericImage";
import { hasOwnPhoto } from "../../supabase/functions/_shared/facebookPosting";
import { distinctNeighbours, fallbackFor, storyImage } from "@/lib/fallbackImage";

describe("publisher logos are not a story's own picture", () => {
  it("treats the BIS default share picture and other publisher logos as no picture", () => {
    expect(isGenericImage("https://www.bis.org/themes/custom/bis/src/assets/images/meta-default.jpg")).toBe(true);
    expect(isGenericImage("https://ec.europa.eu/commission/presscorner/static/sm_ec_logo_big.jpg")).toBe(true);
    expect(isGenericImage("https://www.ecb.europa.eu")).toBe(true);
    expect(isGenericImage("/content/dam/mccom/shared/socialmedia/mastercard-og-image.png")).toBe(true);
  });

  it("keeps a real story photo and our approved source pictures", () => {
    expect(isGenericImage("https://www.gov.cy/media/sites/11/2025/10/AdobeStock_1690304752-1920x905.jpeg")).toBe(false);
    expect(isGenericImage("https://oralbierakmfxcqncjnz.supabase.co/storage/v1/object/public/banner-images/sources%2Ficpac-logo-wide.jpg")).toBe(false);
  });

  it("gives a logo-only story one of our hub photos and never posts the logo on social media", () => {
    const logo = "https://www.bis.org/themes/custom/bis/src/assets/images/meta-default.jpg";
    expect(storyImage(logo, "fintech", "a1")).toBe(fallbackFor("fintech", "a1"));
    expect(hasOwnPhoto({ image_url: logo } as any)).toBe(false);
  });
});

describe("five logo-only stories in a row", () => {
  it("show no repeated picture among any four neighbouring cards", () => {
    const imgs = ["a", "b", "c", "d", "e"].map((id) => storyImage("https://www.bis.org/themes/custom/bis/src/assets/images/meta-default.jpg", "fintech", id));
    const out = distinctNeighbours(imgs, Array(5).fill("fintech"));
    for (let i = 0; i + 4 <= out.length; i++) expect(new Set(out.slice(i, i + 4)).size).toBe(4);
  });
});
