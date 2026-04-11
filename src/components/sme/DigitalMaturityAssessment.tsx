import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Monitor,
  Brain,
  Database,
  Users,
  Leaf,
  Cpu,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

const dimensions = [
  {
    id: "strategy",
    name: "Digital Business Strategy",
    icon: Monitor,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    questions: [
      { text: "Does your company have a formal digital strategy?", options: ["No strategy", "Informal plans", "Documented strategy", "Regularly reviewed strategy"] },
      { text: "How integrated is digital into your core business model?", options: ["Not at all", "Some digital channels", "Significant digital revenue", "Digital-first model"] },
      { text: "Do you allocate dedicated budget for digital transformation?", options: ["No budget", "Ad-hoc spending", "Annual budget", "Strategic investment fund"] },
      { text: "How does leadership engage with digital initiatives?", options: ["Not engaged", "Aware but passive", "Actively supports", "Champions & drives"] },
    ],
  },
  {
    id: "readiness",
    name: "Digital Readiness",
    icon: Cpu,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    questions: [
      { text: "What is the state of your IT infrastructure?", options: ["Legacy systems only", "Mix of old and new", "Mostly modern", "Cloud-native & scalable"] },
      { text: "Do you use cloud services for business operations?", options: ["No cloud use", "Basic email/storage", "Several cloud tools", "Comprehensive cloud stack"] },
      { text: "How do you manage cybersecurity?", options: ["No formal measures", "Basic antivirus", "Security policies in place", "Comprehensive security program"] },
      { text: "What is your level of process digitisation?", options: ["Paper-based", "Some digital processes", "Mostly digital", "Fully digitised & automated"] },
    ],
  },
  {
    id: "human",
    name: "Human-Centric Digitalisation",
    icon: Users,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    questions: [
      { text: "Do employees receive digital skills training?", options: ["No training", "Occasional workshops", "Regular training program", "Continuous learning culture"] },
      { text: "How do you handle digital change management?", options: ["No process", "Ad-hoc communication", "Structured approach", "Embedded change culture"] },
      { text: "Is your digital offering accessible to all users?", options: ["Not considered", "Basic accessibility", "WCAG compliant", "Universal design approach"] },
      { text: "How do you gather user/customer digital feedback?", options: ["We don't", "Occasional surveys", "Regular feedback loops", "Real-time analytics & feedback"] },
    ],
  },
  {
    id: "data",
    name: "Data Governance",
    icon: Database,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    questions: [
      { text: "Do you have a data management strategy?", options: ["No strategy", "Basic data storage", "Data governance policies", "Data-driven decision making"] },
      { text: "How do you handle GDPR and data privacy?", options: ["Not compliant", "Partially compliant", "Mostly compliant", "Fully compliant & audited"] },
      { text: "Do you use analytics for business decisions?", options: ["No analytics", "Basic spreadsheets", "BI dashboards", "Advanced analytics & ML"] },
      { text: "How is data shared across your organisation?", options: ["Siloed", "Some shared access", "Centralised data platform", "Real-time data sharing"] },
    ],
  },
  {
    id: "ai",
    name: "Automation & AI",
    icon: Brain,
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    questions: [
      { text: "Do you use any process automation tools?", options: ["No automation", "Basic macros/scripts", "RPA for key processes", "Intelligent automation"] },
      { text: "Have you explored AI for your business?", options: ["Not at all", "Aware but no action", "Piloting AI tools", "AI integrated in operations"] },
      { text: "How do you handle repetitive tasks?", options: ["All manual", "Some templates", "Partially automated", "Fully automated workflows"] },
      { text: "Do you use chatbots or AI assistants?", options: ["No", "Considering it", "Basic chatbot", "Advanced AI assistants"] },
    ],
  },
  {
    id: "green",
    name: "Green Digitalisation",
    icon: Leaf,
    color: "text-green-600",
    bgColor: "bg-green-50",
    questions: [
      { text: "Do you measure your digital carbon footprint?", options: ["Not at all", "Aware of the concept", "Basic measurements", "Comprehensive tracking"] },
      { text: "Do you use digital tools for sustainability?", options: ["No", "Energy monitoring", "Supply chain tracking", "Full ESG digital reporting"] },
      { text: "How energy-efficient is your IT infrastructure?", options: ["Not considered", "Some measures", "Green hosting/cloud", "Carbon-neutral IT"] },
      { text: "Do you have a digital sustainability strategy?", options: ["No strategy", "Informal goals", "Formal targets", "Integrated ESG strategy"] },
    ],
  },
];

export function DigitalMaturityAssessment() {
  const [currentDimension, setCurrentDimension] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [completed, setCompleted] = useState(false);

  const dim = dimensions[currentDimension];

  const handleAnswer = (questionIndex: number, optionIndex: number) => {
    setAnswers((prev) => {
      const dimAnswers = [...(prev[dim.id] || [])];
      dimAnswers[questionIndex] = optionIndex;
      return { ...prev, [dim.id]: dimAnswers };
    });
  };

  const currentAnswers = answers[dim.id] || [];
  const allCurrentAnswered = currentAnswers.length === dim.questions.length && currentAnswers.every((a) => a !== undefined);

  const getDimensionScore = (dimId: string) => {
    const a = answers[dimId] || [];
    if (a.length === 0) return 0;
    const total = a.reduce((sum, v) => sum + (v || 0), 0);
    return Math.round((total / (a.length * 3)) * 100);
  };

  const getOverallScore = () => {
    const scores = dimensions.map((d) => getDimensionScore(d.id));
    return Math.round(scores.reduce((a, b) => a + b, 0) / dimensions.length);
  };

  const getMaturityLevel = (score: number) => {
    if (score >= 75) return { level: "Digital Leader", color: "text-success" };
    if (score >= 50) return { level: "Digital Adopter", color: "text-secondary" };
    if (score >= 25) return { level: "Digital Explorer", color: "text-warning" };
    return { level: "Digital Beginner", color: "text-destructive" };
  };

  const handleNext = () => {
    if (currentDimension < dimensions.length - 1) {
      setCurrentDimension((prev) => prev + 1);
    } else {
      setCompleted(true);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentDimension(0);
    setCompleted(false);
  };

  if (completed) {
    const overall = getOverallScore();
    const maturity = getMaturityLevel(overall);

    return (
      <div className="border border-border bg-card">
        <div className="px-5 py-4 border-b-2 border-foreground flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-lg text-foreground">Digital Maturity Results</h3>
            <p className="text-xs text-muted-foreground mt-1">Based on the EU Open DMAT Framework</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleReset} className="rounded-none gap-1.5 text-xs">
            <RotateCcw className="h-3 w-3" /> Retake
          </Button>
        </div>

        <div className="p-6">
          {/* Overall Score */}
          <div className="text-center mb-8 pb-6 border-b border-border">
            <p className="text-6xl font-serif font-bold text-foreground">{overall}%</p>
            <p className={`text-lg font-serif font-semibold mt-1 ${maturity.color}`}>{maturity.level}</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              {overall >= 75
                ? "Your business demonstrates strong digital maturity. Focus on maintaining leadership and exploring emerging technologies."
                : overall >= 50
                ? "Good digital foundations in place. Prioritise the weaker dimensions below to accelerate transformation."
                : overall >= 25
                ? "Early-stage digital adoption. Start with the lowest-scoring areas to build a solid digital foundation."
                : "Significant opportunity for digital growth. Consider starting with basic IT infrastructure and a digital strategy."}
            </p>
          </div>

          {/* Dimension Breakdown */}
          <div className="space-y-4">
            {dimensions.map((d) => {
              const score = getDimensionScore(d.id);
              const level = getMaturityLevel(score);
              return (
                <div key={d.id} className="flex items-center gap-4">
                  <div className={`w-9 h-9 ${d.bgColor} flex items-center justify-center shrink-0`}>
                    <d.icon className={`h-4.5 w-4.5 ${d.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-foreground">{d.name}</span>
                      <span className={`text-xs font-semibold ${level.color}`}>{score}%</span>
                    </div>
                    <div className="h-2 bg-border overflow-hidden">
                      <div
                        className={`h-full transition-all duration-700 ${
                          score >= 75 ? "bg-success" : score >= 50 ? "bg-secondary" : score >= 25 ? "bg-warning" : "bg-destructive"
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recommendations */}
          <div className="mt-8 pt-6 border-t border-border">
            <h4 className="section-label text-xs mb-3">Priority Actions</h4>
            <div className="space-y-2">
              {dimensions
                .map((d) => ({ ...d, score: getDimensionScore(d.id) }))
                .sort((a, b) => a.score - b.score)
                .slice(0, 3)
                .map((d) => (
                  <div key={d.id} className="flex items-start gap-2 text-sm">
                    <ArrowRight className="h-3.5 w-3.5 text-secondary shrink-0 mt-0.5" />
                    <span className="text-foreground">
                      <strong>{d.name}</strong> ({d.score}%) — 
                      {d.score < 25 ? " Start with foundational improvements" : " Build on existing capabilities"}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border bg-card">
      <div className="px-5 py-4 border-b-2 border-foreground">
        <h3 className="font-serif font-bold text-lg text-foreground">Digital Maturity Assessment</h3>
        <p className="text-xs text-muted-foreground mt-1">Based on the EU Open DMAT Framework · {dimensions.length} dimensions</p>
      </div>

      {/* Dimension Progress */}
      <div className="px-5 py-3 border-b border-border flex gap-1 overflow-x-auto">
        {dimensions.map((d, i) => {
          const hasAnswers = (answers[d.id] || []).length === d.questions.length;
          return (
            <button
              key={d.id}
              onClick={() => setCurrentDimension(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap transition-colors border ${
                i === currentDimension
                  ? "bg-foreground text-background border-foreground"
                  : hasAnswers
                  ? "bg-success/10 text-success border-success/30"
                  : "bg-transparent text-muted-foreground border-border hover:border-foreground"
              }`}
            >
              {hasAnswers && <CheckCircle2 className="h-3 w-3" />}
              {d.name}
            </button>
          );
        })}
      </div>

      {/* Current Dimension */}
      <div className="p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className={`w-10 h-10 ${dim.bgColor} flex items-center justify-center`}>
            <dim.icon className={`h-5 w-5 ${dim.color}`} />
          </div>
          <div>
            <h4 className="font-serif font-bold text-foreground">{dim.name}</h4>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Dimension {currentDimension + 1} of {dimensions.length}
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {dim.questions.map((q, qi) => (
            <div key={qi}>
              <p className="text-sm font-semibold text-foreground mb-2.5">
                {qi + 1}. {q.text}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {q.options.map((opt, oi) => (
                  <button
                    key={oi}
                    onClick={() => handleAnswer(qi, oi)}
                    className={`text-left px-3 py-2.5 text-xs transition-all border ${
                      currentAnswers[qi] === oi
                        ? "bg-foreground text-background border-foreground"
                        : "bg-transparent text-foreground border-border hover:border-foreground"
                    }`}
                  >
                    <span className="font-semibold mr-1.5">{oi + 1}.</span> {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDimension((prev) => prev - 1)}
            disabled={currentDimension === 0}
            className="rounded-none gap-1.5 text-xs"
          >
            <ArrowLeft className="h-3 w-3" /> Previous
          </Button>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            {currentDimension + 1} / {dimensions.length}
          </span>
          <Button
            size="sm"
            onClick={handleNext}
            disabled={!allCurrentAnswered}
            className="rounded-none gap-1.5 text-xs bg-foreground text-background hover:bg-foreground/90"
          >
            {currentDimension === dimensions.length - 1 ? "See Results" : "Next"} <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
