/**
 * Financial Literacy section palette (--fl-1 … --fl-5 in index.css).
 * Class names are spelled out in full so Tailwind's scanner finds them;
 * never build these strings with a template literal.
 */
export type FlAccent = 1 | 2 | 3 | 4 | 5;

export const FL_TEXT: Record<FlAccent, string> = {
  1: "text-finlit-1",
  2: "text-finlit-2",
  3: "text-finlit-3",
  4: "text-finlit-4",
  5: "text-finlit-5",
};

export const FL_BG: Record<FlAccent, string> = {
  1: "bg-finlit-1",
  2: "bg-finlit-2",
  3: "bg-finlit-3",
  4: "bg-finlit-4",
  5: "bg-finlit-5",
};

/** Tinted fill for chips, pills and panels. */
export const FL_SOFT: Record<FlAccent, string> = {
  1: "bg-finlit-1/10",
  2: "bg-finlit-2/10",
  3: "bg-finlit-3/10",
  4: "bg-finlit-4/10",
  5: "bg-finlit-5/10",
};

/** Very light wash for card backgrounds and header bands. */
export const FL_TINT: Record<FlAccent, string> = {
  1: "bg-finlit-1/[0.07]",
  2: "bg-finlit-2/[0.07]",
  3: "bg-finlit-3/[0.07]",
  4: "bg-finlit-4/[0.07]",
  5: "bg-finlit-5/[0.07]",
};

export const FL_BORDER: Record<FlAccent, string> = {
  1: "border-finlit-1",
  2: "border-finlit-2",
  3: "border-finlit-3",
  4: "border-finlit-4",
  5: "border-finlit-5",
};

export const FL_BORDER_SOFT: Record<FlAccent, string> = {
  1: "border-finlit-1/40",
  2: "border-finlit-2/40",
  3: "border-finlit-3/40",
  4: "border-finlit-4/40",
  5: "border-finlit-5/40",
};

/** Left accent rule on stat cards. */
export const FL_BORDER_L: Record<FlAccent, string> = {
  1: "border-l-finlit-1",
  2: "border-l-finlit-2",
  3: "border-l-finlit-3",
  4: "border-l-finlit-4",
  5: "border-l-finlit-5",
};

export const FL_HOVER_BG: Record<FlAccent, string> = {
  1: "group-hover:bg-finlit-1",
  2: "group-hover:bg-finlit-2",
  3: "group-hover:bg-finlit-3",
  4: "group-hover:bg-finlit-4",
  5: "group-hover:bg-finlit-5",
};

export const FL_HOVER_TEXT: Record<FlAccent, string> = {
  1: "group-hover:text-finlit-1",
  2: "group-hover:text-finlit-2",
  3: "group-hover:text-finlit-3",
  4: "group-hover:text-finlit-4",
  5: "group-hover:text-finlit-5",
};

export const FL_HOVER_BORDER: Record<FlAccent, string> = {
  1: "group-hover:border-finlit-1",
  2: "group-hover:border-finlit-2",
  3: "group-hover:border-finlit-3",
  4: "group-hover:border-finlit-4",
  5: "group-hover:border-finlit-5",
};

/** Raw CSS colour for SVG and chart props (recharts, stroke/fill attributes). */
export const flCss = (n: FlAccent) => `hsl(var(--fl-${n}))`;

export const MODULE_ACCENT: Record<string, FlAccent> = {
  overview: 1, observatory: 1, household: 5, cost: 2, credit: 4,
  academy: 3, calculators: 3, campaigns: 2, research: 5, methodology: 5,
};

export const GROUP_ACCENT: Record<string, FlAccent> = { data: 1, learn: 3, about: 2 };

export const moduleAccent = (key: string): FlAccent => MODULE_ACCENT[key] ?? 1;
export const groupAccent = (key: string): FlAccent => GROUP_ACCENT[key] ?? 1;

/** Survey indicators keep one colour everywhere: knowledge, behaviour, attitudes, digital. */
export function indicatorAccent(indicator: string): FlAccent {
  const s = (indicator ?? "").toLowerCase();
  if (/digital/.test(s)) return 4;
  if (/behaviour|behavior/.test(s)) return 3;
  if (/attitud/.test(s)) return 2;
  if (/knowledge/.test(s)) return 1;
  return 1;
}

/** Official dataset colours, shared by stat cards and charts. */
const STAT_ACCENT: Record<string, FlAccent> = {
  saving_rate: 1, net_earnings: 5, disposable_income: 5,
  unexpected_expenses: 2, poverty_rate: 4, arope_rate: 4,
  hicp_all: 2, hicp_food: 2, price_level: 2, household_consumption: 2,
  cbc_hh_deposits: 1, cbc_rate_deposit: 1,
  cbc_hh_loans: 4, cbc_hh_housing_loans: 4, cbc_hh_consumer_loans: 4,
  cbc_rate_mortgage: 4, cbc_rate_consumer: 4,
};

export const statAccent = (code: string): FlAccent => STAT_ACCENT[code] ?? 1;

/** Breakdown bars: gender, age and income each get their own colour. */
export const BREAKDOWN_ACCENT: Record<string, FlAccent> = { gender: 1, age: 3, income: 2 };
