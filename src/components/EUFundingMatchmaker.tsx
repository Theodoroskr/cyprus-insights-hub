import { useState } from "react";
import { Euro, Building2, Users, ChevronRight, Check, FileText, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const industries = [
  { value: "technology", label: "Technology & Digital" },
  { value: "tourism", label: "Tourism & Hospitality" },
  { value: "energy", label: "Energy & Environment" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "agriculture", label: "Agriculture & Food" },
  { value: "healthcare", label: "Healthcare & Biotech" },
  { value: "finance", label: "Financial Services" },
  { value: "construction", label: "Construction & Real Estate" },
];

const companySizes = [
  { value: "startup", label: "Startup", description: "< 10 employees" },
  { value: "sme", label: "SME", description: "10-250 employees" },
  { value: "enterprise", label: "Enterprise", description: "250+ employees" },
];

interface Grant {
  id: string;
  name: string;
  amount: string;
  deadline: string;
  matchScore: number;
  description: string;
}

const mockGrants: Grant[] = [
  {
    id: "1",
    name: "Digital Transformation Fund",
    amount: "€50,000 - €200,000",
    deadline: "March 2024",
    matchScore: 95,
    description: "For SMEs adopting digital technologies and AI solutions",
  },
  {
    id: "2",
    name: "Green Innovation Grant",
    amount: "€100,000 - €500,000",
    deadline: "April 2024",
    matchScore: 87,
    description: "Supporting sustainable business practices and renewable energy adoption",
  },
  {
    id: "3",
    name: "Research & Development Fund",
    amount: "€75,000 - €300,000",
    deadline: "May 2024",
    matchScore: 78,
    description: "Co-financing for R&D activities and innovation projects",
  },
];

export function EUFundingMatchmaker() {
  const [step, setStep] = useState(1);
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [showResults, setShowResults] = useState(false);

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      setShowResults(true);
    }
  };

  const handleBack = () => {
    if (showResults) {
      setShowResults(false);
    } else if (step > 1) {
      setStep(step - 1);
    }
  };

  const resetWizard = () => {
    setStep(1);
    setIndustry("");
    setCompanySize("");
    setShowResults(false);
  };

  return (
    <section id="funding" className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg gold-gradient flex items-center justify-center">
            <Euro className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-primary">EU Funding Matchmaker</h2>
            <p className="text-muted-foreground text-sm">Find grants that match your business profile</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {!showResults ? (
            <div className="bento-card-highlight">
              {/* Progress Steps */}
              <div className="flex items-center justify-center mb-8">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                        step >= s
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {step > s ? <Check className="h-5 w-5" /> : s}
                    </div>
                    {s < 3 && (
                      <div
                        className={`w-16 sm:w-24 h-1 mx-2 rounded transition-all ${
                          step > s ? "bg-secondary" : "bg-muted"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Step Content */}
              <div className="min-h-[200px] flex flex-col items-center justify-center">
                {step === 1 && (
                  <div className="w-full max-w-md animate-fade-in">
                    <div className="text-center mb-6">
                      <Building2 className="h-12 w-12 mx-auto text-secondary mb-3" />
                      <h3 className="text-xl font-semibold text-primary mb-2">Select Your Industry</h3>
                      <p className="text-muted-foreground text-sm">Choose the industry that best describes your business</p>
                    </div>
                    <Select value={industry} onValueChange={setIndustry}>
                      <SelectTrigger className="w-full h-12">
                        <SelectValue placeholder="Choose an industry..." />
                      </SelectTrigger>
                      <SelectContent className="bg-card z-50">
                        {industries.map((ind) => (
                          <SelectItem key={ind.value} value={ind.value}>
                            {ind.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {step === 2 && (
                  <div className="w-full max-w-lg animate-fade-in">
                    <div className="text-center mb-6">
                      <Users className="h-12 w-12 mx-auto text-secondary mb-3" />
                      <h3 className="text-xl font-semibold text-primary mb-2">Company Size</h3>
                      <p className="text-muted-foreground text-sm">Select your company size category</p>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                      {companySizes.map((size) => (
                        <button
                          key={size.value}
                          onClick={() => setCompanySize(size.value)}
                          className={`p-4 rounded-xl border-2 transition-all text-left ${
                            companySize === size.value
                              ? "border-secondary bg-secondary/10"
                              : "border-border hover:border-secondary/50"
                          }`}
                        >
                          <p className="font-semibold text-primary">{size.label}</p>
                          <p className="text-xs text-muted-foreground mt-1">{size.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="w-full max-w-md animate-fade-in text-center">
                    <div className="w-16 h-16 mx-auto rounded-full bg-secondary/20 flex items-center justify-center mb-4">
                      <Check className="h-8 w-8 text-secondary" />
                    </div>
                    <h3 className="text-xl font-semibold text-primary mb-2">Ready to Match!</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      We'll find the best EU funding opportunities for your{" "}
                      <span className="text-secondary font-medium">{companySize}</span> in the{" "}
                      <span className="text-secondary font-medium">
                        {industries.find((i) => i.value === industry)?.label}
                      </span>{" "}
                      sector.
                    </p>
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t border-border">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  disabled={step === 1}
                >
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={(step === 1 && !industry) || (step === 2 && !companySize)}
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                >
                  {step === 3 ? "Find Matching Grants" : "Continue"}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in">
              {/* Results Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-primary">Matching Grants</h3>
                  <p className="text-muted-foreground text-sm">
                    Found {mockGrants.length} grants matching your profile
                  </p>
                </div>
                <Button variant="outline" onClick={resetWizard}>
                  Start Over
                </Button>
              </div>

              {/* Grant Cards */}
              <div className="grid gap-4">
                {mockGrants.map((grant, index) => (
                  <div
                    key={grant.id}
                    className="bento-card hover:border-secondary/40 animate-slide-in-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-primary">{grant.name}</h4>
                          <Badge
                            className={`${
                              grant.matchScore >= 90
                                ? "bg-success text-success-foreground"
                                : grant.matchScore >= 80
                                ? "bg-secondary text-secondary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {grant.matchScore}% Match
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{grant.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Euro className="h-4 w-4 text-secondary" />
                            <span className="font-medium">{grant.amount}</span>
                          </span>
                          <span className="text-muted-foreground">Deadline: {grant.deadline}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                          <FileText className="mr-2 h-4 w-4" />
                          Apply
                        </Button>
                        <Button size="sm" variant="outline">
                          <UserPlus className="mr-2 h-4 w-4" />
                          Find Consultant
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
