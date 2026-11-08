export type HealthInput = {
  status: string;
  last_error: string | null;
  last_checked_at: string | null;
  latest_period: string | null;
  max_staleness_days: number | null;
  max_period_lag_months: number | null;
};
export type Health = { state: "ok" | "error" | "missed_check" | "stale_period"; reason: string | null };

const DAY = 86_400_000;

/** Decide whether an official source needs admin attention. Errors win over missed checks, which win over stale months. */
export function assessSource(s: HealthInput, now: Date = new Date()): Health {
  if (s.status === "error") return { state: "error", reason: `Last check failed: ${s.last_error ?? "unknown error"}` };
  const maxDays = s.max_staleness_days ?? 35;
  if (!s.last_checked_at) return { state: "missed_check", reason: "Never checked" };
  const age = Math.floor((now.getTime() - new Date(s.last_checked_at).getTime()) / DAY);
  if (age > maxDays) return { state: "missed_check", reason: `Not checked for ${age} days (expected every ${maxDays} days or less)` };
  if (s.max_period_lag_months != null) {
    if (!s.latest_period) return { state: "stale_period", reason: "No published month on record" };
    const p = new Date(s.latest_period);
    const lag = (now.getUTCFullYear() - p.getUTCFullYear()) * 12 + (now.getUTCMonth() - p.getUTCMonth());
    if (lag > s.max_period_lag_months) return { state: "stale_period", reason: `Latest month is ${s.latest_period.slice(0, 7)}, ${lag} months behind (limit ${s.max_period_lag_months})` };
  }
  return { state: "ok", reason: null };
}
