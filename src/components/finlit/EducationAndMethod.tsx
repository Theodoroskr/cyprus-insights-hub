import { useT, periodLabel } from "@/lib/finlitI18n";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FL_BORDER_L, FL_TEXT, type FlAccent } from "@/lib/finlitPalette";

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
  const t = useT();
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {TOPICS.map((x, i) => { const a = ([1, 2, 3, 4, 5] as FlAccent[])[i % 5]; return (
        <Card key={x.en} className={`border-l-4 ${FL_BORDER_L[a]}`}><CardContent className="p-4 space-y-1">
          <p className={`font-serif font-semibold ${FL_TEXT[a]}`}>{t.lang === "el" ? x.el : x.en}</p>
          <p className="text-xs text-muted-foreground" lang={t.lang === "el" ? "en" : "el"}>{t.lang === "el" ? x.en : x.el}</p>
          <p className="text-sm">{t(x.t)}</p>
        </CardContent></Card>
      ); })}
    </div>
  );
}

export function Methodology() {
  const t = useT();
  const items = [
    [t("OECD survey method"), t("The OECD/INFE survey of adults (2023 fieldwork, published 2025) scores knowledge, behaviour and attitudes, adding to an overall score out of 100. A score of 70+ is the OECD target level.")],
    [t("Survey year vs publication year"), t("Survey results describe the year interviews took place, not the year the report was released. We always show both.")],
    [t("Older Cyprus surveys"), t("The Central Bank of Cyprus 2018 survey uses different questions and a 0–7 scale, so it is shown separately and never compared with the OECD scores.")],
    [t("Eurostat definitions"), t("Household figures use Eurostat's official definitions (e.g. saving rate = gross saving ÷ disposable income). Each chart links to its Eurostat table.")],
    [t("CYSTAT data"), t("National CPI, GDP and unemployment come from the Cyprus Statistical Service on the Economy page. National CPI and EU-harmonised HICP measure inflation differently.")],
    [t("Update frequency"), t("Eurostat figures are checked daily and CYSTAT weekly. When a past figure is revised, it is reviewed before it changes here; a failed update never removes existing figures.")],
  ];
  return (
    <Accordion type="multiple">
      {items.map(([q, ans], i) => { const ac = ([1, 2, 3, 4, 5, 1] as FlAccent[])[i % 6]; return (
        <AccordionItem key={q} value={q}><AccordionTrigger className={`text-sm py-2 ${FL_TEXT[ac]}`}>{q}</AccordionTrigger><AccordionContent className="text-xs text-muted-foreground">{ans}</AccordionContent></AccordionItem>
      ); })}
    </Accordion>
  );
}
