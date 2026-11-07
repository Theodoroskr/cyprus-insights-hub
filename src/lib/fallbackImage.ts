import general from "@/assets/fallback/general.jpg";
import fintech from "@/assets/fallback/fintech.jpg";
import compliance from "@/assets/fallback/compliance.jpg";
import regtech from "@/assets/fallback/regtech.jpg";
import sme from "@/assets/fallback/sme.jpg";

const BY_VERTICAL: Record<string, string> = { general, fintech, compliance, regtech, sme };
export const FALLBACK_IMAGE = general;
const ALL = new Set(Object.values(BY_VERTICAL));

export function fallbackFor(vertical?: string | null): string {
  return BY_VERTICAL[(vertical || "").toLowerCase()] || general;
}

/** Use the article image when present, otherwise our own image for that hub. */
export function articleImage(url?: string | null, vertical?: string | null): string {
  return url && url.trim() ? url : fallbackFor(vertical);
}

/** Swap any broken article/story photo for our own image (skips logos, avatars, banners). */
export function installImageFallback() {
  document.addEventListener(
    "error",
    (e) => {
      const img = e.target as HTMLImageElement;
      if (!(img instanceof HTMLImageElement)) return;
      if (img.dataset.noFallback !== undefined) return;
      if (img.closest("[data-banner-slot]")) return;
      if (/rounded-full|object-contain/.test(img.className)) return;
      if (ALL.has(img.getAttribute("src") || "")) return;
      img.srcset = "";
      img.src = fallbackFor(img.dataset.vertical);
    },
    true,
  );
}
