// Which stories belong in the Tourism news section. Shared by the collectors and the site.

// Whole-word matches only, so "Marina" (a name), "bank holiday" or "travels to Brussels" never count.
const TOURISM_RE = /\b(touris(m|t|ts|tic)|hotels?|hoteliers?|hospitality|airlines?|aviation|cruises?|trips abroad|trips of residents|archaeolog\w*|excavations?|bathing waters?|discovereu|deputy ministry of tourism)\b/i;

/** Same rule as TOURISM_RE, in Postgres syntax, for moving existing stories. */
export const TOURISM_PG_RE = "\\m(touris(m|t|ts|tic)|hotels?|hoteliers?|hospitality|airlines?|aviation|cruises?|trips abroad|trips of residents|archaeolog\\w*|excavations?|bathing waters?|discovereu|deputy ministry of tourism)\\M";

export function isTourismStory(title: string | null | undefined, tags?: string[] | null): boolean {
  if (title && TOURISM_RE.test(title)) return true;
  return (tags ?? []).some((t) => /^(tourism|hospitality)$/i.test(t.trim()));
}
