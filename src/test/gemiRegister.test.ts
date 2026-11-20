import { describe, it, expect } from "vitest";
import { countOnOrAfter, monthsBetween, nextMonth, parseGemiDate } from "../../supabase/functions/_shared/gemiRegister";

// A newest-first register: `perMonth` registrations in each month, plus undated records.
function register(perMonth: Record<string, number>, undated = 0, nullsFirst = true) {
  const dated: string[] = [];
  for (const [m, n] of Object.entries(perMonth).sort().reverse()) for (let i = 0; i < n; i++) dated.push(`${m}-${String(28 - (i % 27)).padStart(2, "0")}`);
  dated.sort().reverse();
  const nulls = Array(undated).fill(null);
  const all: (string | null)[] = nullsFirst ? [...nulls, ...dated] : [...dated, ...nulls];
  let calls = 0;
  const probe = async (o: number) => { calls++; return { dates: all.slice(o, o + 100) }; };
  return { all, probe, calls: () => calls };
}

describe("GEMI new registrations per month", () => {
  const months = { "2025-10": 4321, "2025-11": 3987, "2025-12": 5012, "2026-01": 250 };
  it("counts each month exactly as the difference of two boundaries, with undated records on top", async () => {
    const r = register(months, 777, true);
    const n = (d: string, from?: number) => countOnOrAfter(r.probe, d, r.all.length, { nullsFirst: true, pageSize: 100, from });
    const dec = await n("2025-12-01");
    const jan = await n("2026-01-01");
    expect(dec - jan).toBe(5012);
    const nov = await n("2025-11-01", dec);
    expect(nov - dec).toBe(3987);
  });
  it("works when undated records sit at the bottom", async () => {
    const r = register(months, 500, false);
    const n = (d: string) => countOnOrAfter(r.probe, d, r.all.length, { nullsFirst: false, pageSize: 100 });
    expect((await n("2025-10-01")) - (await n("2025-11-01"))).toBe(4321);
  });
  it("needs a few dozen look-ups, not one per page", async () => {
    const r = register({ "2024-01": 90000, "2024-02": 8000, "2024-03": 8000 }, 0);
    await countOnOrAfter(r.probe, "2024-02-01", r.all.length, { nullsFirst: true, pageSize: 100 });
    expect(r.calls()).toBeLessThan(40);
  });
  it("reads GEMI date formats and lists months", () => {
    expect(parseGemiDate("2024-05-10T00:00:00")).toBe("2024-05-10");
    expect(parseGemiDate("10/05/2024")).toBe("2024-05-10");
    expect(parseGemiDate("")).toBeNull();
    expect(monthsBetween("2025-11", "2026-02")).toEqual(["2025-11", "2025-12", "2026-01"]);
    expect(nextMonth("2025-12")).toBe("2026-01");
  });
});

import { countMonths } from "../../supabase/functions/_shared/gemiRegister";
describe("GEMI months counted in one run", () => {
  it("counts several months newest first, including after a gap, and resumes when out of time", async () => {
    const r = register({ "2025-08": 111, "2025-09": 222, "2025-10": 333, "2025-11": 444, "2025-12": 555 }, 50);
    const { values } = await countMonths(r.probe, r.all.length, ["2025-12", "2025-11", "2025-09", "2025-08"], { nullsFirst: true, pageSize: 100 });
    expect(Object.fromEntries(values)).toEqual({ "2025-12": 555, "2025-11": 444, "2025-09": 222, "2025-08": 111 });
    let n = 0;
    const part = await countMonths(r.probe, r.all.length, ["2025-12", "2025-11", "2025-10"], { nullsFirst: true, pageSize: 100, outOfTime: () => n++ >= 1 });
    expect([...part.values.keys()]).toEqual(["2025-12"]);
    expect(part.next).toBe("2025-12");
  });
});
