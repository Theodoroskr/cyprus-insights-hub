import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Euro,
  CheckCircle2,
  XCircle,
  Minus,
  ExternalLink,
  Sparkles,
} from "lucide-react";

interface Programme {
  name: string;
  match: number;
  reasons: string[];
  link: string;
  maxFunding: string;
  nextDeadline: string;
}

const questions = [
  {
    id: "sector",
    question: "What is your primary business sector?",
    options: [
      { label: "Technology / Digital", value: "tech" },
      { label: "Manufacturing / Industry", value: "manufacturing" },
      { label: "Services / Consulting", value: "services" },
      { label: "Tourism / Hospitality", value: "tourism" },
      { label: "Agriculture / Food", value: "agriculture" },
      { label: "Green / Clean Energy", value: "green" },
    ],
  },
  {
    id: "size",
    question: "How many employees does your company have?",
    options: [
      { label: "1–9 (Micro)", value: "micro" },
      { label: "10–49 (Small)", value: "small" },
      { label: "50–249 (Medium)", value: "medium" },
    ],
  },
  {
    id: "age",
    question: "How old is your company?",
    options: [
      { label: "Not yet incorporated", value: "pre" },
      { label: "Less than 3 years", value: "startup" },
      { label: "3–7 years", value: "growth" },
      { label: "More than 7 years", value: "mature" },
    ],
  },
  {
    id: "goal",
    question: "What is your primary funding goal?",
    options: [
      { label: "Research & innovation", value: "innovation" },
      { label: "Digitalisation & AI adoption", value: "digital" },
      { label: "Market expansion / export", value: "expansion" },
      { label: "Green transition / sustainability", value: "green" },
      { label: "Skills & workforce development", value: "skills" },
      { label: "General business growth", value: "growth" },
    ],
  },
  {
    id: "innovation",
    question: "What is your innovation readiness level?",
    options: [
      { label: "Idea stage — concept only", value: "idea" },
      { label: "Prototype or pilot", value: "prototype" },
      { label: "Market-ready product", value: "market" },
      { label: "Scaling existing innovation", value: "scaling" },
    ],
  },
  {
    id: "cross-border",
    question: "Do you have partners or customers in other EU countries?",
    options: [
      { label: "Yes — active cross-border operations", value: "active" },
      { label: "Planning to expand cross-border", value: "planning" },
      { label: "No — domestic only", value: "domestic" },
    ],
  },
  {
    id: "turnover",
    question: "What is your annual turnover?",
    options: [
      { label: "Under €500K", value: "under500k" },
      { label: "€500K – €2M", value: "500k-2m" },
      { label: "€2M – €10M", value: "2m-10m" },
      { label: "€10M – €50M", value: "10m-50m" },
    ],
  },
];

function calculateMatches(answers: Record<string, string>): Programme[] {
  const programmes: Programme[] = [];

  // Horizon Europe / EIC Accelerator
  let horizonScore = 0;
  const horizonReasons: string[] = [];
  if (["tech", "green", "manufacturing"].includes(answers.sector)) { horizonScore += 25; horizonReasons.push("Sector aligned with Horizon priorities"); }
  if (["innovation", "digital"].includes(answers.goal)) { horizonScore += 25; horizonReasons.push("Innovation-focused goal matches"); }
  if (["prototype", "market", "scaling"].includes(answers.innovation)) { horizonScore += 25; horizonReasons.push("Innovation readiness at eligible TRL"); }
  if (["active", "planning"].includes(answers["cross-border"])) { horizonScore += 15; horizonReasons.push("Cross-border activity strengthens application"); }
  if (answers.size !== "medium") horizonScore += 10;
  programmes.push({ name: "Horizon Europe / EIC Accelerator", match: Math.min(horizonScore, 100), reasons: horizonReasons, link: "https://eic.ec.europa.eu/eic-funding-opportunities/eic-accelerator_en", maxFunding: "€2.5M grant + €15M equity", nextDeadline: "Rolling (cut-off dates)" });

  // Digital Europe Programme
  let digitalScore = 0;
  const digitalReasons: string[] = [];
  if (["tech", "services"].includes(answers.sector)) { digitalScore += 25; digitalReasons.push("Digital/tech sector eligible"); }
  if (["digital", "innovation"].includes(answers.goal)) { digitalScore += 30; digitalReasons.push("Goal aligns with programme objectives"); }
  if (["prototype", "market"].includes(answers.innovation)) { digitalScore += 20; digitalReasons.push("Innovation level appropriate"); }
  if (answers.size === "micro" || answers.size === "small") { digitalScore += 15; digitalReasons.push("Programme prioritises smaller SMEs"); }
  programmes.push({ name: "Digital Europe Programme", match: Math.min(digitalScore, 100), reasons: digitalReasons, link: "https://digital-strategy.ec.europa.eu/en/activities/digital-programme", maxFunding: "€7.5B total programme", nextDeadline: "Multiple calls annually" });

  // COSME / Single Market Programme
  let cosmeScore = 0;
  const cosmeReasons: string[] = [];
  if (["expansion", "growth"].includes(answers.goal)) { cosmeScore += 30; cosmeReasons.push("Market expansion goal matches"); }
  if (["active", "planning"].includes(answers["cross-border"])) { cosmeScore += 25; cosmeReasons.push("Cross-border ambition aligns"); }
  cosmeScore += 20; cosmeReasons.push("Open to all EU-registered SMEs");
  if (["growth", "mature"].includes(answers.age)) { cosmeScore += 15; cosmeReasons.push("Established companies preferred"); }
  programmes.push({ name: "Single Market Programme (COSME)", match: Math.min(cosmeScore, 100), reasons: cosmeReasons, link: "https://ec.europa.eu/growth/smes/cosme_en", maxFunding: "€4.2B total programme", nextDeadline: "Ongoing through EEN" });

  // LIFE Programme
  let lifeScore = 0;
  const lifeReasons: string[] = [];
  if (["green", "agriculture"].includes(answers.sector)) { lifeScore += 30; lifeReasons.push("Green/environmental sector match"); }
  if (answers.goal === "green") { lifeScore += 35; lifeReasons.push("Sustainability goal directly aligned"); }
  if (["prototype", "market"].includes(answers.innovation)) { lifeScore += 20; lifeReasons.push("Innovation readiness suitable"); }
  programmes.push({ name: "LIFE Programme", match: Math.min(lifeScore, 100), reasons: lifeReasons, link: "https://cinea.ec.europa.eu/programmes/life_en", maxFunding: "Up to 60% co-financing", nextDeadline: "Annual calls (Q2)" });

  // Cyprus Structural Funds
  let structuralScore = 20;
  const structuralReasons: string[] = ["Cyprus-registered SMEs are eligible"];
  if (["growth", "digital", "green"].includes(answers.goal)) { structuralScore += 25; structuralReasons.push("Goal aligns with national priorities"); }
  if (answers.age !== "pre") { structuralScore += 15; structuralReasons.push("Existing businesses preferred"); }
  if (["micro", "small"].includes(answers.size)) { structuralScore += 20; structuralReasons.push("Smaller SMEs prioritised"); }
  if (answers.turnover === "under500k" || answers.turnover === "500k-2m") { structuralScore += 10; structuralReasons.push("Lower turnover companies may receive higher co-financing"); }
  programmes.push({ name: "Cyprus Structural Funds", match: Math.min(structuralScore, 100), reasons: structuralReasons, link: "https://www.structuralfunds.org.cy", maxFunding: "Varies by call", nextDeadline: "Multiple calls annually" });

  // Erasmus for Young Entrepreneurs
  let erasmusScore = 0;
  const erasmusReasons: string[] = [];
  if (answers.age === "pre" || answers.age === "startup") { erasmusScore += 35; erasmusReasons.push("Designed for new entrepreneurs"); }
  if (["planning", "active"].includes(answers["cross-border"])) { erasmusScore += 25; erasmusReasons.push("Cross-border exchange is the core"); }
  if (answers.goal === "skills" || answers.goal === "expansion") { erasmusScore += 20; erasmusReasons.push("Learning and expansion goals match"); }
  if (answers.size === "micro") { erasmusScore += 15; erasmusReasons.push("Ideal for micro-enterprises"); }
  programmes.push({ name: "Erasmus for Young Entrepreneurs", match: Math.min(erasmusScore, 100), reasons: erasmusReasons, link: "https://www.erasmus-entrepreneurs.eu/", maxFunding: "€1,100/month (1-6 months)", nextDeadline: "Ongoing applications" });

  return programmes.sort((a, b) => b.match - a.match);
}

export function EUFundingEligibility() {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [completed, setCompleted] = useState(false);

  const q = questions[currentQ];
  const isAnswered = !!answers[q.id];

  const handleAnswer = (value: string) => {
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ((prev) => prev + 1);
    } else {
      setCompleted(true);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentQ(0);
    setCompleted(false);
  };

  if (completed) {
    const matches = calculateMatches(answers);
    const topMatches = matches.filter((m) => m.match >= 30);

    return (
      <div className="border border-border bg-card">
        <div className="px-5 py-4 border-b-2 border-foreground flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-lg text-foreground">Your Funding Matches</h3>
            <p className="text-xs text-muted-foreground mt-1">{topMatches.length} programmes matched your profile</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleReset} className="rounded-none gap-1.5 text-xs">
            <RotateCcw className="h-3 w-3" /> Retake
          </Button>
        </div>

        <div className="divide-y divide-border">
          {matches.map((prog, i) => {
            const matchColor = prog.match >= 70 ? "text-success" : prog.match >= 40 ? "text-secondary" : "text-muted-foreground";
            const matchBg = prog.match >= 70 ? "bg-success/10 border-success/30" : prog.match >= 40 ? "bg-secondary/10 border-secondary/30" : "bg-muted border-border";

            return (
              <div key={i} className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`rounded-none text-[10px] uppercase tracking-wider ${matchBg} ${matchColor} font-bold`}>
                        {prog.match}% match
                      </Badge>
                      {i === 0 && prog.match >= 50 && (
                        <Badge className="rounded-none bg-secondary/10 text-secondary text-[10px] uppercase tracking-wider border border-secondary/30">
                          <Sparkles className="h-3 w-3 mr-1" /> Best Match
                        </Badge>
                      )}
                    </div>
                    <h4 className="font-serif font-bold text-foreground">{prog.name}</h4>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Euro className="h-3 w-3" />{prog.maxFunding}</span>
                  <span>Deadline: {prog.nextDeadline}</span>
                </div>

                {prog.reasons.length > 0 && (
                  <ul className="space-y-1 mb-3">
                    {prog.reasons.map((r, j) => (
                      <li key={j} className="flex items-center gap-2 text-xs text-foreground">
                        <CheckCircle2 className="h-3 w-3 text-success shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                )}

                <a
                  href={prog.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary hover:underline"
                >
                  Learn More & Apply <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border bg-card">
      <div className="px-5 py-4 border-b-2 border-foreground">
        <h3 className="font-serif font-bold text-lg text-foreground">EU Funding Eligibility Scorer</h3>
        <p className="text-xs text-muted-foreground mt-1">Answer {questions.length} questions to find your best-matched EU programmes</p>
      </div>

      {/* Progress */}
      <div className="px-5 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-border overflow-hidden">
            <div
              className="h-full bg-secondary transition-all duration-300"
              style={{ width: `${((currentQ + (isAnswered ? 1 : 0)) / questions.length) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground font-semibold">
            {currentQ + 1}/{questions.length}
          </span>
        </div>
      </div>

      <div className="p-5">
        <p className="text-sm font-semibold text-foreground mb-4">
          {currentQ + 1}. {q.question}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
          {q.options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleAnswer(opt.value)}
              className={`text-left px-4 py-3 text-sm transition-all border ${
                answers[q.id] === opt.value
                  ? "bg-foreground text-background border-foreground"
                  : "bg-transparent text-foreground border-border hover:border-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentQ((prev) => prev - 1)}
            disabled={currentQ === 0}
            className="rounded-none gap-1.5 text-xs"
          >
            <ArrowLeft className="h-3 w-3" /> Previous
          </Button>
          <Button
            size="sm"
            onClick={handleNext}
            disabled={!isAnswered}
            className="rounded-none gap-1.5 text-xs bg-foreground text-background hover:bg-foreground/90"
          >
            {currentQ === questions.length - 1 ? "See Matches" : "Next"} <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
