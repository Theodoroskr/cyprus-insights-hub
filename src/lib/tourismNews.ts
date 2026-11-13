// Which published stories belong on TourismHub. Stories have no tourism vertical, so we match on the headline.

/** Word roots searched in headlines (first, broad pass in the database). */
export const TOURISM_TITLE_ROOTS = ["touris", "hotel", "hospitalit", "airline", "aviation", "cruise", "trips abroad", "trips of residents", "archaeolog", "excavation", "bathing water", "discovereu", "deputy ministry of tourism"];

// Precise check: whole-word matches only, so "Marina" (a name), "bank holiday" or "travels to Brussels" never count.
const TOURISM_RE = /\b(touris(m|t|ts|tic)|hotels?|hoteliers?|hospitality|airlines?|aviation|cruises?|trips abroad|trips of residents|archaeolog\w*|excavations?|bathing waters?|discovereu|deputy ministry of tourism)\b/i;

export function isTourismStory(title: string | null | undefined, tags?: string[] | null): boolean {
  if (title && TOURISM_RE.test(title)) return true;
  return (tags ?? []).some((t) => /^(tourism|hospitality)$/i.test(t.trim()));
}
