import { describe, it, expect } from "vitest";
import { budget503020, futureValue, monthlyForGoal, loanPayment, realValue, emergencyFund } from "./finCalc";
describe("finCalc", () => {
  it("50/30/20 split", () => expect(budget503020(2000)).toEqual({ needs: 1000, wants: 600, savings: 400 }));
  it("compound growth", () => expect(futureValue(1000, 0, 12, 1)).toBeCloseTo(1126.83, 1));
  it("zero rate", () => expect(futureValue(100, 10, 0, 1)).toBe(220));
  it("goal round-trips", () => { const m = monthlyForGoal(10000, 0, 5, 5); expect(futureValue(0, m, 5, 5)).toBeCloseTo(10000, 4); });
  it("loan payment", () => expect(loanPayment(100000, 4, 25)).toBeCloseTo(527.84, 1));
  it("inflation erodes", () => expect(realValue(1000, 2, 10)).toBeCloseTo(820.35, 1));
  it("emergency fund", () => expect(emergencyFund(1500, 6)).toBe(9000));
});
