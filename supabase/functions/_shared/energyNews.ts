// Which stories belong in EnergyHub, and which energy topics they cover. Shared by the collectors and the site.

export interface EnergyTopic { slug: string; en: string; el: string; re: RegExp }

export const ENERGY_TOPICS: EnergyTopic[] = [
  { slug: "electricity-prices", en: "Electricity & Prices", el: "Ηλεκτρισμός και Τιμές", re: /\b(electricity (price|bill|tariff|rate)s?|tariffs?|fuel (price|adjustment)s?|power bills?|kwh|eac)\b/i },
  { slug: "solar-storage", en: "Solar & Storage", el: "Φωτοβολταϊκά και Αποθήκευση", re: /\b(solar|photovoltaics?|pv|batter(y|ies)|storage|net[- ]metering|net[- ]billing)\b/i },
  { slug: "grid-market", en: "Grid & Electricity Market", el: "Δίκτυο και Αγορά Ηλεκτρισμού", re: /\b(grid|tsoc|transmission|distribution|competitive (electricity )?market|electricity market|smart meters?|dso)\b/i },
  { slug: "policy-regulation", en: "Policy & Regulation", el: "Πολιτική και Ρύθμιση", re: /\b(cera|regulatory authority|consultation|directive|energy (policy|minister|ministry|service)|nzecp|decarboni[sz]ation)\b/i },
  { slug: "projects-investment", en: "Projects & Investment", el: "Έργα και Επενδύσεις", re: /\b(power (plant|station)|wind (farm|park)|project|investment|vasilikos|dhekelia|plant)\b/i },
  { slug: "gas-interconnections", en: "Natural Gas & Interconnections", el: "Φυσικό Αέριο και Διασυνδέσεις", re: /\b(natural gas|lng|gas field|aphrodite|cronos|glaucus|interconnector|great sea|eastmed|offshore|hydrocarbons?)\b/i },
  { slug: "energy-efficiency", en: "Energy Efficiency", el: "Ενεργειακή Απόδοση", re: /\b(energy (efficiency|saving|upgrade|performance|audit)s?|insulation|heat pumps?|renovation|retrofit)\b/i },
];

// Whole words only, so "powerful", "gasp" or "Solaris" never count.
const ENERGY_RE = /\b(energy|electricity|eac|cera|tsoc|renewables?|solar|photovoltaics?|wind farms?|power (plant|station|cuts?|outages?)|natural gas|lng|interconnector|great sea interconnector|hydrocarbons?|fuel prices?|net[- ]metering|batter(y|ies) storage|blackouts?)\b/i;

/** Same rule as ENERGY_RE, in Postgres syntax, for moving existing stories. */
export const ENERGY_PG_RE = "\\m(energy|electricity|eac|cera|tsoc|renewables?|solar|photovoltaics?|wind farms?|power (plant|station|cuts?|outages?)|natural gas|lng|interconnector|great sea interconnector|hydrocarbons?|fuel prices?|net[- ]metering|batter(y|ies) storage|blackouts?)\\M";

export function isEnergyStory(title: string | null | undefined, tags?: string[] | null): boolean {
  if (title && ENERGY_RE.test(title)) return true;
  return (tags ?? []).some((t) => /^(energy|electricity)$/i.test(t.trim()));
}

/** Topic names (English) a story matches, for its tags. */
export function energyTopicsFor(text: string): string[] {
  return ENERGY_TOPICS.filter((t) => t.re.test(text)).map((t) => t.en);
}
