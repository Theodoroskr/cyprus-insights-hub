import { Lang } from "@/lib/mastercard";
import { Button } from "@/components/ui/button";

export function LangToggle({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="inline-flex border rounded-md p-0.5" role="group" aria-label="Language">
      {(["en", "el"] as Lang[]).map((l) => (
        <Button key={l} size="sm" variant={lang === l ? "default" : "ghost"} className="h-7 px-3" onClick={() => onChange(l)} aria-pressed={lang === l}>
          {l === "en" ? "EN" : "ΕΛ"}
        </Button>
      ))}
    </div>
  );
}
