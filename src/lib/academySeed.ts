// Starter drafts for the Financial Literacy Academy. Original BusinessHub text (not OECD material).
// Imported by admins as DRAFTS; nothing here is public until approved in the Academy admin tab.
export type SeedLesson = { slug: string; title_en: string; title_el: string; summary_en: string; summary_el: string; body_en: string; minutes: number; level?: "beginner" | "intermediate" | "advanced"; calculator?: string; stat_codes?: string[] };
export type SeedProgramme = { slug: string; code: string; title_en: string; title_el: string; summary_en: string; summary_el: string; audience_en: string; audience_el: string; level: "beginner" | "intermediate" | "advanced"; objectives_en: string[]; notice_en?: string; notice_el?: string; lessons: SeedLesson[] };

const L = (slug: string, title_en: string, title_el: string, summary_en: string, summary_el: string, body_en: string, minutes = 6, extra: Partial<SeedLesson> = {}): SeedLesson =>
  ({ slug, title_en, title_el, summary_en, summary_el, body_en, minutes, ...extra });

export const ACADEMY_SEED: SeedProgramme[] = [
  {
    slug: "money-management-essentials", code: "A", level: "beginner",
    title_en: "Money Management Essentials", title_el: "Βασικές Αρχές Διαχείρισης Χρημάτων",
    summary_en: "Take control of everyday money: know where it goes, plan a budget, build a safety cushion and set goals you can reach.",
    summary_el: "Πάρτε τον έλεγχο των καθημερινών σας χρημάτων: προϋπολογισμός, αποταμίευση ασφαλείας και εφικτοί στόχοι.",
    audience_en: "General public and young adults", audience_el: "Ευρύ κοινό και νέοι ενήλικες",
    objectives_en: ["Describe your income, fixed costs and flexible spending", "Build and review a monthly budget", "Size an emergency fund", "Explain how inflation reduces what money buys"],
    lessons: [
      L("understanding-personal-finances", "Understanding personal finances", "Κατανοώντας τα προσωπικά οικονομικά", "The four building blocks: income, spending, saving and borrowing.", "Τα τέσσερα δομικά στοιχεία: εισόδημα, δαπάνες, αποταμίευση, δανεισμός.",
`Personal finance is the way you manage four things: **income** (what comes in), **spending** (what goes out), **saving** (what you keep for later) and **borrowing** (what you use now and repay later).

### Net, not gross
Plan with your *take-home* pay — the amount that reaches your account after tax and social insurance. In Cyprus, salaried employees also need to remember that a 13th salary, if paid, arrives in December and should be planned, not treated as a bonus to spend at once.

### Fixed and flexible costs
- **Fixed**: rent or mortgage, loan payments, insurance, subscriptions.
- **Flexible**: food, fuel, eating out, shopping.

Fixed costs are hard to change quickly, so they set the floor of your budget. Flexible costs are where most savings are found.

### Try this
Write down last month's take-home pay and your five largest costs. That simple list is the start of a budget.`),
      L("creating-a-monthly-budget", "Creating a monthly budget", "Δημιουργία μηνιαίου προϋπολογισμού", "A simple method for planning each month before it starts.", "Μια απλή μέθοδος για να σχεδιάζετε κάθε μήνα εκ των προτέρων.",
`A budget is a plan made **before** the month begins. A common starting point is the **50/30/20 rule**:

- **50% needs** — housing, food, utilities, transport, minimum loan payments.
- **30% wants** — leisure, dining out, holidays.
- **20% savings and extra debt repayment.**

These shares are a guide, not a rule. If rent alone takes 45% of your pay, lower the "wants" share instead of skipping savings altogether.

### Steps
1. Start with take-home pay.
2. List fixed costs first.
3. Set a savings amount and move it on payday ("pay yourself first").
4. Share what is left between flexible categories.
5. Review at month end and adjust.

Use the calculator below to see a 50/30/20 split for your own pay. Nothing you type is saved.`, 7, { calculator: "budget" }),
      L("tracking-income-and-expenses", "Tracking income and expenses", "Παρακολούθηση εσόδων και εξόδων", "Why tracking for one month changes how you spend.", "Γιατί η καταγραφή για έναν μήνα αλλάζει τον τρόπο που ξοδεύετε.",
`You can't manage what you don't measure. Track every payment for one full month.

### Ways to track
- **Banking app**: most Cyprus banks group card payments into categories automatically.
- **Spreadsheet or notebook**: works well for cash.
- **Envelope method**: fixed cash amounts for flexible categories.

### What to look for
- Small, frequent payments (coffees, delivery, in-app purchases) that add up.
- Subscriptions you no longer use.
- Irregular costs — car service, school fees, annual insurance. Divide them by 12 and set that amount aside every month.

At the end of the month, compare what you spent with your budget. The difference shows where to adjust.`),
      L("building-emergency-savings", "Building emergency savings", "Δημιουργία αποθεματικού έκτακτης ανάγκης", "How much to keep aside for the unexpected, and where.", "Πόσα να κρατάτε για τα απρόβλεπτα και πού.",
`An emergency fund pays for the unexpected — a car repair, a medical bill, a gap between jobs — without borrowing.

### How much?
A common guide is **3 to 6 months of essential expenses**. People with irregular income, such as freelancers, often aim higher.

### Where to keep it
- Easy to reach within a day or two.
- Separate from your everyday account, so it is not spent by accident.
- Low risk — an emergency fund is not an investment.

### Build it step by step
Start with a first target of €500–€1,000, then grow it. Official Eurostat figures shown below show how many households in Cyprus would struggle with an unexpected expense.`, 6, { calculator: "emergency", stat_codes: ["unexpected_expenses", "saving_rate"] }),
      L("setting-financial-goals", "Setting financial goals", "Θέτοντας οικονομικούς στόχους", "Turn wishes into specific, dated, affordable goals.", "Μετατρέψτε τις επιθυμίες σε συγκεκριμένους, εφικτούς στόχους.",
`A goal becomes reachable when it is **specific, measurable and dated**: "Save €6,000 for a car deposit by June 2028" rather than "save more".

### Short, medium and long term
- **Short (under 1 year)**: emergency fund, holiday.
- **Medium (1–5 years)**: car, home deposit, studies.
- **Long (5+ years)**: retirement, children's education.

### Work backwards
Divide the amount still needed by the months left. If the monthly figure is not affordable, extend the date or lower the target — don't drop the goal.

Use the savings goal calculator below to see the monthly amount for a goal of your own.`, 6, { calculator: "goal" }),
      L("understanding-inflation", "Understanding inflation", "Κατανοώντας τον πληθωρισμό", "Why the same money buys less over time, with live Cyprus figures.", "Γιατί τα ίδια χρήματα αγοράζουν λιγότερα με τον χρόνο.",
`**Inflation** is the general rise in prices over time. If inflation is 3% a year, something that costs €100 today costs about €103 next year.

### Why it matters
- Money held in cash loses buying power.
- Wages that rise slower than prices mean a lower real income.
- Savings earning less than inflation shrink in real terms.

### How it is measured
In Cyprus, CYSTAT publishes the Consumer Price Index (CPI), and Eurostat publishes the EU-harmonised index (HICP) so countries can be compared. The latest official figures are shown below with their source and period.

Use the inflation calculator to see what a sum of money is worth in real terms after several years.`, 6, { calculator: "inflation", stat_codes: ["hicp_all", "hicp_food"] }),
    ],
  },
  {
    slug: "credit-and-responsible-borrowing", code: "B", level: "intermediate",
    title_en: "Credit & Responsible Borrowing", title_el: "Πίστωση & Υπεύθυνος Δανεισμός",
    summary_en: "Understand how loans and cards work, what borrowing really costs, and how to spot debt trouble early.",
    summary_el: "Πώς λειτουργούν τα δάνεια και οι κάρτες, το πραγματικό κόστος και τα πρώτα σημάδια υπερχρέωσης.",
    audience_en: "Individuals and households", audience_el: "Ιδιώτες και νοικοκυριά",
    objectives_en: ["Compare loans using APR", "Calculate a loan repayment", "Explain what a credit report contains", "Recognise warning signs of over-indebtedness"],
    lessons: [
      L("understanding-credit", "Understanding credit", "Κατανοώντας την πίστωση", "What credit is, and the difference between good and costly debt.", "Τι είναι η πίστωση και η διαφορά καλού και ακριβού χρέους.",
`Credit means using money now and paying it back later, usually with interest. Lenders decide based on your **ability** to repay (income, other debts) and your **history** of repaying.

### Secured and unsecured
- **Secured** loans (e.g. a mortgage) are backed by an asset the lender can claim if you don't pay. Rates are usually lower.
- **Unsecured** loans (personal loans, credit cards) have no asset behind them and usually cost more.

### Useful and costly borrowing
Borrowing can make sense for long-lasting things — a home, education. Borrowing for day-to-day spending, especially on a card you can't clear each month, tends to become expensive quickly.`),
      L("personal-loans", "Personal loans", "Προσωπικά δάνεια", "How fixed-term personal loans work and what to check before signing.", "Πώς λειτουργούν τα προσωπικά δάνεια και τι να ελέγξετε.",
`A personal loan gives you a fixed amount, repaid in equal monthly instalments over a set term.

### Before you sign, check
- The **APR** (annual percentage rate), which includes most fees.
- Whether the rate is **fixed** or **variable**. In Cyprus, many loans are linked to a base rate such as Euribor, so payments can change.
- Arrangement fees, early-repayment charges and any required insurance.
- The **total amount repayable**, not just the monthly payment.

Under EU consumer-credit rules, lenders must give you standard pre-contract information so offers can be compared. Take it home and read it before agreeing.`, 6, { calculator: "loan" }),
      L("credit-cards", "Credit cards", "Πιστωτικές κάρτες", "Grace periods, minimum payments and how card interest builds up.", "Περίοδοι χάριτος, ελάχιστες πληρωμές και τόκοι καρτών.",
`A credit card lets you borrow up to a limit. Used well, it is convenient; used badly, it is one of the most expensive forms of credit.

### Key terms
- **Statement balance**: what you owe at the statement date.
- **Minimum payment**: the least you must pay to avoid a late fee — paying only this keeps you in debt for years.
- **Interest-free period**: if you clear the full balance by the due date, you usually pay no interest on purchases.
- **Cash withdrawals** usually charge interest from day one, plus a fee.

### Good habits
Set up an automatic full-balance payment, keep the limit no higher than you need, and treat the card as a payment tool, not extra income.`),
      L("interest-rates-and-apr", "Interest rates and APR", "Επιτόκια και ΣΕΠΕ", "Nominal rate vs APR, fixed vs variable — and why it matters.", "Ονομαστικό επιτόκιο και ΣΕΠΕ, σταθερό και κυμαινόμενο.",
`The **interest rate** is the price of borrowing. The **APR** — in Greek *ΣΕΠΕ, Συνολικό Ετήσιο Πραγματικό Επιτόκιο* — adds most compulsory fees, so it is the better figure for comparing offers.

### Fixed or variable
- **Fixed**: the payment stays the same; you are protected if rates rise.
- **Variable**: usually linked to Euribor or the bank's base rate plus a margin. Payments fall when rates fall and rise when they rise.

### Small differences, big totals
On a long loan, one percentage point makes a large difference to the total repaid. Try it in the loan calculator below: change the rate by 1% and compare the total interest.`, 6, { calculator: "loan" }),
      L("loan-repayment-calculations", "Loan repayment calculations", "Υπολογισμός δόσεων δανείου", "How the monthly payment is worked out, and how term changes the total.", "Πώς υπολογίζεται η μηνιαία δόση και πώς η διάρκεια επηρεάζει το σύνολο.",
`Most loans use an **annuity** formula: the payment stays the same, but the split changes over time. Early payments are mostly interest; later payments are mostly capital.

**M = P · r / (1 − (1 + r)^−n)**, where P is the amount borrowed, r is the monthly rate and n is the number of months.

### Longer term: lower payment, higher total
A €150,000 loan at 4% costs about €792 a month over 25 years, but about €1,110 over 15 years. The longer loan costs tens of thousands more in interest overall.

Experiment with the calculator below. It assumes a fixed rate and excludes fees and insurance.`, 7, { calculator: "loan" }),
      L("understanding-credit-reports", "Understanding credit reports", "Κατανοώντας τις πιστωτικές εκθέσεις", "What lenders may see about your repayment history, in general terms.", "Τι μπορεί να βλέπουν οι δανειστές για το ιστορικό αποπληρωμών σας.",
`A **credit report** is a record of how you have used and repaid credit. Lenders use it, together with your income and other debts, to decide whether to lend to you and on what terms.

### What a report generally contains
- Identification details.
- Existing loans and cards, with their limits and balances.
- Repayment history, including arrears.
- Some public records, where the law allows.

### Your rights
Under the GDPR you have the right to see personal data held about you and to ask for mistakes to be corrected. Ask the lender which credit bureau or database it used, then contact them.

*This lesson describes general practice only. Check current Cyprus arrangements with the Central Bank of Cyprus or the lender. BusinessHub reviews this text before it is published.*`),
      L("responsible-borrowing", "Responsible borrowing", "Υπεύθυνος δανεισμός", "A checklist before taking on any new debt.", "Λίστα ελέγχου πριν αναλάβετε νέο χρέος.",
`Before borrowing, ask yourself:

1. **Do I need it now?** Could I save for it instead?
2. **Can I afford the payment if my income drops or rates rise?** A common guide is to keep total debt payments well under a third of take-home pay.
3. **Have I compared at least two offers using the APR?**
4. **Do I understand every fee and condition?**
5. **What happens if I pay late?**

### Guarantees
Being a guarantor (εγγυητής) for someone else's loan makes **you** responsible if they don't pay. Only agree if you could repay the full amount yourself.`),
      L("over-indebtedness-warning-signs", "Over-indebtedness and warning signs", "Υπερχρέωση και προειδοποιητικά σημάδια", "How to recognise debt problems early and where to get help.", "Πώς να αναγνωρίσετε έγκαιρα προβλήματα χρέους και πού να ζητήσετε βοήθεια.",
`Debt problems usually build slowly. Common warning signs:

- Paying only the minimum on cards month after month.
- Using one loan or card to repay another.
- Missing or delaying bills.
- Not opening letters from lenders.
- Using credit for groceries and other essentials.

### What to do
1. List every debt with its balance, rate and payment.
2. Contact lenders **early**. Banks in Cyprus have arrears procedures and are expected to look at restructuring before taking legal steps.
3. Pay the most expensive debt (highest APR) first, while keeping up minimum payments on the others.
4. Get independent advice. The Financial Ombudsman of Cyprus handles complaints about financial institutions.`),
    ],
  },
  {
    slug: "digital-financial-literacy", code: "C", level: "beginner",
    title_en: "Digital Financial Literacy", title_el: "Ψηφιακός Χρηματοοικονομικός Αλφαβητισμός",
    summary_en: "Bank and pay online with confidence, and recognise the scams that target Cyprus consumers.",
    summary_el: "Ασφαλείς ψηφιακές συναλλαγές και αναγνώριση απατών.",
    audience_en: "Consumers and digital banking users", audience_el: "Καταναλωτές και χρήστες ψηφιακής τραπεζικής",
    objectives_en: ["Use online banking and payments safely", "Recognise phishing and social engineering", "Protect your digital identity", "Spot fraudulent investment offers"],
    lessons: [
      L("digital-banking-fundamentals", "Digital banking fundamentals", "Βασικές αρχές ψηφιακής τραπεζικής", "What online and mobile banking can do, and the basic safety settings.", "Τι προσφέρει η ψηφιακή τραπεζική και οι βασικές ρυθμίσεις ασφαλείας.",
`Mobile and online banking let you check balances, pay bills, transfer money and manage cards at any hour.

### Basic safety settings
- Turn on **strong customer authentication** — a one-time code or app approval for payments.
- Use the bank's **official app**, from the official app store.
- Set **notifications** for every card payment and transfer.
- Lock your phone with a PIN or biometrics.

Your bank will **never** ask for your full password, PIN or a one-time code by phone, SMS or email.`),
      L("online-payments", "Online payments", "Ηλεκτρονικές πληρωμές", "Cards, transfers, instant payments and wallets — and how each protects you.", "Κάρτες, μεταφορές, άμεσες πληρωμές και ψηφιακά πορτοφόλια.",
`### Common ways to pay
- **Card**: card payments can often be disputed ("chargeback") if goods never arrive.
- **Bank transfer (SEPA)**: once sent, it is hard to reverse. Only send transfers to people and firms you have checked.
- **Instant payments**: arrive within seconds and are just as hard to recall.
- **Mobile wallets**: replace your card number with a token, which adds protection.

### Before paying a new seller
Check reviews, contact details and the return policy. Be wary of anyone asking for a transfer instead of a card payment.`),
      L("card-security", "Card security", "Ασφάλεια καρτών", "Protecting your card and what to do if it is lost or misused.", "Προστασία της κάρτας και τι να κάνετε σε περίπτωση απώλειας.",
`- Never share your PIN, or the three-digit security code with anyone who calls you.
- Cover the keypad at ATMs and payment terminals.
- Use your banking app to freeze the card, block online use or set limits.
- Check your statements every week.

### If something goes wrong
**Freeze or cancel the card at once** in the app or through your bank's 24-hour line, then report the unauthorised payments. Under EU payment rules, you are generally refunded for payments you did not authorise, unless you acted with gross negligence — so report quickly.`),
      L("financial-scams", "Financial scams", "Οικονομικές απάτες", "The most common scam patterns and the pressure tactics behind them.", "Οι πιο συνηθισμένες απάτες και οι τακτικές πίεσης.",
`Scams change their story but follow the same pattern: **urgency, secrecy and an unusual way to pay**.

### Common types
- **Impersonation**: someone claims to be your bank, the police, a courier or a government department.
- **Purchase scams**: goods that never arrive.
- **Romance scams**: a new online contact eventually asks for money.
- **"Hi Mum/Dad" messages** from a new number asking for urgent help.

### The rule
Stop. Hang up. Call back on a number **you** find yourself, such as the one on the back of your card. A genuine organisation will understand.`),
      L("phishing-and-social-engineering", "Phishing and social engineering", "Phishing και κοινωνική μηχανική", "How fake messages trick people, and how to check before you click.", "Πώς σας εξαπατούν τα ψεύτικα μηνύματα και πώς να ελέγξετε.",
`**Phishing** messages — by email, SMS ("smishing") or phone ("vishing") — try to make you click a link, open a file or give away codes.

### Signs to look for
- A sender address or link that is *nearly* right.
- Threats ("your account will be closed today").
- Requests for passwords, card details or one-time codes.
- Unexpected parcel or tax-refund messages.

### Protect yourself
Don't click links in unexpected messages; type the address yourself or use the official app. Report suspicious messages to your bank and to the Cyprus Police cybercrime unit.`),
      L("digital-identity-protection", "Digital identity protection", "Προστασία ψηφιακής ταυτότητας", "Passwords, two-factor login and limiting what you share.", "Κωδικοί, έλεγχος ταυτότητας δύο παραγόντων και ιδιωτικότητα.",
`Your digital identity is the set of details that prove who you are online: email accounts, ID numbers, passwords and devices.

- Use a **different strong password** for email and banking. A password manager helps.
- Turn on **two-factor authentication** wherever it is offered.
- Be careful sharing ID cards, passports or utility bills; criminals use them to open accounts in your name.
- Keep phones and computers updated.

If your email account is taken over, criminals can reset everything else — protect it first.`),
      L("safe-online-transactions", "Safe online financial transactions", "Ασφαλείς ηλεκτρονικές συναλλαγές", "A short checklist before every online payment.", "Μια σύντομη λίστα ελέγχου πριν από κάθε πληρωμή.",
`Before you confirm a payment, check:

1. Is the website address correct, and does it use a secure connection?
2. Is the one-time code you received for **this** payment and **this** amount?
3. Has the payee's IBAN changed unexpectedly? Call them on a known number to confirm — invoice fraud is common with businesses.
4. Avoid public Wi-Fi for banking, or use mobile data.
5. Keep receipts and confirmations.

If you have sent money to a scammer, contact your bank immediately. The sooner you act, the better the chance of getting it back.`),
      L("fraudulent-investment-schemes", "Recognising fraudulent investment schemes", "Αναγνώριση δόλιων επενδυτικών σχημάτων", "Guaranteed returns, unlicensed firms and how to check a firm's licence.", "Εγγυημένες αποδόσεις, μη αδειοδοτημένες εταιρείες και έλεγχος αδειών.",
`### Red flags
- "Guaranteed" high returns with no risk.
- Pressure to decide fast.
- Celebrity endorsements on social media.
- Payment in crypto, or to personal accounts.
- Trading "accounts" that show big profits but won't let you withdraw.

### Check before you invest
Investment firms serving Cyprus clients must be licensed — by CySEC or another EU regulator, using an EU passport. Check the firm's name **and** website on CySEC's register and its warnings list. BusinessHub's list of CySEC-licensed firms is built from the official register.

*Education only — not investment advice.*`, 7),
    ],
  },
  {
    slug: "savings-and-investment-fundamentals", code: "D", level: "intermediate",
    title_en: "Savings & Investment Fundamentals", title_el: "Βασικές Αρχές Αποταμίευσης & Επενδύσεων",
    summary_en: "The core ideas behind saving and investing: risk, return, compounding and diversification.",
    summary_el: "Οι βασικές έννοιες της αποταμίευσης και των επενδύσεων: κίνδυνος, απόδοση, ανατοκισμός, διασπορά.",
    audience_en: "Beginners and young professionals", audience_el: "Αρχάριοι και νέοι επαγγελματίες",
    objectives_en: ["Distinguish saving from investing", "Explain the link between risk and return", "Calculate compound growth", "Recognise investment fraud"],
    notice_en: "Education only. This programme does not give individual investment recommendations. Speak to a licensed adviser before investing.",
    notice_el: "Μόνο για εκπαιδευτικούς σκοπούς. Δεν αποτελεί επενδυτική συμβουλή.",
    lessons: [
      L("saving-versus-investing", "Saving versus investing", "Αποταμίευση ή επένδυση", "When to keep money safe, and when it can be put to work.", "Πότε να κρατάτε τα χρήματα ασφαλή και πότε να τα επενδύετε.",
`**Saving** keeps money safe and easy to reach — for emergencies and short-term goals. **Investing** puts money into assets such as shares, bonds or funds, aiming for growth over years, but the value can go down.

### A simple order
1. Clear expensive debt.
2. Build an emergency fund.
3. Invest only money you won't need for at least five years.

Bank deposits in Cyprus are protected up to €100,000 per depositor per bank by the deposit guarantee scheme. Investments are **not** covered by that guarantee.`, 6, { stat_codes: ["saving_rate"] }),
      L("risk-and-return", "Risk and return", "Κίνδυνος και απόδοση", "Why higher possible returns always come with higher risk.", "Γιατί υψηλότερη απόδοση σημαίνει πάντα υψηλότερο κίνδυνο.",
`**Return** is what an investment earns. **Risk** is how much, and how often, its value moves — including the chance of losing money.

- **Cash deposits**: low risk, low return.
- **Bonds**: lend to a government or company; medium risk.
- **Shares**: own part of a company; higher risk and higher long-term potential.

Your **time horizon** and how much loss you could live with should guide the mix. Anyone offering high returns with "no risk" is either wrong or dishonest.`),
      L("compound-interest", "Compound interest", "Ανατοκισμός", "How earning returns on past returns builds wealth over time.", "Πώς οι αποδόσεις πάνω σε αποδόσεις χτίζουν πλούτο.",
`**Compound interest** means you earn interest on your interest. €1,000 at 5% a year becomes €1,050 after one year, €1,102.50 after two, and about €2,653 after twenty — without adding anything.

### Time matters most
Starting ten years earlier can matter more than saving larger amounts later. Compounding also works against you on debt: unpaid card interest compounds too.

In the OECD 2023 survey of adults in Cyprus, only about a third answered the compound-interest question correctly. Try the calculator below to see the effect for yourself.`, 7, { calculator: "compound" }),
      L("investment-diversification", "Investment diversification", "Διασπορά επενδύσεων", "Not putting all your eggs in one basket.", "Μην βάζετε όλα τα αυγά στο ίδιο καλάθι.",
`**Diversification** means spreading money across many investments, so that a fall in one does not sink the whole portfolio.

- **Across assets**: shares, bonds and cash.
- **Within assets**: many companies, sectors and countries.
- **Over time**: investing regular amounts rather than everything at once.

Broad index funds offer wide diversification at low cost. Watch the fees: a 1.5% annual charge takes a large share of long-term returns compared with 0.2%.`),
      L("inflation-and-purchasing-power", "Inflation and purchasing power", "Πληθωρισμός και αγοραστική δύναμη", "Real returns: what your money earns after prices rise.", "Πραγματικές αποδόσεις μετά την άνοδο των τιμών.",
`The **real return** is roughly the return minus inflation. A deposit paying 2% while prices rise 3% loses about 1% of buying power each year.

That is why long-term savings kept only in cash tend to lose value, and why investors look at returns *after* inflation.

The official Cyprus and EU inflation figures below come from Eurostat. Use the inflation calculator to see what €1,000 is worth in real terms after ten years.`, 6, { calculator: "inflation", stat_codes: ["hicp_all", "price_level"] }),
      L("investment-fraud", "Investment fraud", "Επενδυτική απάτη", "Ponzi schemes, fake brokers and recovery-room scams.", "Σχήματα Ponzi, ψεύτικοι μεσίτες και απάτες «ανάκτησης».",
`- **Ponzi schemes** pay early investors with newer investors' money until they collapse.
- **Fake online brokers** show invented profits and block withdrawals.
- **Recovery-room scams** target past victims, promising to recover their losses for a fee.

Always check a firm's licence on the CySEC register and warnings list, and on the register of the firm's home EU regulator. Report suspected fraud to CySEC and the police.

*Education only — not investment advice.*`),
      L("long-term-financial-planning", "Long-term financial planning", "Μακροπρόθεσμος οικονομικός σχεδιασμός", "Retirement, pensions and planning across life stages.", "Σύνταξη και σχεδιασμός σε κάθε στάδιο της ζωής.",
`Long-term planning connects today's choices with goals decades away.

- **Pensions**: in Cyprus, most workers pay into Social Insurance, and many employers also run provident or occupational pension funds. Check what you are entitled to.
- **Life stages**: a first job is about building habits and an emergency fund; the middle years about housing, family and growing savings; the years before retirement about lowering risk.
- **Review yearly**, and after big life events.

Small regular contributions started early, together with compounding, usually do more than large late efforts.`, 6, { calculator: "goal" }),
    ],
  },
  {
    slug: "financial-literacy-for-entrepreneurs", code: "E", level: "advanced",
    title_en: "Financial Literacy for Entrepreneurs", title_el: "Χρηματοοικονομικός Αλφαβητισμός για Επιχειρηματίες",
    summary_en: "Cash flow, working capital, credit control and resilience for SMEs, freelancers and business owners.",
    summary_el: "Ταμειακές ροές, κεφάλαιο κίνησης, πιστωτικός έλεγχος και ανθεκτικότητα για ΜμΕ και ελεύθερους επαγγελματίες.",
    audience_en: "SMEs, freelancers and business owners", audience_el: "ΜμΕ, ελεύθεροι επαγγελματίες και ιδιοκτήτες επιχειρήσεων",
    objectives_en: ["Forecast cash flow", "Manage working capital and payment terms", "Control customer credit and overdue invoices", "Plan borrowing and build resilience"],
    lessons: [
      L("business-cash-flow", "Business cash flow", "Ταμειακές ροές επιχείρησης", "Profit is not cash: why profitable firms still run out of money.", "Το κέρδος δεν είναι μετρητά.",
`A business can be profitable on paper and still run out of cash, because customers pay later than suppliers, salaries and VAT fall due.

### A 13-week cash forecast
List expected receipts and payments week by week for the next quarter. It shows gaps early, while there is still time to act.

### Levers
- Invoice promptly and accurately.
- Ask for deposits on large orders.
- Agree payment dates with suppliers that match when your customers pay.
- Keep a cash buffer for VAT and social insurance payments.`, 7),
      L("working-capital", "Working capital", "Κεφάλαιο κίνησης", "Receivables, stock and payables — the cash tied up in daily trading.", "Απαιτήσεις, αποθέματα και υποχρεώσεις.",
`**Working capital** = current assets (cash, receivables, stock) − current liabilities (payables, short-term debt).

The **cash conversion cycle** measures how many days pass between paying suppliers and receiving cash from customers:

**Days stock + days receivables − days payables**

Shortening it releases cash. Ways to do that: hold less slow-moving stock, collect faster, and agree fair terms with suppliers. Growth often *uses up* working capital — plan the financing before taking on big new contracts.`),
      L("credit-management", "Credit management", "Διαχείριση πιστώσεων", "Deciding who to give credit to, and how much.", "Σε ποιον να δίνετε πίστωση και πόση.",
`Selling on credit is lending money to your customer. Manage it like a lender would:

1. **Check new customers**: company registry status, published accounts, payment history and credit reports from a licensed bureau.
2. **Set credit limits** and review them regularly.
3. **Put terms in writing** on quotes, contracts and invoices.
4. **Watch for warning signs**: slower payments, part payments, frequent disputes.

Business information on Cyprus companies is available from the Registrar of Companies and commercial credit-information providers.`),
      L("payment-terms", "Payment terms", "Όροι πληρωμής", "Setting clear terms and the EU late-payment rules.", "Σαφείς όροι και οι ευρωπαϊκοί κανόνες για καθυστερήσεις πληρωμών.",
`Clear payment terms reduce disputes and late payments.

- State the due date ("payable within 30 days of invoice date"), bank details and your company details on every invoice.
- Consider early-payment discounts, or deposits on large orders.
- EU late-payment rules, which Cyprus has adopted into law, generally limit business-to-business terms to 60 days unless otherwise agreed and not grossly unfair, and 30 days for public authorities. They also allow statutory interest and a minimum €40 recovery charge on late invoices.

*General information only — check the current law or get legal advice for specific cases.*`),
      L("financial-planning-for-business", "Financial planning", "Οικονομικός σχεδιασμός", "Budgets, forecasts and the few numbers that matter most.", "Προϋπολογισμοί, προβλέψεις και οι βασικοί δείκτες.",
`A simple annual plan includes:
- **Sales forecast** — by product or customer group.
- **Cost budget** — fixed and variable costs.
- **Profit and loss forecast.**
- **Cash-flow forecast.**

### Key numbers to track every month
- Gross margin %
- Break-even sales level
- Debtor days and creditor days
- Cash runway (months of costs covered by cash)

Compare actual results with the plan every month, and update the forecast when conditions change.`),
      L("business-borrowing", "Business borrowing", "Επιχειρηματικός δανεισμός", "Overdrafts, term loans, leasing and grants — matching finance to need.", "Παρατραβήγματα, δάνεια, χρηματοδοτική μίσθωση και επιχορηγήσεις.",
`**Match the finance to its purpose**: short-term needs with short-term finance, and long-term assets with long-term loans.

- **Overdraft or revolving credit**: flexible working capital.
- **Term loan**: equipment, premises, expansion.
- **Leasing**: vehicles and machinery.
- **Invoice finance or factoring**: cash against unpaid invoices.
- **Grants and guaranteed schemes**: Cyprus and EU programmes, for example those offered through national development and recovery schemes. Check the eligibility rules carefully.

Lenders will look at your accounts, cash-flow forecast, existing debt and any security on offer. Prepare them before you apply.`),
      L("managing-overdue-receivables", "Managing overdue receivables", "Διαχείριση ληξιπρόθεσμων απαιτήσεων", "A step-by-step collections process.", "Μια διαδικασία βήμα προς βήμα για την είσπραξη.",
`A consistent process gets you paid sooner:

1. **Before the due date**: send a friendly reminder.
2. **Day 1–7 overdue**: email and phone call.
3. **Day 15–30 overdue**: a formal letter mentioning statutory interest.
4. **Day 30–60 overdue**: stop further credit and agree a payment plan in writing.
5. **Beyond that**: a final demand, then a debt-collection agency or legal action.

Keep records of every contact. The longer a debt goes unpaid, the less likely it is to be recovered in full.`),
      L("business-financial-resilience", "Business financial resilience", "Οικονομική ανθεκτικότητα επιχείρησης", "Buffers, stress tests and continuity planning.", "Αποθέματα, προσομοιώσεις ακραίων σεναρίων και σχέδια συνέχειας.",
`A resilient business can absorb a shock — losing a major customer, a rise in rates, a supply disruption — without collapsing.

- Keep a **cash reserve** of at least 2–3 months of fixed costs.
- **Avoid depending on one customer**: watch the share of sales from your top client.
- **Stress-test your plans**: what if sales fell 20%, or interest rose 2 points?
- Hold **insurance** that matches your real risks.
- Prepare a **continuity plan** for IT, staff and key suppliers.

Review these once a year, together with your accountant.`),
    ],
  },
];
