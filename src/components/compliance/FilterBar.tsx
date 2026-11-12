import { useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Lang } from "@/lib/academy";
import { ct } from "@/lib/compliance";

export interface FilterDef { key: string; allLabel: string; options: { value: string; label: string }[] }

/** URL-backed filters so a filtered view can be shared. */
export function useUrlFilters() {
  const [params, setParams] = useSearchParams();
  const get = (k: string) => params.get(k) ?? "";
  const set = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next, { replace: true });
  };
  const clear = (keep: string[] = []) => {
    const next = new URLSearchParams();
    keep.forEach((k) => params.get(k) && next.set(k, params.get(k)!));
    setParams(next, { replace: true });
  };
  return { get, set, clear, params };
}

export function FilterBar({ lang, filters, search = true, extra, keep = [] }: { lang: Lang; filters: FilterDef[]; search?: boolean; extra?: React.ReactNode; keep?: string[] }) {
  const { get, set, clear, params } = useUrlFilters();
  const active = [...params.keys()].some((k) => !keep.includes(k));
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {search && (
        <div className="relative w-full sm:w-64">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={get("q")} onChange={(e) => set("q", e.target.value)} placeholder={ct("Search", lang)} className="pl-8 h-9 rounded-none" aria-label={ct("Search", lang)} />
        </div>
      )}
      {filters.map((f) => (
        <select key={f.key} value={get(f.key)} onChange={(e) => set(f.key, e.target.value)} aria-label={ct(f.allLabel, lang)}
          className="h-9 border border-input bg-background px-2 text-sm rounded-none max-w-[14rem]">
          <option value="">{ct(f.allLabel, lang)}</option>
          {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ))}
      {extra}
      {active && <Button variant="ghost" size="sm" onClick={() => clear(keep)} className="gap-1 text-xs"><X className="h-3 w-3" />{ct("Clear filters", lang)}</Button>}
    </div>
  );
}

export const uniqueOptions = (values: (string | null | undefined)[], labelFor: (v: string) => string = (v) => v) =>
  [...new Set(values.filter((v): v is string => !!v))].sort().map((v) => ({ value: v, label: labelFor(v) }));
