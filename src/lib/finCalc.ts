/** Pure financial calculators. Inputs are never stored. */
export function budget503020(income: number) {
  return { needs: income * 0.5, wants: income * 0.3, savings: income * 0.2 };
}
/** Future value with monthly contributions, monthly compounding. */
export function futureValue(start: number, monthly: number, annualRatePct: number, years: number) {
  const r = annualRatePct / 100 / 12; const n = Math.round(years * 12);
  if (r === 0) return start + monthly * n;
  const g = Math.pow(1 + r, n);
  return start * g + monthly * ((g - 1) / r);
}
/** Monthly saving needed to reach a goal. */
export function monthlyForGoal(goal: number, start: number, annualRatePct: number, years: number) {
  const r = annualRatePct / 100 / 12; const n = Math.round(years * 12);
  if (n <= 0) return Math.max(0, goal - start);
  if (r === 0) return Math.max(0, (goal - start) / n);
  const g = Math.pow(1 + r, n);
  return Math.max(0, (goal - start * g) * r / (g - 1));
}
/** Annuity loan payment. */
export function loanPayment(principal: number, annualRatePct: number, years: number) {
  const r = annualRatePct / 100 / 12; const n = Math.round(years * 12);
  if (n <= 0) return 0;
  const m = r === 0 ? principal / n : (principal * r) / (1 - Math.pow(1 + r, -n));
  return m;
}
/** Purchasing power of an amount after years of constant inflation. */
export function realValue(amount: number, inflationPct: number, years: number) {
  return amount / Math.pow(1 + inflationPct / 100, years);
}
export function emergencyFund(monthlyEssentials: number, months: number) {
  return monthlyEssentials * months;
}
