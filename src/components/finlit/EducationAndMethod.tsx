import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const TOPICS = [
  { en: "Budgeting", el: "Προϋπολογισμός", t: "Track what comes in and goes out each month, then plan spending before the month starts." },
  { en: "Saving", el: "Αποταμίευση", t: "Pay yourself first: move savings on payday, and keep an emergency fund in an easy-access account." },
  { en: "Credit", el: "Πίστωση", t: "Borrowing costs money. Compare the annual percentage rate (APR), not just the monthly payment." },
  { en: "Debt", el: "Χρέος", t: "List every debt with its rate. Pay the most expensive first while keeping up minimum payments on the rest." },
  { en: "Interest rates", el: "Επιτόκια", t: "Interest compounds: you earn (or owe) interest on past interest, so time makes a big difference." },
  { en: "Inflation", el: "Πληθωρισμός", t: "Rising prices shrink what your money buys. Savings earning less than inflation lose value in real terms." },
  { en: "Investing basics", el: "Βασικές επενδύσεις", t: "Higher possible returns come with higher risk. Spread risk and check firms are licensed by CySEC." },
  { en: "Fraud prevention", el: "Πρόληψη απάτης", t: "Promises of guaranteed high returns are a warning sign. Check the CySEC warnings list before investing." },
  { en: "Digital financial safety", el: "Ψηφιακή ασφάλεια", t: "Banks never ask for your PIN or one-time codes. Use strong passwords and two-step sign-in." },
];

export function Education() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {TOPICS.map((x) => (
        <Card key={x.en}><CardContent className="p-4 space-y-1">
          <p className="font-serif font-semibold">{x.en}</p>
          <p className="text-xs text-muted-foreground" lang="el">{x.el}</p>
          <p className="text-sm">{x.t}</p>
        </CardContent></Card>
      ))}
    </div>
  );
}

export function Methodology() {
  const items = [
    ["OECD survey method", "The OECD/INFE survey of adults (2023 fieldwork, published 2025) scores knowledge, behaviour and attitudes, adding to an overall score out of 100. A score of 70+ is the OECD target level."],
    ["Survey year vs publication year", "Survey results describe the year interviews took place, not the year the report was released. We always show both."],
    ["Older Cyprus surveys", "The Central Bank of Cyprus 2018 survey uses different questions and a 0–7 scale, so it is shown separately and never compared with the OECD scores."],
    ["Eurostat definitions", "Household figures use Eurostat's official definitions (e.g. saving rate = gross saving ÷ disposable income). Each chart links to its Eurostat table."],
    ["CYSTAT data", "National CPI, GDP and unemployment come from the Cyprus Statistical Service on the Economy page. National CPI and EU-harmonised HICP measure inflation differently."],
    ["Update frequency", "Eurostat figures are checked daily and CYSTAT weekly. When a past figure is revised, it is reviewed before it changes here; a failed update never removes existing figures."],
    ["Cyprus vs EU limits", "Comparisons use the same period for both. Price levels and incomes reflect different cost structures, so differences should be read with care."],
  ];
  return (
    <Accordion type="multiple">
      {items.map(([q, a]) => <AccordionItem key={q} value={q}><AccordionTrigger>{q}</AccordionTrigger><AccordionContent className="text-sm text-muted-foreground">{a}</AccordionContent></AccordionItem>)}
    </Accordion>
  );
}
