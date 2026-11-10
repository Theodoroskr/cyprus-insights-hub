/** Plain-language "what this means" notes for Financial Literacy figures (English / Greek). */
type E = { en: string; el: string };

export const STAT_EXPLAIN: Record<string, E> = {
  disposable_income: { en: "Money households have left to spend or save after taxes and social contributions, adjusted for price differences between countries.", el: "Τα χρήματα που μένουν στα νοικοκυριά για κατανάλωση ή αποταμίευση μετά από φόρους και εισφορές, προσαρμοσμένα στις διαφορές τιμών μεταξύ χωρών." },
  saving_rate: { en: "The share of disposable income households put aside instead of spending. A higher rate means a bigger cushion for emergencies.", el: "Το ποσοστό του διαθέσιμου εισοδήματος που αποταμιεύουν τα νοικοκυριά. Υψηλότερο ποσοστό σημαίνει μεγαλύτερο μαξιλάρι για έκτακτες ανάγκες." },
  net_earnings: { en: "Typical yearly take-home pay of a single full-time worker after tax.", el: "Τυπικές ετήσιες καθαρές αποδοχές ενός εργαζόμενου πλήρους απασχόλησης μετά τους φόρους." },
  unexpected_expenses: { en: "People who could not pay an unexpected bill (about one month's poverty-line income) from their own resources. Lower is better.", el: "Άτομα που δεν μπορούν να καλύψουν ένα απρόβλεπτο έξοδο από δικούς τους πόρους. Χαμηλότερο είναι καλύτερο." },
  poverty_rate: { en: "People living on less than 60% of the national median income.", el: "Άτομα με εισόδημα κάτω από το 60% του εθνικού διάμεσου εισοδήματος." },
  arope_rate: { en: "People at risk of poverty, severely deprived, or in households with very low work. Lower is better.", el: "Άτομα σε κίνδυνο φτώχειας, σοβαρής στέρησης ή σε νοικοκυριά με πολύ χαμηλή απασχόληση. Χαμηλότερο είναι καλύτερο." },
  hicp_all: { en: "How much prices rose compared with the same month a year earlier. Around 2% is the ECB's target.", el: "Πόσο αυξήθηκαν οι τιμές σε σχέση με τον ίδιο μήνα πέρσι. Στόχος της ΕΚΤ είναι περίπου 2%." },
  hicp_food: { en: "Yearly price change for food and non-alcoholic drinks, the biggest everyday cost for most families.", el: "Ετήσια μεταβολή τιμών τροφίμων και μη αλκοολούχων ποτών, το μεγαλύτερο καθημερινό κόστος για τις περισσότερες οικογένειες." },
  price_level: { en: "How expensive Cyprus is compared with the EU average (100). Above 100 means pricier.", el: "Πόσο ακριβή είναι η Κύπρος σε σύγκριση με τον μέσο όρο της ΕΕ (100). Πάνω από 100 σημαίνει ακριβότερη." },
  household_consumption: { en: "Real change in what households spend, a sign of consumer confidence.", el: "Πραγματική μεταβολή της κατανάλωσης των νοικοκυριών, ένδειξη καταναλωτικής εμπιστοσύνης." },
  cbc_hh_loans: { en: "Total money households owe to banks in Cyprus.", el: "Το συνολικό χρέος των νοικοκυριών προς τις τράπεζες στην Κύπρο." },
  cbc_hh_housing_loans: { en: "Outstanding mortgages and other home loans.", el: "Ανεξόφλητα στεγαστικά δάνεια." },
  cbc_hh_consumer_loans: { en: "Outstanding personal and consumer loans, such as car loans.", el: "Ανεξόφλητα προσωπικά και καταναλωτικά δάνεια, π.χ. για αυτοκίνητο." },
  cbc_hh_deposits: { en: "Money households keep in bank accounts in Cyprus.", el: "Τα χρήματα που διατηρούν τα νοικοκυριά σε τραπεζικούς λογαριασμούς στην Κύπρο." },
  cbc_rate_mortgage: { en: "Average interest rate on new home loans this month. Compare it with the euro area to see if borrowing here is cheaper.", el: "Μέσο επιτόκιο νέων στεγαστικών δανείων τον μήνα αυτό. Συγκρίνετε με την ευρωζώνη." },
  cbc_rate_consumer: { en: "Average interest rate on new consumer loans. Usually much higher than mortgages.", el: "Μέσο επιτόκιο νέων καταναλωτικών δανείων. Συνήθως πολύ υψηλότερο από τα στεγαστικά." },
  cbc_rate_deposit: { en: "Average interest banks pay on new household deposits. If below inflation, savings lose value.", el: "Μέσος τόκος που πληρώνουν οι τράπεζες σε νέες καταθέσεις. Αν είναι κάτω από τον πληθωρισμό, οι αποταμιεύσεις χάνουν αξία." },
};

const SCORE_EXPLAIN: [RegExp, E][] = [
  [/overall/i, { en: "Knowledge, behaviour and attitudes combined into one score out of 100. The OECD considers 70 or more a good level.", el: "Γνώσεις, συμπεριφορά και στάσεις σε μία βαθμολογία στα 100. Ο ΟΟΣΑ θεωρεί καλό επίπεδο το 70 και πάνω." }],
  [/target/i, { en: "The share of adults who scored 70 or more out of 100, the OECD's minimum target.", el: "Το ποσοστό των ενηλίκων με βαθμολογία 70 και άνω, τον ελάχιστο στόχο του ΟΟΣΑ." }],
  [/compound/i, { en: "Whether people understand that interest earns interest over time, key for saving and borrowing.", el: "Αν οι πολίτες κατανοούν ότι ο τόκος κερδίζει τόκο με τον χρόνο, κρίσιμο για αποταμίευση και δανεισμό." }],
  [/diversif/i, { en: "Whether people know that spreading money across investments lowers risk.", el: "Αν οι πολίτες γνωρίζουν ότι η διασπορά των επενδύσεων μειώνει τον κίνδυνο." }],
  [/digital/i, { en: "Safe use of online banking and payments: spotting scams, protecting passwords and checking online offers.", el: "Ασφαλής χρήση ψηφιακών τραπεζικών υπηρεσιών και πληρωμών: αναγνώριση απατών, προστασία κωδικών, έλεγχος προσφορών." }],
  [/knowledge/i, { en: "Answers to questions on interest, inflation and risk.", el: "Απαντήσεις σε ερωτήσεις για τόκους, πληθωρισμό και κίνδυνο." }],
  [/behaviour/i, { en: "Everyday habits: budgeting, saving actively, paying bills on time and comparing products.", el: "Καθημερινές συνήθειες: προϋπολογισμός, αποταμίευση, έγκαιρη πληρωμή λογαριασμών, σύγκριση προϊόντων." }],
  [/attitude/i, { en: "Whether people prefer to save for the future rather than spend today.", el: "Αν οι πολίτες προτιμούν να αποταμιεύουν για το μέλλον αντί να ξοδεύουν σήμερα." }],
];

export function scoreExplain(indicator: string, lang: "en" | "el"): string | null {
  const hit = SCORE_EXPLAIN.find(([r]) => r.test(indicator));
  return hit ? hit[1][lang] : null;
}
export function statExplain(code: string, lang: "en" | "el"): string | null {
  return STAT_EXPLAIN[code]?.[lang] ?? null;
}
