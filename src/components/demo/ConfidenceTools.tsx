import { useState } from "react";
import { CheckCircle2, XCircle, ShieldAlert, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Lang } from "@/lib/academy";

type Q = { q: [string, string]; a: [string, string][]; correct: number; why: [string, string] };

/** Knowledge questions modelled on the OECD/INFE core questions. */
export const QUIZ: Q[] = [
  { q: ["You put €100 in a savings account paying 2% a year. With no withdrawals, how much is there after 1 year?", "Βάζετε €100 σε λογαριασμό με τόκο 2% τον χρόνο. Χωρίς αναλήψεις, πόσα θα υπάρχουν μετά από 1 χρόνο;"],
    a: [["€98", "€98"], ["€100", "€100"], ["€102", "€102"], ["€120", "€120"]], correct: 2, why: ["2% of €100 is €2, so €102.", "Το 2% των €100 είναι €2, άρα €102."] },
  { q: ["Same account: after 5 years, is the balance more than, exactly, or less than €110?", "Ίδιος λογαριασμός: μετά από 5 χρόνια, το υπόλοιπο είναι περισσότερο, ακριβώς ή λιγότερο από €110;"],
    a: [["More than €110", "Περισσότερο από €110"], ["Exactly €110", "Ακριβώς €110"], ["Less than €110", "Λιγότερο από €110"]], correct: 0, why: ["Interest earns interest (compounding): about €110.41.", "Ο τόκος κερδίζει τόκο (ανατοκισμός): περίπου €110,41."] },
  { q: ["Prices rise 3% a year and your savings earn 1%. After a year your money buys…", "Οι τιμές αυξάνονται 3% τον χρόνο και οι αποταμιεύσεις σας αποδίδουν 1%. Μετά από έναν χρόνο τα χρήματά σας αγοράζουν…"],
    a: [["More", "Περισσότερα"], ["The same", "Τα ίδια"], ["Less", "Λιγότερα"]], correct: 2, why: ["Inflation above your interest rate reduces what money buys.", "Πληθωρισμός πάνω από το επιτόκιο μειώνει την αγοραστική δύναμη."] },
  { q: ["Investing in many different shares is usually less risky than investing in one.", "Η επένδυση σε πολλές διαφορετικές μετοχές είναι συνήθως λιγότερο ριψοκίνδυνη από την επένδυση σε μία."],
    a: [["True", "Σωστό"], ["False", "Λάθος"]], correct: 0, why: ["Spreading money (diversification) lowers the risk of one loss.", "Η διασπορά μειώνει τον κίνδυνο από μία απώλεια."] },
  { q: ["An investment offering high returns usually also carries…", "Μια επένδυση με υψηλές αποδόσεις συνήθως έχει επίσης…"],
    a: [["Higher risk", "Υψηλότερο κίνδυνο"], ["No risk", "Κανέναν κίνδυνο"], ["Lower risk", "Χαμηλότερο κίνδυνο"]], correct: 0, why: ["Higher possible returns come with higher risk.", "Υψηλότερες πιθανές αποδόσεις συνοδεύονται από υψηλότερο κίνδυνο."] },
  { q: ["Paying only the minimum on a credit card each month…", "Πληρώνοντας μόνο την ελάχιστη δόση της πιστωτικής κάθε μήνα…"],
    a: [["Clears the balance quickly", "Εξοφλεί γρήγορα το υπόλοιπο"], ["Costs more in interest over time", "Κοστίζει περισσότερο σε τόκους με τον χρόνο"], ["Has no cost", "Δεν έχει κόστος"]], correct: 1, why: ["Interest keeps building on the unpaid balance.", "Ο τόκος συνεχίζει να χρεώνεται στο απλήρωτο υπόλοιπο."] },
];

type S = { msg: [string, string]; from: [string, string]; scam: boolean; why: [string, string] };

/** Digital payment safety scenarios: decide whether to trust or reject each message. */
export const SCENARIOS: S[] = [
  { from: ["SMS from 'Bank Alert'", "SMS από «Bank Alert»"], msg: ["Your card is blocked. Confirm your details at bank-secure-cy.info within 2 hours.", "Η κάρτα σας μπλοκαρίστηκε. Επιβεβαιώστε τα στοιχεία σας στο bank-secure-cy.info εντός 2 ωρών."], scam: true,
    why: ["Urgency plus an unknown link is classic phishing. Banks never ask for card details by SMS.", "Βιασύνη και άγνωστος σύνδεσμος είναι κλασικό phishing. Οι τράπεζες δεν ζητούν στοιχεία κάρτας με SMS."] },
  { from: ["Your banking app", "Η εφαρμογή της τράπεζάς σας"], msg: ["Approve a €24.90 payment to the supermarket you are paying at right now?", "Εγκρίνετε πληρωμή €24,90 στο σουπερμάρκετ όπου πληρώνετε τώρα;"], scam: false,
    why: ["You started this payment yourself, inside your own app. Approving is safe.", "Ξεκινήσατε εσείς την πληρωμή, μέσα στη δική σας εφαρμογή. Η έγκριση είναι ασφαλής."] },
  { from: ["Phone call, 'bank security team'", "Τηλεφώνημα, «ομάδα ασφαλείας τράπεζας»"], msg: ["We see fraud on your account. Read us the one-time code we just sent so we can stop it.", "Βλέπουμε απάτη στον λογαριασμό σας. Πείτε μας τον κωδικό μίας χρήσης που σας στείλαμε για να τη σταματήσουμε."], scam: true,
    why: ["Never share a one-time code. It approves payments, and genuine bank staff never ask for it.", "Μη δίνετε ποτέ κωδικό μίας χρήσης. Εγκρίνει πληρωμές και το προσωπικό της τράπεζας δεν τον ζητά ποτέ."] },
  { from: ["Online marketplace buyer", "Αγοραστής σε online αγορά"], msg: ["I've paid extra by mistake. Please refund €200 to this account before I collect the item.", "Πλήρωσα κατά λάθος παραπάνω. Επιστρέψτε €200 σε αυτόν τον λογαριασμό πριν παραλάβω το αντικείμενο."], scam: true,
    why: ["Overpayment refund requests are a common scam. Check your own account first.", "Τα αιτήματα επιστροφής υπερπληρωμής είναι συνηθισμένη απάτη. Ελέγξτε πρώτα τον δικό σας λογαριασμό."] },
  { from: ["Checkout page", "Σελίδα πληρωμής"], msg: ["A well-known shop's site, https padlock shown, asks you to confirm in your banking app.", "Γνωστό κατάστημα, με λουκέτο https, σας ζητά επιβεβαίωση στην εφαρμογή της τράπεζας."], scam: false,
    why: ["Strong customer authentication in your own app is the normal, secure EU process.", "Η ισχυρή ταυτοποίηση στη δική σας εφαρμογή είναι η κανονική, ασφαλής διαδικασία της ΕΕ."] },
];

const L = {
  en: { quiz: "Financial knowledge assessment", sim: "Digital payment safety simulator", res: "Your learning results", next: "Next", restart: "Start again",
    trust: "Looks safe", scam: "It's a scam", correct: "Correct", wrong: "Not quite", knowledge: "Knowledge", safety: "Payment safety", of: "of",
    pending: "Finish both activities to see your results.", strong: "Strong result — you handled every key money concept well.", mid: "Good start — the Academy lessons can lift this further.", low: "Worth a refresh — try the lessons on interest, inflation and fraud.",
    cy: "Cyprus adults answering the compound-interest question correctly (OECD 2023)", priv: "Answers stay in your browser; nothing is saved or sent." },
  el: { quiz: "Αξιολόγηση χρηματοοικονομικών γνώσεων", sim: "Προσομοιωτής ασφαλών ψηφιακών πληρωμών", res: "Τα αποτελέσματά σας", next: "Επόμενο", restart: "Από την αρχή",
    trust: "Φαίνεται ασφαλές", scam: "Είναι απάτη", correct: "Σωστό", wrong: "Όχι ακριβώς", knowledge: "Γνώσεις", safety: "Ασφάλεια πληρωμών", of: "από",
    pending: "Ολοκληρώστε και τις δύο δραστηριότητες για να δείτε τα αποτελέσματα.", strong: "Πολύ καλά — χειριστήκατε σωστά τις βασικές έννοιες.", mid: "Καλή αρχή — τα μαθήματα της Ακαδημίας βοηθούν περισσότερο.", low: "Αξίζει μια επανάληψη — δείτε τα μαθήματα για τόκους, πληθωρισμό και απάτες.",
    cy: "Ενήλικες στην Κύπρο που απάντησαν σωστά στην ερώτηση ανατοκισμού (ΟΟΣΑ 2023)", priv: "Οι απαντήσεις μένουν στον browser σας· τίποτα δεν αποθηκεύεται ή αποστέλλεται." },
};

function Step<T>({ items, render, onDone, lang }: { items: T[]; render: (it: T, pick: (ok: boolean, i: number) => void, chosen: number | null) => React.ReactNode; onDone: (score: number) => void; lang: Lang }) {
  const t = L[lang]; const i = lang === "el" ? 1 : 0;
  const [idx, setIdx] = useState(0); const [score, setScore] = useState(0); const [chosen, setChosen] = useState<number | null>(null); const [ok, setOk] = useState<boolean | null>(null);
  const done = idx >= items.length;
  if (done) return <div className="space-y-3"><p className="text-2xl font-serif font-bold">{score} {t.of} {items.length}</p><Button variant="outline" onClick={() => { setIdx(0); setScore(0); setChosen(null); setOk(null); onDone(-1); }}>{t.restart}</Button></div>;
  return (
    <div className="space-y-4">
      <Progress value={(idx / items.length) * 100} aria-label={`${idx} / ${items.length}`} />
      {render(items[idx], (good, c) => { if (chosen !== null) return; setChosen(c); setOk(good); if (good) setScore((s) => s + 1); }, chosen)}
      {ok !== null && <div className={`flex items-start gap-2 rounded-md p-3 text-sm ${ok ? "bg-primary/10" : "bg-muted"}`}>{ok ? <CheckCircle2 className="h-5 w-5 text-primary shrink-0" /> : <XCircle className="h-5 w-5 text-accent shrink-0" />}<span><b>{ok ? t.correct : t.wrong}.</b> {(items[idx] as unknown as { why: [string, string] }).why[i]}</span></div>}
      {ok !== null && <Button onClick={() => { const n = idx + 1; setIdx(n); setChosen(null); setOk(null); if (n >= items.length) onDone(score); }}>{t.next}</Button>}
    </div>
  );
}

export function ConfidenceTools({ lang, cyCompound }: { lang: Lang; cyCompound?: number | null }) {
  const t = L[lang]; const i = lang === "el" ? 1 : 0;
  const [qs, setQs] = useState<number | null>(null); const [ss, setSs] = useState<number | null>(null);
  const pct = qs != null && ss != null ? Math.round(((qs + ss) / (QUIZ.length + SCENARIOS.length)) * 100) : null;
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card><CardHeader><CardTitle className="font-serif text-xl">{t.quiz}</CardTitle></CardHeader><CardContent>
        <Step lang={lang} items={QUIZ} onDone={(s) => setQs(s < 0 ? null : s)} render={(q, pick, chosen) => <div className="space-y-3">
          <p className="font-medium">{q.q[i]}</p>
          <div className="grid gap-2">{q.a.map((a, k) => <Button key={k} variant={chosen === k ? (k === q.correct ? "default" : "secondary") : chosen !== null && k === q.correct ? "outline" : "outline"} className={`justify-start h-auto whitespace-normal text-left ${chosen !== null && k === q.correct ? "border-primary" : ""}`} onClick={() => pick(k === q.correct, k)}>{a[i]}</Button>)}</div>
        </div>} />
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="font-serif text-xl">{t.sim}</CardTitle></CardHeader><CardContent>
        <Step lang={lang} items={SCENARIOS} onDone={(s) => setSs(s < 0 ? null : s)} render={(s, pick, chosen) => <div className="space-y-3">
          <div className="rounded-lg border bg-muted/50 p-4"><p className="text-xs text-muted-foreground mb-1">{s.from[i]}</p><p>{s.msg[i]}</p></div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant={chosen === 0 ? "default" : "outline"} onClick={() => pick(!s.scam, 0)}><ShieldCheck className="h-4 w-4 mr-1" />{t.trust}</Button>
            <Button variant={chosen === 1 ? "default" : "outline"} onClick={() => pick(s.scam, 1)}><ShieldAlert className="h-4 w-4 mr-1" />{t.scam}</Button>
          </div>
        </div>} />
      </CardContent></Card>
      <Card className="lg:col-span-2"><CardHeader><CardTitle className="font-serif text-xl">{t.res}</CardTitle></CardHeader><CardContent className="space-y-4">
        {pct == null ? <p className="text-muted-foreground">{t.pending}</p> : <>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="rounded-md bg-muted p-4"><p className="text-xs text-muted-foreground">{t.knowledge}</p><p className="text-2xl font-serif font-bold">{qs}/{QUIZ.length}</p></div>
            <div className="rounded-md bg-muted p-4"><p className="text-xs text-muted-foreground">{t.safety}</p><p className="text-2xl font-serif font-bold">{ss}/{SCENARIOS.length}</p></div>
            <div className="rounded-md bg-primary p-4 text-primary-foreground"><p className="text-xs opacity-90">{lang === "el" ? "Σύνολο" : "Overall"}</p><p className="text-2xl font-serif font-bold">{pct}%</p></div>
          </div>
          <p className="font-medium">{pct >= 80 ? t.strong : pct >= 50 ? t.mid : t.low}</p>
          {cyCompound != null && <p className="text-sm text-muted-foreground">{t.cy}: <b>{cyCompound}%</b></p>}
        </>}
        <p className="text-xs text-muted-foreground">{t.priv}</p>
      </CardContent></Card>
    </div>
  );
}
