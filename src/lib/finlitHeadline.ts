/** Headline OECD survey figures shared by the public Financial Literacy overview and the private demo. */
export type HeadlineFinding = {
  indicator: string;
  value: number | null;
  publisher: string | null;
  breakdown_dimension?: string | null;
  survey_year?: number | null;
  published_year?: number | null;
};

/** Approved OECD whole-population findings (no age/gender breakdowns) — the set the overview score dial uses. */
export function headlineFindings<T extends HeadlineFinding>(rows: T[]): T[] {
  return rows.filter((x) => x.publisher?.startsWith("OECD") && !x.breakdown_dimension);
}

/** Overall score, share reaching the target and compound-interest result, read from the data (null when not published). */
export function headlineFigures(rows: HeadlineFinding[]) {
  const h = headlineFindings(rows);
  const find = (re: RegExp) => h.find((x) => re.test(x.indicator)) ?? null;
  const overall = find(/^overall financial literacy score$/i);
  const target = find(/target score/i);
  const compound = find(/compound/i);
  const src = overall ?? h[0] ?? null;
  return {
    overall: overall?.value ?? null,
    target: target?.value ?? null,
    compound: compound?.value ?? null,
    surveyYear: src?.survey_year ?? null,
    publishedYear: src?.published_year ?? null,
  };
}
