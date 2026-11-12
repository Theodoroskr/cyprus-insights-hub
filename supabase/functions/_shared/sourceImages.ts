/** Sources whose own preview images are low quality get one approved picture for every story. */
export const SOURCE_IMAGES: Record<string, string> = {
  icpac: "https://oralbierakmfxcqncjnz.supabase.co/storage/v1/object/public/banner-images/sources%2Ficpac-logo-wide.jpg",
};

export function sourceImageFor(sourceSlug: string | null | undefined): string | null {
  return SOURCE_IMAGES[(sourceSlug ?? "").split(":")[0]] ?? null;
}
