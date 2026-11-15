import { SCOPES, type StoryScope } from "@/lib/storyOrigin";
import { cn } from "@/lib/utils";

export function ScopeToggle({ value, onChange, className }: { value: StoryScope; onChange: (s: StoryScope) => void; className?: string }) {
  return (
    <div role="radiogroup" aria-label="Local or international news" className={cn("inline-flex rounded-full border border-border bg-muted p-0.5", className)}>
      {SCOPES.map((s) => (
        <button key={s.key} type="button" role="radio" aria-checked={value === s.key} onClick={() => onChange(s.key)}
          className={cn("px-3 py-1 text-xs font-semibold rounded-full transition-colors",
            value === s.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
          {s.label}
        </button>
      ))}
    </div>
  );
}
