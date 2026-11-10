import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { budget503020, futureValue, monthlyForGoal, loanPayment, realValue, emergencyFund } from "@/lib/finCalc";

const eur = (v: number) => (Number.isFinite(v) ? `€${v.toLocaleString("en-GB", { maximumFractionDigits: 0 })}` : "—");

function Field({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (n: number) => void; step?: number }) {
  return (
    <div className="space-y-1"><Label className="text-xs">{label}</Label>
      <Input type="number" inputMode="decimal" step={step} min={0} value={value} onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))} /></div>
  );
}
function Result({ items }: { items: [string, string][] }) {
  return <div className="grid sm:grid-cols-3 gap-3">{items.map(([l, v]) => <div key={l} className="rounded-md bg-muted p-3"><p className="text-xs text-muted-foreground">{l}</p><p className="text-xl font-serif font-semibold">{v}</p></div>)}</div>;
}
const Note = ({ children }: { children: React.ReactNode }) => <p className="text-xs text-muted-foreground">{children}</p>;

export type CalculatorKey = "budget" | "goal" | "compound" | "loan" | "inflation" | "emergency";

export function Calculators({ only }: { only?: CalculatorKey } = {}) {
  const [inc, setInc] = useState(2000);
  const [goal, setGoal] = useState(10000); const [gStart, setGStart] = useState(1000); const [gRate, setGRate] = useState(2); const [gYears, setGYears] = useState(3);
  const [cStart, setCStart] = useState(1000); const [cMon, setCMon] = useState(100); const [cRate, setCRate] = useState(5); const [cYears, setCYears] = useState(20);
  const [lp, setLp] = useState(150000); const [lr, setLr] = useState(4); const [ly, setLy] = useState(25);
  const [ia, setIa] = useState(1000); const [ir, setIr] = useState(2.5); const [iy, setIy] = useState(10);
  const [ee, setEe] = useState(1500); const [em, setEm] = useState(6);
  const b = budget503020(inc);
  const fv = futureValue(cStart, cMon, cRate, cYears); const paid = cStart + cMon * cYears * 12;
  const pay = loanPayment(lp, lr, ly); const tot = pay * ly * 12;
  return (
    <Card><CardHeader><CardTitle className="font-serif">Money calculators</CardTitle>
      <p className="text-sm text-muted-foreground">Everything is worked out in your browser; nothing you type is saved or sent anywhere. Results are illustrations, not financial advice.</p></CardHeader>
      <CardContent>
        <Tabs defaultValue={only ?? "budget"}>
          <TabsList className={only ? "hidden" : "flex flex-wrap h-auto"}>
            {[["budget", "Monthly budget"], ["goal", "Savings goal"], ["compound", "Compound interest"], ["loan", "Loan repayment"], ["inflation", "Inflation"], ["emergency", "Emergency fund"]].map(([v, l]) => <TabsTrigger key={v} value={v}>{l}</TabsTrigger>)}
          </TabsList>
          <TabsContent value="budget" className="space-y-3 pt-3">
            <Field label="Monthly take-home pay (€)" value={inc} onChange={setInc} />
            <Result items={[["Needs (50%)", eur(b.needs)], ["Wants (30%)", eur(b.wants)], ["Savings & debt (20%)", eur(b.savings)]]} />
            <Note>Formula: the 50/30/20 rule splits take-home pay into needs (rent, food, bills), wants and savings or extra debt repayments. It is a starting point; adjust to your situation.</Note>
          </TabsContent>
          <TabsContent value="goal" className="space-y-3 pt-3">
            <div className="grid sm:grid-cols-4 gap-3"><Field label="Goal (€)" value={goal} onChange={setGoal} /><Field label="Already saved (€)" value={gStart} onChange={setGStart} /><Field label="Interest % a year" value={gRate} onChange={setGRate} step={0.1} /><Field label="Years" value={gYears} onChange={setGYears} /></div>
            <Result items={[["Save each month", eur(monthlyForGoal(goal, gStart, gRate, gYears))]]} />
            <Note>Assumes interest is added monthly at a fixed rate and you save the same amount every month.</Note>
          </TabsContent>
          <TabsContent value="compound" className="space-y-3 pt-3">
            <div className="grid sm:grid-cols-4 gap-3"><Field label="Starting amount (€)" value={cStart} onChange={setCStart} /><Field label="Monthly addition (€)" value={cMon} onChange={setCMon} /><Field label="Return % a year" value={cRate} onChange={setCRate} step={0.1} /><Field label="Years" value={cYears} onChange={setCYears} /></div>
            <Result items={[["Final balance", eur(fv)], ["You put in", eur(paid)], ["Growth from interest", eur(fv - paid)]]} />
            <Note>Formula: FV = P(1+r)ⁿ + PMT·((1+r)ⁿ−1)/r, with monthly rate r and n months. Only about a third of adults in Cyprus answered the OECD compound-interest question correctly. Returns are not guaranteed.</Note>
          </TabsContent>
          <TabsContent value="loan" className="space-y-3 pt-3">
            <div className="grid sm:grid-cols-3 gap-3"><Field label="Loan amount (€)" value={lp} onChange={setLp} /><Field label="Interest % a year" value={lr} onChange={setLr} step={0.1} /><Field label="Years" value={ly} onChange={setLy} /></div>
            <Result items={[["Monthly payment", eur(pay)], ["Total repaid", eur(tot)], ["Total interest", eur(tot - lp)]]} />
            <Note>Formula: M = P·r/(1−(1+r)^−n). Assumes a fixed rate; variable-rate loans change when rates move. Fees and insurance are not included.</Note>
          </TabsContent>
          <TabsContent value="inflation" className="space-y-3 pt-3">
            <div className="grid sm:grid-cols-3 gap-3"><Field label="Amount today (€)" value={ia} onChange={setIa} /><Field label="Inflation % a year" value={ir} onChange={setIr} step={0.1} /><Field label="Years" value={iy} onChange={setIy} /></div>
            <Result items={[["Buying power later", eur(realValue(ia, ir, iy))], ["Lost to inflation", eur(ia - realValue(ia, ir, iy))]]} />
            <Note>Formula: real value = amount ÷ (1+inflation)^years. See the inflation chart above for Cyprus's actual rates.</Note>
          </TabsContent>
          <TabsContent value="emergency" className="space-y-3 pt-3">
            <div className="grid sm:grid-cols-2 gap-3"><Field label="Essential monthly costs (€)" value={ee} onChange={setEe} /><Field label="Months to cover" value={em} onChange={setEm} /></div>
            <Result items={[["Emergency fund target", eur(emergencyFund(ee, em))]]} />
            <Note>A common guide is 3–6 months of essential costs (rent, food, bills, loan payments), kept in an easy-access account.</Note>
          </TabsContent>
        </Tabs>
      </CardContent></Card>
  );
}
