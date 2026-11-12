/** Maps a search word to a news section, so "Compliance" brings that hub's stories. */
const SECTIONS: Record<string, string> = {
  compliance: "compliance", fintech: "fintech", regtech: "regtech", sme: "sme", business: "general", general: "general",
};
/** Source slugs readers might search by name. */
const SOURCES = ["icpac", "cysec", "cbc-announcements", "ecb", "eu-commission", "cystat", "esma", "eba", "pio"];

export function searchSection(q: string): string | null {
  return SECTIONS[q.trim().toLowerCase().replace(/[^a-z]/g, "")] ?? null;
}

export function searchSource(q: string): string | null {
  const t = q.trim().toLowerCase();
  return SOURCES.find((s) => s === t || s.split("-")[0] === t) ?? null;
}

/** Strip characters that break the PostgREST or() filter. */
export function safeTerm(q: string): string {
  return q.replace(/[,()*%\\"]/g, " ").trim();
}
