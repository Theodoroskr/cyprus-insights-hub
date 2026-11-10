import type { Lang } from "@/lib/academy";
import { useAcademyLang } from "@/lib/academy";

/** Greek text for the Financial Literacy pages, keyed by the English text. Missing keys fall back to English. */
export const EL: Record<string, string> = {
  // Layout & shared
  "Loading…": "Φόρτωση…",
  "Data not available": "Δεν υπάρχουν διαθέσιμα στοιχεία",
  "Data not available yet.": "Δεν υπάρχουν ακόμη διαθέσιμα στοιχεία.",
  "Data not available for this period.": "Δεν υπάρχουν στοιχεία για αυτή την περίοδο.",
  "Explore the figures": "Εξερευνήστε τα στοιχεία",
  "Unit": "Μονάδα", "Source": "Πηγή", "latest period": "τελευταία περίοδος", "last updated": "τελευταία ενημέρωση",
  "Gaps mean no figure has been published; nothing is estimated.": "Τα κενά σημαίνουν ότι δεν έχει δημοσιευθεί στοιχείο· τίποτα δεν εκτιμάται.",
  "From": "Από",
  "Cyprus": "Κύπρος", "EU-27": "ΕΕ-27", "Euro area": "Ευρωζώνη",
  // Module blurbs
  "Headline figures and a guide to every section.": "Βασικά στοιχεία και οδηγός για κάθε ενότητα.",
  "OECD and Central Bank survey results for Cyprus.": "Αποτελέσματα ερευνών ΟΟΣΑ και Κεντρικής Τράπεζας για την Κύπρο.",
  "Income, savings and financial strain, Cyprus vs EU.": "Εισόδημα, αποταμίευση και οικονομική πίεση, Κύπρος έναντι ΕΕ.",
  "Inflation, food prices and price levels.": "Πληθωρισμός, τιμές τροφίμων και επίπεδα τιμών.",
  "Borrowing costs, repayments and responsible credit.": "Κόστος δανεισμού, αποπληρωμές και υπεύθυνη πίστωση.",
  "Free short lessons in English and Greek.": "Δωρεάν σύντομα μαθήματα στα ελληνικά και αγγλικά.",
  "Six private calculators that run in your browser.": "Έξι ιδιωτικοί υπολογιστές που λειτουργούν στον browser σας.",
  "The reports behind the figures.": "Οι εκθέσεις πίσω από τα στοιχεία.",
  "Public awareness campaigns, coming soon.": "Εκστρατείες ενημέρωσης του κοινού, σύντομα.",
  "Where each figure comes from and how it is updated.": "Από πού προέρχεται κάθε στοιχείο και πώς ενημερώνεται.",
  // Units
  "% vs same month last year": "% σε σχέση με τον ίδιο μήνα πέρσι", "PPS per person": "ΜΑΔ ανά άτομο", "% real change": "% πραγματική μεταβολή",
  "€ per year": "€ ανά έτος", "% of population": "% του πληθυσμού", "Index, EU27 = 100": "Δείκτης, ΕΕ27 = 100",
  "% of disposable income": "% του διαθέσιμου εισοδήματος", "€ million": "€ εκατ.", "% a year": "% ετησίως",
  "score out of 35": "βαθμολογία στα 35", "score out of 20": "βαθμολογία στα 20", "score out of 100": "βαθμολογία στα 100",
  "score out of 7": "βαθμολογία στα 7", "% of adults": "% των ενηλίκων", "score out of 45": "βαθμολογία στα 45",
  // Survey
  "Overall financial literacy score": "Συνολική βαθμολογία χρηματοοικονομικού αλφαβητισμού",
  "Financial knowledge": "Χρηματοοικονομικές γνώσεις", "Financial behaviour": "Χρηματοοικονομική συμπεριφορά",
  "Financial attitudes": "Χρηματοοικονομικές στάσεις", "Digital financial literacy": "Ψηφιακός χρηματοοικονομικός αλφαβητισμός",
  "Adults reaching the target score (70+)": "Ενήλικες που φτάνουν τη βαθμολογία-στόχο (70+)",
  "Answered the compound-interest question correctly": "Απάντησαν σωστά στην ερώτηση για τον ανατοκισμό",
  "Answered the risk-diversification question correctly": "Απάντησαν σωστά στην ερώτηση για τη διασπορά κινδύνου",
  "Reached the digital financial literacy target": "Έφτασαν τον στόχο ψηφιακού χρηματοοικονομικού αλφαβητισμού",
  "Financial knowledge score": "Βαθμολογία χρηματοοικονομικών γνώσεων",
  "Financial literacy in Cyprus (Business & Finance Policy Paper 79)": "Χρηματοοικονομικός αλφαβητισμός στην Κύπρο (Έγγραφο Πολιτικής 79)",
  "Working Paper 2024-2": "Έγγραφο Εργασίας 2024-2",
  "OECD": "ΟΟΣΑ", "Central Bank of Cyprus": "Κεντρική Τράπεζα της Κύπρου",
  "High income": "Υψηλό εισόδημα", "Middle income": "Μεσαίο εισόδημα", "Low income": "Χαμηλό εισόδημα",
  "60 and over": "60 και άνω", "Women": "Γυναίκες", "Men": "Άνδρες",
  "10% reach the target": "Το 10% φτάνει τον στόχο", "72% of the maximum": "72% του μέγιστου", "Adults aged 15–79": "Ενήλικες 15–79 ετών",
  "Ages 18–79, 1,000 adults. Different scale — not comparable with the OECD score": "Ηλικίες 18–79, 1.000 ενήλικες. Διαφορετική κλίμακα — δεν συγκρίνεται με τη βαθμολογία του ΟΟΣΑ",
  "Survey reference year": "Έτος αναφοράς έρευνας", "Published": "Δημοσίευση", "out of": "στα", "Dashed line": "Διακεκομμένη γραμμή", "OECD target": "Στόχος ΟΟΣΑ",
  "By gender": "Κατά φύλο", "By age": "Κατά ηλικία", "By income": "Κατά εισόδημα", "Score out of 100": "Βαθμολογία στα 100",
  // Overview
  "Financial Literacy in Cyprus — Survey Results, Household Finances & Free Lessons": "Χρηματοοικονομικός Αλφαβητισμός στην Κύπρο — Αποτελέσματα Ερευνών, Οικονομικά Νοικοκυριών & Δωρεάν Μαθήματα",
  "How financially literate are adults in Cyprus? OECD and Central Bank survey results, Eurostat household and price figures, free calculators and lessons.": "Πόσο χρηματοοικονομικά εγγράμματοι είναι οι ενήλικες στην Κύπρο; Αποτελέσματα ερευνών ΟΟΣΑ και Κεντρικής Τράπεζας, στοιχεία Eurostat για νοικοκυριά και τιμές, δωρεάν υπολογιστές και μαθήματα.",
  "What adults in Cyprus know about money, the household finances behind it, and free tools to learn more. Every figure shows its publisher and year.": "Τι γνωρίζουν οι ενήλικες στην Κύπρο για τα χρήματα, τα οικονομικά των νοικοκυριών και δωρεάν εργαλεία για να μάθετε περισσότερα. Κάθε στοιχείο δείχνει τον εκδότη και το έτος του.",
  // Observatory
  "Cyprus Financial Literacy Observatory — OECD & Central Bank Survey Results": "Παρατηρητήριο Χρηματοοικονομικού Αλφαβητισμού Κύπρου — Αποτελέσματα Ερευνών ΟΟΣΑ & Κεντρικής Τράπεζας",
  "How financially literate are adults in Cyprus? OECD/INFE 2023 and Central Bank of Cyprus 2018 survey scores for knowledge, behaviour and attitudes.": "Πόσο χρηματοοικονομικά εγγράμματοι είναι οι ενήλικες στην Κύπρο; Βαθμολογίες ερευνών ΟΟΣΑ/INFE 2023 και Κεντρικής Τράπεζας της Κύπρου 2018 για γνώσεις, συμπεριφορά και στάσεις.",
  "Survey results on what adults in Cyprus know about money and how they manage it. Each figure shows its publisher, survey year and page reference.": "Αποτελέσματα ερευνών για το τι γνωρίζουν οι ενήλικες στην Κύπρο για τα χρήματα και πώς τα διαχειρίζονται. Κάθε στοιχείο δείχνει τον εκδότη, το έτος της έρευνας και τη σελίδα αναφοράς.",
  "A · Financial literacy survey results": "Α · Αποτελέσματα ερευνών χρηματοοικονομικού αλφαβητισμού",
  "The OECD (2023) and Central Bank of Cyprus (2018) surveys use different questions and scales, so their scores cannot be compared with each other.": "Οι έρευνες του ΟΟΣΑ (2023) και της Κεντρικής Τράπεζας της Κύπρου (2018) χρησιμοποιούν διαφορετικές ερωτήσεις και κλίμακες, γι' αυτό οι βαθμολογίες τους δεν συγκρίνονται μεταξύ τους.",
  "B · Household banking statistics": "Β · Τραπεζικά στατιστικά νοικοκυριών",
  "Monthly figures compiled by the Central Bank of Cyprus and published through the ECB Data Portal. Interest rates are compared with the euro area; loan and deposit totals are Cyprus only.": "Μηνιαία στοιχεία που καταρτίζει η Κεντρική Τράπεζα της Κύπρου και δημοσιεύονται μέσω της Πύλης Δεδομένων της ΕΚΤ. Τα επιτόκια συγκρίνονται με την ευρωζώνη· τα σύνολα δανείων και καταθέσεων αφορούν μόνο την Κύπρο.",
  "Household debt-to-income ratio · Not yet available": "Λόγος χρέους προς εισόδημα νοικοκυριών · Δεν είναι ακόμη διαθέσιμος",
  "No verified monthly official series has been confirmed yet, so no figure is shown. It will be added once an official source is checked.": "Δεν έχει επιβεβαιωθεί ακόμη επίσημη μηνιαία σειρά, γι' αυτό δεν εμφανίζεται στοιχείο. Θα προστεθεί μόλις ελεγχθεί επίσημη πηγή.",
  "C · Cyprus financial conditions": "Γ · Οικονομικές συνθήκες στην Κύπρο",
  "Charts and history:": "Γραφήματα και ιστορικό:", "Household Financial Health": "Οικονομική Κατάσταση Νοικοκυριών", "Cost of Living": "Κόστος Διαβίωσης", "Economy": "Οικονομία",
  // Household / cost
  "Household Financial Health in Cyprus — Income, Saving & Poverty vs EU": "Οικονομική Κατάσταση Νοικοκυριών στην Κύπρο — Εισόδημα, Αποταμίευση & Φτώχεια έναντι ΕΕ",
  "Official Eurostat figures for Cyprus households: disposable income, saving rate, earnings, unexpected expenses and poverty, compared with the EU.": "Επίσημα στοιχεία Eurostat για τα νοικοκυριά της Κύπρου: διαθέσιμο εισόδημα, ποσοστό αποταμίευσης, αποδοχές, απρόβλεπτα έξοδα και φτώχεια, σε σύγκριση με την ΕΕ.",
  "Official Eurostat figures on household income, saving and financial strain in Cyprus, compared with the EU. Updated automatically when Eurostat publishes.": "Επίσημα στοιχεία Eurostat για το εισόδημα, την αποταμίευση και την οικονομική πίεση των νοικοκυριών στην Κύπρο, σε σύγκριση με την ΕΕ. Ενημερώνονται αυτόματα όταν δημοσιεύει η Eurostat.",
  "Cost of Living in Cyprus — Inflation, Food Prices & Price Levels": "Κόστος Διαβίωσης στην Κύπρο — Πληθωρισμός, Τιμές Τροφίμων & Επίπεδα Τιμών",
  "Eurostat figures for Cyprus: overall and food inflation (HICP), price levels and household consumption, compared with the EU.": "Στοιχεία Eurostat για την Κύπρο: συνολικός πληθωρισμός και πληθωρισμός τροφίμων (ΕνΔΤΚ), επίπεδα τιμών και κατανάλωση νοικοκυριών, σε σύγκριση με την ΕΕ.",
  "How prices in Cyprus are changing, from official Eurostat figures. National CPI, GDP and unemployment from CYSTAT are on the Economy page.": "Πώς αλλάζουν οι τιμές στην Κύπρο, με βάση επίσημα στοιχεία της Eurostat. Ο εθνικός ΔΤΚ, το ΑΕΠ και η ανεργία από τη ΣΤΑΤΥΣ βρίσκονται στη σελίδα Οικονομία.",
  "More official figures:": "Περισσότερα επίσημα στοιχεία:", "Cyprus Economic Indicators": "Οικονομικοί Δείκτες Κύπρου",
  // Credit
  "Credit & Borrowing in Cyprus — Loan Costs and Responsible Borrowing": "Πίστωση & Δανεισμός στην Κύπρο — Κόστος Δανείων και Υπεύθυνος Δανεισμός",
  "Understand what borrowing really costs: loan repayment calculator, APR explained, and free lessons on credit and debt for people in Cyprus.": "Κατανοήστε το πραγματικό κόστος του δανεισμού: υπολογιστής αποπληρωμής δανείου, επεξήγηση του ΣΕΠΕ και δωρεάν μαθήματα για πίστωση και χρέος.",
  "What borrowing really costs and how to borrow responsibly. Use the loan calculator, then follow the free credit lessons in the Academy.": "Πόσο κοστίζει πραγματικά ο δανεισμός και πώς να δανείζεστε υπεύθυνα. Χρησιμοποιήστε τον υπολογιστή δανείου και μετά τα δωρεάν μαθήματα πίστωσης στην Ακαδημία.",
  "Household borrowing in Cyprus": "Δανεισμός νοικοκυριών στην Κύπρο",
  "Learn: Credit & Responsible Borrowing": "Μάθετε: Πίστωση & Υπεύθυνος Δανεισμός",
  "Short lessons on APR, credit reports, overdrafts, buy-now-pay-later and managing debt.": "Σύντομα μαθήματα για ΣΕΠΕ, πιστωτικές εκθέσεις, υπεραναλήψεις, «αγόρασε τώρα, πλήρωσε αργότερα» και διαχείριση χρέους.",
  "Open the programme": "Άνοιγμα προγράμματος", "About these figures": "Σχετικά με τα στοιχεία",
  "Monthly Central Bank of Cyprus statistics via the ECB Data Portal, updated on the 5th of each month. Rates are for new loans; totals are outstanding balances at month end.": "Μηνιαία στατιστικά της Κεντρικής Τράπεζας της Κύπρου μέσω της Πύλης Δεδομένων της ΕΚΤ, που ενημερώνονται στις 5 κάθε μήνα. Τα επιτόκια αφορούν νέα δάνεια· τα σύνολα είναι υπόλοιπα στο τέλος του μήνα.",
  "All household banking figures": "Όλα τα τραπεζικά στοιχεία νοικοκυριών",
  // Calculators page
  "Free Financial Calculators — Budget, Savings, Loan, Inflation": "Δωρεάν Χρηματοοικονομικοί Υπολογιστές — Προϋπολογισμός, Αποταμίευση, Δάνειο, Πληθωρισμός",
  "Six free money calculators: 50/30/20 budget, savings goal, compound interest, loan repayment, inflation and emergency fund. Nothing you enter is saved.": "Έξι δωρεάν υπολογιστές: προϋπολογισμός 50/30/20, στόχος αποταμίευσης, ανατοκισμός, αποπληρωμή δανείου, πληθωρισμός και ταμείο έκτακτης ανάγκης. Τίποτα από όσα εισάγετε δεν αποθηκεύεται.",
  "Six calculators for everyday money decisions. Everything is worked out in your browser and nothing you type is saved.": "Έξι υπολογιστές για καθημερινές οικονομικές αποφάσεις. Όλα υπολογίζονται στον browser σας και τίποτα από όσα πληκτρολογείτε δεν αποθηκεύεται.",
  // Research
  "Financial Literacy Research & Publications — Cyprus": "Έρευνες & Δημοσιεύσεις Χρηματοοικονομικού Αλφαβητισμού — Κύπρος",
  "The OECD and Central Bank of Cyprus reports behind BusinessHub's financial literacy figures, plus practical guides from the Resource Hub.": "Οι εκθέσεις του ΟΟΣΑ και της Κεντρικής Τράπεζας της Κύπρου πίσω από τα στοιχεία του BusinessHub, μαζί με πρακτικούς οδηγούς από το Κέντρο Πόρων.",
  "The official reports behind the figures on these pages, with links to the original documents.": "Οι επίσημες εκθέσεις πίσω από τα στοιχεία αυτών των σελίδων, με συνδέσμους στα πρωτότυπα έγγραφα.",
  "Survey reports": "Εκθέσεις ερευνών", "No reports listed yet.": "Δεν υπάρχουν ακόμη εκθέσεις.", "survey": "έρευνα", "published": "δημοσίευση",
  "Read the report": "Διαβάστε την έκθεση", "Guides": "Οδηγοί",
  "Practical guides and glossaries are in the": "Πρακτικοί οδηγοί και γλωσσάρια βρίσκονται στο", "Resource Hub": "Κέντρο Πόρων",
  "Economic figures are on the": "Τα οικονομικά στοιχεία βρίσκονται στη", "Economy page": "σελίδα Οικονομία",
  // Campaigns
  "Financial Literacy Campaigns — Cyprus": "Εκστρατείες Χρηματοοικονομικού Αλφαβητισμού — Κύπρος",
  "Upcoming BusinessHub public awareness campaigns on borrowing costs, fraud prevention and saving.": "Επερχόμενες εκστρατείες ενημέρωσης του BusinessHub για το κόστος δανεισμού, την πρόληψη απάτης και την αποταμίευση.",
  "Public awareness campaigns are being prepared. The first planned themes are below.": "Ετοιμάζονται εκστρατείες ενημέρωσης του κοινού. Τα πρώτα προγραμματισμένα θέματα είναι παρακάτω.",
  "Coming soon": "Σύντομα",
  "Know your interest rate": "Γνωρίστε το επιτόκιό σας", "Understanding APR and the true cost of credit.": "Κατανόηση του ΣΕΠΕ και του πραγματικού κόστους της πίστωσης.",
  "Stop the scam": "Σταματήστε την απάτη", "Spotting investment and phone fraud, and checking CySEC warnings.": "Εντοπισμός επενδυτικής και τηλεφωνικής απάτης και έλεγχος των προειδοποιήσεων της Επιτροπής Κεφαλαιαγοράς.",
  "Save a little, often": "Αποταμιεύστε λίγο, συχνά", "Building an emergency fund, one month at a time.": "Δημιουργία ταμείου έκτακτης ανάγκης, έναν μήνα τη φορά.",
  // Methodology
  "Financial Literacy Sources & Methodology": "Πηγές & Μεθοδολογία Χρηματοοικονομικού Αλφαβητισμού",
  "Where BusinessHub's financial literacy figures come from: OECD, Central Bank of Cyprus, Eurostat and CYSTAT, with definitions and update schedules.": "Από πού προέρχονται τα στοιχεία του BusinessHub: ΟΟΣΑ, Κεντρική Τράπεζα της Κύπρου, Eurostat και ΣΤΑΤΥΣ, με ορισμούς και χρονοδιαγράμματα ενημέρωσης.",
  "Where every figure comes from, how often it updates and how to read it.": "Από πού προέρχεται κάθε στοιχείο, πόσο συχνά ενημερώνεται και πώς να το διαβάσετε.",
  "How the figures work": "Πώς λειτουργούν τα στοιχεία", "Datasets": "Σύνολα δεδομένων",
  "Indicator": "Δείκτης", "Latest period": "Τελευταία περίοδος", "Last checked": "Τελευταίος έλεγχος",
  "Survey figures: OECD and Central Bank of Cyprus, reviewed by an editor before publication. Eurostat data reused with attribution.": "Στοιχεία ερευνών: ΟΟΣΑ και Κεντρική Τράπεζα της Κύπρου, ελεγμένα από συντάκτη πριν από τη δημοσίευση. Τα δεδομένα της Eurostat επαναχρησιμοποιούνται με αναφορά της πηγής.",
  "OECD survey method": "Μέθοδος έρευνας ΟΟΣΑ",
  "The OECD/INFE survey of adults (2023 fieldwork, published 2025) scores knowledge, behaviour and attitudes, adding to an overall score out of 100. A score of 70+ is the OECD target level.": "Η έρευνα ενηλίκων ΟΟΣΑ/INFE (συλλογή στοιχείων 2023, δημοσίευση 2025) βαθμολογεί γνώσεις, συμπεριφορά και στάσεις, που αθροίζονται σε συνολική βαθμολογία στα 100. Βαθμολογία 70+ είναι το επίπεδο-στόχος του ΟΟΣΑ.",
  "Survey year vs publication year": "Έτος έρευνας και έτος δημοσίευσης",
  "Survey results describe the year interviews took place, not the year the report was released. We always show both.": "Τα αποτελέσματα αφορούν το έτος των συνεντεύξεων, όχι το έτος δημοσίευσης της έκθεσης. Δείχνουμε πάντα και τα δύο.",
  "Older Cyprus surveys": "Παλαιότερες έρευνες στην Κύπρο",
  "The Central Bank of Cyprus 2018 survey uses different questions and a 0–7 scale, so it is shown separately and never compared with the OECD scores.": "Η έρευνα της Κεντρικής Τράπεζας της Κύπρου του 2018 χρησιμοποιεί διαφορετικές ερωτήσεις και κλίμακα 0–7, γι' αυτό εμφανίζεται ξεχωριστά και δεν συγκρίνεται με τις βαθμολογίες του ΟΟΣΑ.",
  "Eurostat definitions": "Ορισμοί Eurostat",
  "Household figures use Eurostat's official definitions (e.g. saving rate = gross saving ÷ disposable income). Each chart links to its Eurostat table.": "Τα στοιχεία νοικοκυριών χρησιμοποιούν τους επίσημους ορισμούς της Eurostat (π.χ. ποσοστό αποταμίευσης = ακαθάριστη αποταμίευση ÷ διαθέσιμο εισόδημα). Κάθε γράφημα παραπέμπει στον πίνακα της Eurostat.",
  "CYSTAT data": "Στοιχεία ΣΤΑΤΥΣ",
  "National CPI, GDP and unemployment come from the Cyprus Statistical Service on the Economy page. National CPI and EU-harmonised HICP measure inflation differently.": "Ο εθνικός ΔΤΚ, το ΑΕΠ και η ανεργία προέρχονται από τη Στατιστική Υπηρεσία Κύπρου, στη σελίδα Οικονομία. Ο εθνικός ΔΤΚ και ο εναρμονισμένος ΕνΔΤΚ μετρούν τον πληθωρισμό διαφορετικά.",
  "Update frequency": "Συχνότητα ενημέρωσης",
  "Eurostat figures are checked daily and CYSTAT weekly. When a past figure is revised, it is reviewed before it changes here; a failed update never removes existing figures.": "Τα στοιχεία της Eurostat ελέγχονται καθημερινά και της ΣΤΑΤΥΣ εβδομαδιαία. Όταν αναθεωρείται παλαιότερο στοιχείο, ελέγχεται πριν αλλάξει εδώ· μια αποτυχημένη ενημέρωση δεν αφαιρεί ποτέ υπάρχοντα στοιχεία.",
  // Calculators
  "Money calculators": "Υπολογιστές χρημάτων",
  "Everything is worked out in your browser; nothing you type is saved or sent anywhere. Results are illustrations, not financial advice.": "Όλα υπολογίζονται στον browser σας· τίποτα από όσα πληκτρολογείτε δεν αποθηκεύεται ούτε αποστέλλεται. Τα αποτελέσματα είναι ενδεικτικά και δεν αποτελούν χρηματοοικονομική συμβουλή.",
  "Monthly budget": "Μηνιαίος προϋπολογισμός", "Savings goal": "Στόχος αποταμίευσης", "Compound interest": "Ανατοκισμός",
  "Loan repayment": "Αποπληρωμή δανείου", "Inflation": "Πληθωρισμός", "Emergency fund": "Ταμείο έκτακτης ανάγκης",
  "Monthly take-home pay (€)": "Μηνιαίες καθαρές αποδοχές (€)", "Needs (50%)": "Ανάγκες (50%)", "Wants (30%)": "Επιθυμίες (30%)", "Savings & debt (20%)": "Αποταμίευση & χρέη (20%)",
  "Formula: the 50/30/20 rule splits take-home pay into needs (rent, food, bills), wants and savings or extra debt repayments. It is a starting point; adjust to your situation.": "Τύπος: ο κανόνας 50/30/20 χωρίζει τις καθαρές αποδοχές σε ανάγκες (ενοίκιο, φαγητό, λογαριασμοί), επιθυμίες και αποταμίευση ή επιπλέον αποπληρωμή χρεών. Είναι αφετηρία· προσαρμόστε τον στη δική σας κατάσταση.",
  "Goal (€)": "Στόχος (€)", "Already saved (€)": "Ήδη αποταμιευμένα (€)", "Interest % a year": "Επιτόκιο % ετησίως", "Years": "Έτη",
  "Save each month": "Αποταμίευση κάθε μήνα",
  "Assumes interest is added monthly at a fixed rate and you save the same amount every month.": "Υποθέτει ότι οι τόκοι προστίθενται μηνιαία με σταθερό επιτόκιο και ότι αποταμιεύετε το ίδιο ποσό κάθε μήνα.",
  "Starting amount (€)": "Αρχικό ποσό (€)", "Monthly addition (€)": "Μηνιαία προσθήκη (€)", "Return % a year": "Απόδοση % ετησίως",
  "Final balance": "Τελικό υπόλοιπο", "You put in": "Καταθέσατε", "Growth from interest": "Αύξηση από τόκους",
  "Formula: FV = P(1+r)ⁿ + PMT·((1+r)ⁿ−1)/r, with monthly rate r and n months. Only about a third of adults in Cyprus answered the OECD compound-interest question correctly. Returns are not guaranteed.": "Τύπος: FV = P(1+r)ⁿ + PMT·((1+r)ⁿ−1)/r, με μηνιαίο επιτόκιο r και n μήνες. Μόνο περίπου ένας στους τρεις ενήλικες στην Κύπρο απάντησε σωστά στην ερώτηση ανατοκισμού του ΟΟΣΑ. Οι αποδόσεις δεν είναι εγγυημένες.",
  "Loan amount (€)": "Ποσό δανείου (€)", "Monthly payment": "Μηνιαία δόση", "Total repaid": "Συνολική αποπληρωμή", "Total interest": "Συνολικοί τόκοι",
  "Formula: M = P·r/(1−(1+r)^−n). Assumes a fixed rate; variable-rate loans change when rates move. Fees and insurance are not included.": "Τύπος: M = P·r/(1−(1+r)^−n). Υποθέτει σταθερό επιτόκιο· τα δάνεια κυμαινόμενου επιτοκίου αλλάζουν όταν κινούνται τα επιτόκια. Δεν περιλαμβάνονται τέλη και ασφάλειες.",
  "Amount today (€)": "Ποσό σήμερα (€)", "Inflation % a year": "Πληθωρισμός % ετησίως", "Buying power later": "Αγοραστική δύναμη αργότερα", "Lost to inflation": "Απώλεια λόγω πληθωρισμού",
  "Formula: real value = amount ÷ (1+inflation)^years. See the Cost of Living section for Cyprus's actual rates.": "Τύπος: πραγματική αξία = ποσό ÷ (1+πληθωρισμός)^έτη. Δείτε την ενότητα Κόστος Διαβίωσης για τα πραγματικά ποσοστά της Κύπρου.",
  "Essential monthly costs (€)": "Βασικά μηνιαία έξοδα (€)", "Months to cover": "Μήνες κάλυψης", "Emergency fund target": "Στόχος ταμείου έκτακτης ανάγκης",
  "A common guide is 3–6 months of essential costs (rent, food, bills, loan payments), kept in an easy-access account.": "Ένας συνηθισμένος οδηγός είναι 3–6 μήνες βασικών εξόδων (ενοίκιο, φαγητό, λογαριασμοί, δόσεις δανείων), σε λογαριασμό με εύκολη πρόσβαση.",
  // Topics
  "Track what comes in and goes out each month, then plan spending before the month starts.": "Καταγράψτε τι μπαίνει και τι βγαίνει κάθε μήνα και σχεδιάστε τα έξοδα πριν αρχίσει ο μήνας.",
  "Pay yourself first: move savings on payday, and keep an emergency fund in an easy-access account.": "Πληρώστε πρώτα τον εαυτό σας: μεταφέρετε την αποταμίευση την ημέρα πληρωμής και κρατήστε ταμείο έκτακτης ανάγκης σε λογαριασμό με εύκολη πρόσβαση.",
  "Borrowing costs money. Compare the annual percentage rate (APR), not just the monthly payment.": "Ο δανεισμός κοστίζει. Συγκρίνετε το συνολικό ετήσιο πραγματικό επιτόκιο (ΣΕΠΕ), όχι μόνο τη μηνιαία δόση.",
  "List every debt with its rate. Pay the most expensive first while keeping up minimum payments on the rest.": "Καταγράψτε κάθε χρέος με το επιτόκιό του. Εξοφλήστε πρώτα το ακριβότερο, πληρώνοντας τις ελάχιστες δόσεις στα υπόλοιπα.",
  "Interest compounds: you earn (or owe) interest on past interest, so time makes a big difference.": "Ο τόκος ανατοκίζεται: κερδίζετε (ή χρωστάτε) τόκο πάνω σε προηγούμενους τόκους, οπότε ο χρόνος κάνει μεγάλη διαφορά.",
  "Rising prices shrink what your money buys. Savings earning less than inflation lose value in real terms.": "Οι αυξανόμενες τιμές μειώνουν όσα αγοράζουν τα χρήματά σας. Αποταμιεύσεις που αποδίδουν λιγότερο από τον πληθωρισμό χάνουν πραγματική αξία.",
  "Higher possible returns come with higher risk. Spread risk and check firms are licensed by CySEC.": "Υψηλότερες πιθανές αποδόσεις συνεπάγονται υψηλότερο κίνδυνο. Κατανείμετε τον κίνδυνο και ελέγξτε ότι οι εταιρείες έχουν άδεια από την Επιτροπή Κεφαλαιαγοράς.",
  "Promises of guaranteed high returns are a warning sign. Check the CySEC warnings list before investing.": "Οι υποσχέσεις για εγγυημένες υψηλές αποδόσεις είναι προειδοποιητικό σημάδι. Ελέγξτε τον κατάλογο προειδοποιήσεων της Επιτροπής Κεφαλαιαγοράς πριν επενδύσετε.",
  "Banks never ask for your PIN or one-time codes. Use strong passwords and two-step sign-in.": "Οι τράπεζες δεν ζητούν ποτέ το PIN ή κωδικούς μίας χρήσης. Χρησιμοποιείτε ισχυρούς κωδικούς και σύνδεση δύο βημάτων.",
};

export const tr = (lang: Lang, en: string | null | undefined): string => (en == null ? "" : lang === "el" ? EL[en] ?? en : en);

/** Translator bound to the shared Financial Literacy / Academy language. */
export function useT() {
  const [lang] = useAcademyLang();
  return Object.assign((en: string | null | undefined) => tr(lang, en), { lang });
}

/** Period label in the chosen language ("Sep 2026" / "Σεπ 2026"). */
export function periodLabel(p: string, lang: Lang): string {
  const m = /^(\d{4})-(\d{2})$/.exec(p);
  if (m) return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, 1)).toLocaleString(lang === "el" ? "el-GR" : "en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
  const q = /^(\d{4})-Q(\d)$/.exec(p);
  if (q) return lang === "el" ? `${q[2]}ο τρ. ${q[1]}` : `Q${q[2]} ${q[1]}`;
  return p;
}

/** Source label in the chosen language, e.g. "Κεντρική Τράπεζα της Κύπρου (ECB BSI)". */
export const sourceLabel = (label: string, lang: Lang) => (lang === "el" ? label.replace("Central Bank of Cyprus", "Κεντρική Τράπεζα της Κύπρου") : label);
