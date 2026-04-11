import { Link } from "react-router-dom";
import { ArrowRight, Zap, Target, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface IntelligenceCardProps {
  category: string;
  date: string;
  whatHappened: string;
  whyItMatters: string;
  whatToDo: string;
  hub?: "businesshub" | "fintechhub" | "compliancehub";
  linkedPerson?: {
    name: string;
    title: string;
    image: string;
  };
  href?: string;
}

const hubColors: Record<string, { badge: string; accent: string }> = {
  businesshub: { badge: "bg-secondary/15 text-secondary border-secondary/20", accent: "text-secondary" },
  fintechhub: { badge: "bg-fintech/15 text-fintech border-fintech/20", accent: "text-fintech" },
  compliancehub: { badge: "bg-compliance/15 text-compliance border-compliance/20", accent: "text-compliance" },
};

const sections = [
  { key: "whatHappened", icon: Zap, label: "What happened", color: "text-secondary" },
  { key: "whyItMatters", icon: Target, label: "Why it matters", color: "text-destructive" },
  { key: "whatToDo", icon: Lightbulb, label: "What to do", color: "text-success" },
] as const;

export function IntelligenceCard({
  category,
  date,
  whatHappened,
  whyItMatters,
  whatToDo,
  hub = "businesshub",
  linkedPerson,
  href = "#",
}: IntelligenceCardProps) {
  const colors = hubColors[hub];
  const content: Record<string, string> = { whatHappened, whyItMatters, whatToDo };

  return (
    <article className="rounded-xl border border-border bg-card overflow-hidden group hover:border-secondary/40 transition-colors">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <Badge variant="outline" className={`text-xs font-medium ${colors.badge}`}>
          {category}
        </Badge>
        <span className="text-xs text-muted-foreground">{date}</span>
      </div>

      {/* Intelligence Sections */}
      <div className="divide-y divide-border">
        {sections.map(({ key, icon: Icon, label, color }) => (
          <div key={key} className="px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`h-3.5 w-3.5 ${color}`} />
              <span className={`text-xs font-semibold uppercase tracking-wider ${color}`}>
                {label}
              </span>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed">
              {content[key]}
            </p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 bg-muted/30 flex items-center justify-between">
        {linkedPerson ? (
          <div className="flex items-center gap-2.5">
            <img
              src={linkedPerson.image}
              alt={linkedPerson.name}
              className="w-7 h-7 rounded-full object-cover ring-1 ring-border"
            />
            <div>
              <p className="text-xs font-medium text-foreground">{linkedPerson.name}</p>
              <p className="text-[10px] text-muted-foreground">{linkedPerson.title}</p>
            </div>
          </div>
        ) : (
          <div />
        )}
        <Link
          to={href}
          className={`inline-flex items-center gap-1 text-xs font-medium ${colors.accent} hover:opacity-80 transition-opacity group/link`}
        >
          Full analysis
          <ArrowRight className="h-3 w-3 group-hover/link:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </article>
  );
}
