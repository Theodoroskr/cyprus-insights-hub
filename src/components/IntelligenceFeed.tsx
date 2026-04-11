import { IntelligenceCard } from "@/components/IntelligenceCard";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

const intelligenceItems = [
  {
    category: "Regulation",
    date: "2 hours ago",
    whatHappened:
      "CySEC issued a new circular mandating enhanced transaction monitoring for all regulated investment firms, effective Q1 2026.",
    whyItMatters:
      "Firms with inadequate systems face fines up to €500K. Smaller IFs may struggle with implementation costs and tight timelines.",
    whatToDo:
      "Audit your current monitoring stack against the circular's 14-point checklist. Engage compliance counsel before the 90-day deadline.",
    hub: "compliancehub" as const,
    linkedPerson: {
      name: "Elena Papadopoulou",
      title: "Chair, CySEC",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&q=80",
    },
  },
  {
    category: "FinTech",
    date: "5 hours ago",
    whatHappened:
      "Cyprus-based neobank Dize secured €12M Series A funding led by Target Global, marking the island's largest fintech round in 2025.",
    whyItMatters:
      "Signals growing investor confidence in Cyprus as a fintech hub. Could accelerate talent migration and attract more VCs to the ecosystem.",
    whatToDo:
      "FinTech founders should study Dize's regulatory sandbox strategy. Investors should watch for follow-on deals in payments and embedded finance.",
    hub: "fintechhub" as const,
    linkedPerson: {
      name: "Andreas Michaelides",
      title: "Managing Partner, Target Global",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80",
    },
  },
  {
    category: "Policy",
    date: "Yesterday",
    whatHappened:
      "The Cabinet approved a new corporate tax incentive package offering 50% tax credits to tech companies relocating their EU headquarters to Cyprus.",
    whyItMatters:
      "Positions Cyprus competitively against Ireland and Malta. Could reshape the island's economic profile within 3–5 years.",
    whatToDo:
      "Eligible firms should file pre-registration with the Ministry of Finance by December 2025. Consult tax advisors on IP box regime synergies.",
    hub: "businesshub" as const,
    linkedPerson: {
      name: "Christos Patsalides",
      title: "Governor, Central Bank of Cyprus",
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&q=80",
    },
  },
];

export function IntelligenceFeed() {
  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-primary">Intelligence Briefings</h2>
            <p className="text-muted-foreground text-sm">
              Structured analysis — what happened, why it matters, what to do
            </p>
          </div>
          <Button variant="outline" size="sm" className="hidden sm:flex">
            All Briefings
            <ExternalLink className="ml-2 h-3 w-3" />
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {intelligenceItems.map((item, index) => (
            <IntelligenceCard key={index} {...item} />
          ))}
        </div>
      </div>
    </section>
  );
}
