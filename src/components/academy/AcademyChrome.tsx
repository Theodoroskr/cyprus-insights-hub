import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { T, type Lang } from "@/lib/academy";

export function LangSwitch({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div role="group" aria-label="Language / Γλώσσα" className="inline-flex rounded-md border p-0.5">
      {(["en", "el"] as const).map((l) => (
        <Button key={l} size="sm" variant={lang === l ? "default" : "ghost"} className="h-7 px-3" aria-pressed={lang === l} onClick={() => setLang(l)}>{l === "en" ? "English" : "Ελληνικά"}</Button>
      ))}
    </div>
  );
}

export function AcademyCrumbs({ lang, items }: { lang: Lang; items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
      <GraduationCap className="h-4 w-4" aria-hidden />
      <Link to="/financial-literacy" className="hover:underline">{lang === "el" ? "Χρηματοοικονομικός Αλφαβητισμός" : "Financial Literacy"}</Link>
      <span aria-hidden>/</span>
      <Link to="/financial-literacy/academy" className="hover:underline">{T.academy[lang]}</Link>
      {items.map((i) => <span key={i.label} className="flex items-center gap-1.5"><span aria-hidden>/</span>{i.to ? <Link to={i.to} className="hover:underline">{i.label}</Link> : <span className="text-foreground">{i.label}</span>}</span>)}
    </nav>
  );
}
