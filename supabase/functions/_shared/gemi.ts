/** GEMI (Greek General Commercial Registry) Open Data API: access key handling and connection test. */
export const GEMI_API = "https://opendata-api.businessportal.gr/api/opendata/v1";
export const GEMI_KEY_NAME = "gemi_api_key";
export const GEMI_SOURCE_SLUG = "gemi-business-statistics";

/** A key as pasted by an admin: trimmed, one line, no spaces. Returns null when it cannot be a key. */
export function cleanGemiKey(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const k = raw.trim();
  return /^[\x21-\x7E]{8,256}$/.test(k) ? k : null;
}

export type GemiTest = { ok: boolean; rejected: boolean; httpStatus: number | null; message: string; legalTypes?: number };

/** Plain-language result of a GEMI test call. `rejected` = GEMI refused the key itself. */
export function describeGemiResponse(httpStatus: number | null, body: unknown): GemiTest {
  if (httpStatus === null) return { ok: false, rejected: false, httpStatus, message: "GEMI did not answer (timeout or network error). Try again later." };
  if (httpStatus === 200) {
    const n = Array.isArray(body) ? body.length : Array.isArray((body as { data?: unknown[] })?.data) ? (body as { data: unknown[] }).data.length : undefined;
    return { ok: true, rejected: false, httpStatus, message: n ? `Connected. GEMI returned ${n} legal forms.` : "Connected.", legalTypes: n };
  }
  if (httpStatus === 401 || httpStatus === 403) return { ok: false, rejected: true, httpStatus, message: "GEMI rejected this access key. Check it was copied in full and that GEMI has activated it." };
  if (httpStatus === 429) return { ok: false, rejected: false, httpStatus, message: "GEMI's request limit was reached. The key was not checked; try again in a few minutes." };
  if (httpStatus >= 500) return { ok: false, rejected: false, httpStatus, message: `GEMI is having problems (error ${httpStatus}). Try again later.` };
  return { ok: false, rejected: false, httpStatus, message: `GEMI answered with an unexpected error (${httpStatus}).` };
}

/** One light, read-only call (list of legal forms) to confirm the key works. */
export async function testGemiKey(key: string): Promise<GemiTest> {
  try {
    const res = await fetch(`${GEMI_API}/metadata/legalTypes`, {
      headers: { api_key: key, Accept: "application/json" },
      signal: AbortSignal.timeout(20000),
    });
    const body = await res.json().catch(() => null);
    return describeGemiResponse(res.status, body);
  } catch {
    return describeGemiResponse(null, null);
  }
}
