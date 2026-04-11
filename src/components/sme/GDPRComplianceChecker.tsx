import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  RotateCcw,
  FileText,
  Users,
  Lock,
  Database,
  Eye,
  Bell,
} from "lucide-react";

const categories = [
  {
    id: "lawful-basis",
    name: "Lawful Basis & Consent",
    icon: FileText,
    questions: [
      { id: "lb1", text: "Do you have a documented lawful basis for each data processing activity?", risk: "high", tip: "Under GDPR Article 6, you must identify a lawful basis (consent, contract, legal obligation, vital interests, public task, or legitimate interests) before processing personal data." },
      { id: "lb2", text: "Is your consent mechanism GDPR-compliant (freely given, specific, informed, unambiguous)?", risk: "high", tip: "Pre-ticked boxes or bundled consent are not valid. Each purpose requires separate, explicit consent." },
      { id: "lb3", text: "Can users withdraw consent as easily as they gave it?", risk: "medium", tip: "Provide a clear and accessible mechanism for withdrawal, such as an unsubscribe link or account settings toggle." },
      { id: "lb4", text: "Do you have a cookie consent banner that blocks non-essential cookies until consent?", risk: "medium", tip: "Analytics and marketing cookies must not load until the user actively opts in. Use a consent management platform (CMP)." },
    ],
  },
  {
    id: "rights",
    name: "Data Subject Rights",
    icon: Users,
    questions: [
      { id: "dr1", text: "Can individuals access their personal data upon request (Subject Access Request)?", risk: "high", tip: "You must respond within 30 days. Prepare a standard process and response template." },
      { id: "dr2", text: "Can you delete personal data upon request (Right to Erasure)?", risk: "high", tip: "Ensure you can locate and delete all copies of an individual's data across all systems." },
      { id: "dr3", text: "Can individuals export their data in a portable format (Right to Portability)?", risk: "medium", tip: "Provide data in a commonly used, machine-readable format like CSV or JSON." },
      { id: "dr4", text: "Do you have a process to handle objections to data processing?", risk: "medium", tip: "Individuals can object to processing based on legitimate interests or direct marketing at any time." },
    ],
  },
  {
    id: "security",
    name: "Data Security",
    icon: Lock,
    questions: [
      { id: "ds1", text: "Is personal data encrypted in transit and at rest?", risk: "high", tip: "Use TLS/SSL for data in transit and AES-256 encryption for data at rest. This includes databases, backups, and file storage." },
      { id: "ds2", text: "Do you have access controls limiting who can view personal data?", risk: "high", tip: "Implement role-based access control (RBAC). Only staff who need data to perform their role should have access." },
      { id: "ds3", text: "Do you conduct regular security assessments and vulnerability tests?", risk: "medium", tip: "Schedule quarterly vulnerability scans and annual penetration testing. Document findings and remediation." },
      { id: "ds4", text: "Are employees trained on data protection and phishing awareness?", risk: "medium", tip: "Annual training is the minimum. Include phishing simulations and GDPR-specific scenarios." },
    ],
  },
  {
    id: "records",
    name: "Documentation & Records",
    icon: Database,
    questions: [
      { id: "rc1", text: "Do you maintain a Record of Processing Activities (ROPA)?", risk: "high", tip: "Article 30 requires controllers to maintain written records of processing activities, including purposes, categories of data, recipients, and retention periods." },
      { id: "rc2", text: "Have you documented your data retention policy with specific timeframes?", risk: "medium", tip: "Define how long you keep each category of personal data and automate deletion where possible." },
      { id: "rc3", text: "Have you conducted a Data Protection Impact Assessment (DPIA) for high-risk processing?", risk: "high", tip: "DPIAs are mandatory for systematic monitoring, large-scale processing of sensitive data, or automated decision-making." },
      { id: "rc4", text: "Do you have written data processing agreements with all third-party processors?", risk: "high", tip: "Article 28 requires a written contract with any processor. This includes cloud providers, email services, analytics tools, etc." },
    ],
  },
  {
    id: "privacy",
    name: "Privacy & Transparency",
    icon: Eye,
    questions: [
      { id: "pr1", text: "Do you have a comprehensive, plain-language privacy policy?", risk: "high", tip: "Your privacy policy must cover: identity of controller, purposes, lawful basis, recipients, retention, rights, and complaints process." },
      { id: "pr2", text: "Is privacy information provided at the point of data collection?", risk: "medium", tip: "Use layered notices — a short notice at point of collection linking to the full privacy policy." },
      { id: "pr3", text: "Do you inform users about international data transfers?", risk: "medium", tip: "If data leaves the EEA, you need adequate safeguards (adequacy decision, SCCs, or BCRs) and must inform data subjects." },
    ],
  },
  {
    id: "breach",
    name: "Breach Response",
    icon: Bell,
    questions: [
      { id: "br1", text: "Do you have a documented data breach response plan?", risk: "high", tip: "Include detection, containment, assessment, notification (within 72 hours to DPA), and post-incident review procedures." },
      { id: "br2", text: "Can you detect and report a breach within 72 hours to the Commissioner?", risk: "high", tip: "The Cyprus Commissioner for Personal Data Protection must be notified within 72 hours. Have contact details and templates ready." },
      { id: "br3", text: "Do you maintain a breach register (even for breaches not reported to the authority)?", risk: "medium", tip: "Article 33(5) requires documenting all breaches, including facts, effects, and remedial action taken." },
    ],
  },
];

type Answer = "yes" | "no" | "partial";

export function GDPRComplianceChecker() {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [showResults, setShowResults] = useState(false);
  const [expandedTip, setExpandedTip] = useState<string | null>(null);

  const totalQuestions = categories.reduce((sum, c) => sum + c.questions.length, 0);
  const answeredCount = Object.keys(answers).length;

  const handleAnswer = (questionId: string, answer: Answer) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const getScore = () => {
    let total = 0;
    let achieved = 0;
    categories.forEach((cat) => {
      cat.questions.forEach((q) => {
        const weight = q.risk === "high" ? 3 : 2;
        total += weight;
        if (answers[q.id] === "yes") achieved += weight;
        else if (answers[q.id] === "partial") achieved += weight * 0.5;
      });
    });
    return total > 0 ? Math.round((achieved / total) * 100) : 0;
  };

  const getCategoryScore = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return 0;
    let total = 0;
    let achieved = 0;
    cat.questions.forEach((q) => {
      const weight = q.risk === "high" ? 3 : 2;
      total += weight;
      if (answers[q.id] === "yes") achieved += weight;
      else if (answers[q.id] === "partial") achieved += weight * 0.5;
    });
    return total > 0 ? Math.round((achieved / total) * 100) : 0;
  };

  const getHighRiskGaps = () => {
    const gaps: { question: string; tip: string; category: string }[] = [];
    categories.forEach((cat) => {
      cat.questions.forEach((q) => {
        if (q.risk === "high" && answers[q.id] !== "yes") {
          gaps.push({ question: q.text, tip: q.tip, category: cat.name });
        }
      });
    });
    return gaps;
  };

  const handleReset = () => {
    setAnswers({});
    setShowResults(false);
  };

  const score = getScore();

  if (showResults) {
    const gaps = getHighRiskGaps();

    return (
      <div className="border border-border bg-card">
        <div className="px-5 py-4 border-b-2 border-foreground flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-lg text-foreground">GDPR Compliance Report</h3>
            <p className="text-xs text-muted-foreground mt-1">Assessment for Cyprus-based SMEs</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleReset} className="rounded-none gap-1.5 text-xs">
            <RotateCcw className="h-3 w-3" /> Retake
          </Button>
        </div>

        <div className="p-6">
          {/* Overall Score */}
          <div className="text-center mb-8 pb-6 border-b border-border">
            <p className="text-6xl font-serif font-bold text-foreground">{score}%</p>
            <p className={`text-lg font-serif font-semibold mt-1 ${
              score >= 80 ? "text-success" : score >= 50 ? "text-warning" : "text-destructive"
            }`}>
              {score >= 80 ? "Strong Compliance" : score >= 50 ? "Partial Compliance" : "Significant Gaps"}
            </p>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              {score >= 80
                ? "Your business demonstrates strong GDPR compliance. Continue monitoring and updating your practices."
                : score >= 50
                ? "You have a foundation in place but key areas need attention — especially the high-risk gaps below."
                : "Critical compliance gaps exist that could expose your business to significant fines. Prioritise the items below."}
            </p>
          </div>

          {/* Category Breakdown */}
          <div className="space-y-3 mb-8">
            {categories.map((cat) => {
              const catScore = getCategoryScore(cat.id);
              return (
                <div key={cat.id} className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-foreground/5 flex items-center justify-center shrink-0">
                    <cat.icon className="h-4 w-4 text-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-foreground">{cat.name}</span>
                      <span className={`text-xs font-bold ${
                        catScore >= 80 ? "text-success" : catScore >= 50 ? "text-warning" : "text-destructive"
                      }`}>{catScore}%</span>
                    </div>
                    <div className="h-2 bg-border overflow-hidden">
                      <div
                        className={`h-full transition-all duration-700 ${
                          catScore >= 80 ? "bg-success" : catScore >= 50 ? "bg-warning" : "bg-destructive"
                        }`}
                        style={{ width: `${catScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* High Risk Gaps */}
          {gaps.length > 0 && (
            <div className="border border-destructive/30 bg-destructive/5 p-5">
              <h4 className="flex items-center gap-2 text-sm font-bold text-destructive mb-3">
                <AlertTriangle className="h-4 w-4" />
                High-Risk Compliance Gaps ({gaps.length})
              </h4>
              <div className="space-y-3">
                {gaps.map((gap, i) => (
                  <div key={i} className="border-l-2 border-destructive pl-3">
                    <p className="text-sm font-semibold text-foreground">{gap.question}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{gap.category}</p>
                    <p className="text-xs text-muted-foreground mt-1">{gap.tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resources */}
          <div className="mt-6 pt-4 border-t border-border flex flex-wrap gap-3">
            <a href="https://www.dataprotection.gov.cy" target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-wider text-secondary font-semibold flex items-center gap-1 hover:underline">
              Cyprus Data Protection Commissioner <ExternalLink className="h-3 w-3" />
            </a>
            <a href="https://gdpr.eu/checklist/" target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-wider text-secondary font-semibold flex items-center gap-1 hover:underline">
              GDPR.eu Compliance Checklist <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border bg-card">
      <div className="px-5 py-4 border-b-2 border-foreground">
        <h3 className="font-serif font-bold text-lg text-foreground">GDPR Compliance Checker</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {totalQuestions} checks across {categories.length} areas · Tailored for Cyprus SMEs
        </p>
      </div>

      {/* Progress */}
      <div className="px-5 py-3 border-b border-border flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-border overflow-hidden">
          <div className="h-full bg-secondary transition-all duration-300" style={{ width: `${(answeredCount / totalQuestions) * 100}%` }} />
        </div>
        <span className="text-[10px] text-muted-foreground font-semibold">{answeredCount}/{totalQuestions}</span>
      </div>

      <div className="divide-y divide-border">
        {categories.map((cat) => (
          <div key={cat.id} className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <cat.icon className="h-4 w-4 text-foreground" />
              <h4 className="font-serif font-bold text-foreground">{cat.name}</h4>
              <Badge className="rounded-none bg-foreground/5 text-muted-foreground text-[9px] uppercase tracking-wider border border-border ml-auto">
                {cat.questions.length} checks
              </Badge>
            </div>

            <div className="space-y-3">
              {cat.questions.map((q) => (
                <div key={q.id}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        {q.risk === "high" && (
                          <Badge className="rounded-none bg-destructive/10 text-destructive text-[8px] uppercase tracking-wider border border-destructive/20">
                            High Risk
                          </Badge>
                        )}
                        <p className="text-sm text-foreground">{q.text}</p>
                      </div>

                      {expandedTip === q.id && (
                        <div className="mt-2 mb-2 p-2.5 bg-muted/50 border border-border text-xs text-muted-foreground animate-fade-in">
                          {q.tip}
                        </div>
                      )}

                      <button
                        onClick={() => setExpandedTip(expandedTip === q.id ? null : q.id)}
                        className="text-[10px] text-secondary hover:underline"
                      >
                        {expandedTip === q.id ? "Hide guidance" : "Show guidance"}
                      </button>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {(["yes", "partial", "no"] as const).map((val) => (
                        <button
                          key={val}
                          onClick={() => handleAnswer(q.id, val)}
                          className={`px-2.5 py-1.5 text-[10px] uppercase tracking-wider font-semibold border transition-colors ${
                            answers[q.id] === val
                              ? val === "yes"
                                ? "bg-success text-white border-success"
                                : val === "partial"
                                ? "bg-warning text-white border-warning"
                                : "bg-destructive text-white border-destructive"
                              : "bg-transparent text-muted-foreground border-border hover:border-foreground"
                          }`}
                        >
                          {val === "yes" ? "Yes" : val === "partial" ? "Partial" : "No"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Submit */}
      <div className="px-5 py-4 border-t border-border flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {answeredCount === totalQuestions ? "All questions answered" : `${totalQuestions - answeredCount} questions remaining`}
        </p>
        <Button
          onClick={() => setShowResults(true)}
          disabled={answeredCount < totalQuestions}
          className="rounded-none gap-1.5 text-xs bg-foreground text-background hover:bg-foreground/90"
        >
          Generate Report <ArrowRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
