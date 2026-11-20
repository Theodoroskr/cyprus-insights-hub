import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { LoginModal } from "@/components/auth/LoginModal";
import { RETURN_KEY } from "@/lib/funding";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Bookmark, Trash2, BellRing, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FOCUS_LABELS, KIMDIS_SEARCH_URL, foldGreek, matchesSearch, type FocusCategory, type ProcurementKind, type SearchFilters } from "../../../supabase/functions/_shared/kimdis";
import { grHref } from "@/lib/edition";
import type { Lang } from "@/lib/greecePulse";

type Notice = {
  reference_number: string; kind: ProcurementKind; title: string; authority_name: string | null; notice_type: string | null; procedure_type: string | null;
  contract_type: string | null; published_at: string | null; deadline_at: string | null; value_without_vat: number | null; currency: string | null;
  cpv_codes: string[]; cpv_labels: string[]; focus: string[]; cancelled: boolean; superseded_by: string | null; amends_reference: string | null;
  winners: string[]; official_url: string; diavgeia_url: string | null; nuts_label: string | null;
};
type Saved = { id: string; name: string; filters: SearchFilters; daily_digest: boolean };

const PAGE = 60;
const COLS = "reference_number,kind,title,authority_name,notice_type,procedure_type,contract_type,published_at,deadline_at,value_without_vat,currency,cpv_codes,cpv_labels,focus,cancelled,superseded_by,amends_reference,winners,official_url,diavgeia_url,nuts_label";
const like = (s: string) => `%${foldGreek(s.trim()).replace(/[%_,()]/g, " ")}%`;

function useNotices(f: SearchFilters, limit: number) {
  return useQuery({
    queryKey: ["gr-procurement", f, limit],
    queryFn: async () => {
      const kind = f.kind ?? "tender";
      let q = supabase.from("gr_procurement_notices").select(COLS, { count: "exact" }).eq("kind", kind).is("superseded_by", null);
      if (kind === "tender") q = q.eq("cancelled", false).gt("deadline_at", new Date().toISOString());
      if (f.q) q = q.ilike("search_text", like(f.q));
      if (f.authority) q = q.ilike("authority_search", like(f.authority));
      if (f.focus) q = q.contains("focus", [f.focus]);
      if (f.minValue != null) q = q.gte("value_without_vat", f.minValue);
      if (f.maxValue != null) q = q.lte("value_without_vat", f.maxValue);
      if (f.from) q = q.gte("published_at", `${f.from}T00:00:00Z`);
      if (f.to) q = q.lte("published_at", `${f.to}T23:59:59Z`);
      q = kind === "tender" ? q.order("deadline_at", { ascending: true }) : q.order("published_at", { ascending: false });
      const { data, error, count } = await q.range(0, limit - 1);
      if (error) throw error;
      // Same rule as the daily digest, applied again in the browser.
      return { rows: ((data ?? []) as Notice[]).filter((n) => matchesSearch(n, f)), count: count ?? 0 };
    },
  });
}

const num = (s: string | null) => (s && s.trim() !== "" && Number.isFinite(Number(s)) ? Number(s) : null);
function filtersFrom(p: URLSearchParams): SearchFilters {
  return {
    kind: p.get("tab") === "awards" ? "award" : "tender", q: p.get("q") ?? "", authority: p.get("authority") ?? "",
    focus: (p.get("focus") as FocusCategory) || "", minValue: num(p.get("min")), maxValue: num(p.get("max")), from: p.get("from"), to: p.get("to"),
  };
}
function paramsFrom(f: SearchFilters): Record<string, string> {
  const o: Record<string, string> = {};
  if (f.kind === "award") o.tab = "awards";
  if (f.q) o.q = f.q; if (f.authority) o.authority = f.authority; if (f.focus) o.focus = f.focus;
  if (f.minValue != null) o.min = String(f.minValue); if (f.maxValue != null) o.max = String(f.maxValue);
  if (f.from) o.from = f.from; if (f.to) o.to = f.to;
  return o;
}

export function Opportunities({ lang }: { lang: Lang }) {
  const el = lang === "el";
  const { user } = useAuth();
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const f = useMemo(() => filtersFrom(params), [params]);
  const [draft, setDraft] = useState(f);
  useEffect(() => setDraft(f), [f]);
  const [limit, setLimit] = useState(PAGE);
  const { data, isLoading, isError } = useNotices(f, limit);
  const NA = el ? "Μη διαθέσιμο" : "Unavailable";
  const dt = (d: string | null, time = false) => (d ? new Date(d).toLocaleString(el ? "el-GR" : "en-GB", time ? { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Athens" } : { dateStyle: "medium", timeZone: "Europe/Athens" }) : NA);
  const money = (v: number | null, cur: string | null) => (v == null ? NA : `${v.toLocaleString(el ? "el-GR" : "en-GB", { maximumFractionDigits: 2 })} ${cur ?? ""}`.trim() + (el ? " χωρίς ΦΠΑ" : " excl. VAT"));
  const apply = (next: SearchFilters) => { setLimit(PAGE); setParams(paramsFrom(next)); };

  const saved = useQuery({ queryKey: ["gr-saved", user?.id], enabled: !!user,
    queryFn: async () => ((await supabase.from("gr_procurement_saved_searches").select("id,name,filters,daily_digest").order("created_at")).data ?? []) as unknown as Saved[] });
  // ?saved=<id> (from a digest notification) opens that saved search.
  useEffect(() => {
    const id = params.get("saved"); const s = saved.data?.find((x) => x.id === id);
    if (s) setParams(paramsFrom(s.filters));
  }, [params, saved.data, setParams]);
  const [name, setName] = useState("");
  const save = async () => {
    if (!user || !name.trim()) return;
    const { error } = await supabase.from("gr_procurement_saved_searches").insert({ user_id: user.id, name: name.trim().slice(0, 120), filters: f as never, daily_digest: false });
    if (error) toast.error(error.message); else { toast.success(el ? "Η αναζήτηση αποθηκεύτηκε" : "Search saved"); setName(""); qc.invalidateQueries({ queryKey: ["gr-saved"] }); }
  };
  const setDigest = async (s: Saved, on: boolean) => {
    const { error } = await supabase.from("gr_procurement_saved_searches").update({ daily_digest: on }).eq("id", s.id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["gr-saved"] });
  };
  const remove = async (s: Saved) => { await supabase.from("gr_procurement_saved_searches").delete().eq("id", s.id); qc.invalidateQueries({ queryKey: ["gr-saved"] }); };

  const kind = f.kind ?? "tender";
  const loc = useLocation();
  const [login, setLogin] = useState(false);
  return <div lang={lang}>
    {login && <LoginModal isOpen onClose={() => setLogin(false)} defaultTab="register" />}
    <h1 className="font-serif text-3xl md:text-4xl font-bold">{el ? "Ευκαιρίες: δημόσιοι διαγωνισμοί" : "Greece Opportunities"}</h1>
    <p className="text-muted-foreground mt-2 max-w-3xl">{el
      ? "Δημόσιοι διαγωνισμοί και αναθέσεις από το επίσημο Κεντρικό Ηλεκτρονικό Μητρώο Δημοσίων Συμβάσεων (ΚΗΜΔΗΣ), για πληροφορική, κυβερνοασφάλεια, συμμόρφωση και επαγγελματικές υπηρεσίες. Ενημερώνεται καθημερινά."
      : "Greek public tenders and contract awards from the official KIMDIS procurement register, for IT, cybersecurity, compliance and professional services. Updated daily."}</p>

    <Tabs value={kind === "award" ? "awards" : "tenders"} onValueChange={(v) => apply({ ...f, kind: v === "awards" ? "award" : "tender" })} className="mt-6">
      <TabsList><TabsTrigger value="tenders">{el ? "Ανοιχτοί διαγωνισμοί" : "Open Tenders"}</TabsTrigger><TabsTrigger value="awards">{el ? "Αναθέσεις συμβάσεων" : "Contract Awards"}</TabsTrigger></TabsList>
    </Tabs>

    <form className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-4 p-4 border border-border rounded-lg bg-card" onSubmit={(e) => { e.preventDefault(); apply(draft); }}>
      <Input aria-label={el ? "Λέξη-κλειδί" : "Keyword"} placeholder={el ? "Λέξη-κλειδί στον τίτλο" : "Keyword in title"} value={draft.q ?? ""} onChange={(e) => setDraft({ ...draft, q: e.target.value })} />
      <Input aria-label={el ? "Αναθέτουσα αρχή" : "Contracting authority"} placeholder={el ? "Αναθέτουσα αρχή" : "Contracting authority"} value={draft.authority ?? ""} onChange={(e) => setDraft({ ...draft, authority: e.target.value })} />
      <Select value={draft.focus || "all"} onValueChange={(v) => setDraft({ ...draft, focus: v === "all" ? "" : (v as FocusCategory) })}>
        <SelectTrigger aria-label={el ? "Κατηγορία" : "Category"}><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="all">{el ? "Όλες οι κατηγορίες" : "All categories"}</SelectItem>
          {(Object.keys(FOCUS_LABELS) as FocusCategory[]).map((k) => <SelectItem key={k} value={k}>{FOCUS_LABELS[k][lang]}</SelectItem>)}</SelectContent>
      </Select>
      <div className="flex gap-2">
        <Input type="number" min={0} aria-label={el ? "Ελάχιστη αξία" : "Minimum value"} placeholder={el ? "Αξία από €" : "Value from €"} value={draft.minValue ?? ""} onChange={(e) => setDraft({ ...draft, minValue: num(e.target.value) })} />
        <Input type="number" min={0} aria-label={el ? "Μέγιστη αξία" : "Maximum value"} placeholder={el ? "έως €" : "to €"} value={draft.maxValue ?? ""} onChange={(e) => setDraft({ ...draft, maxValue: num(e.target.value) })} />
      </div>
      <label className="text-xs text-muted-foreground flex items-center gap-2">{el ? "Δημοσίευση από" : "Published from"}<Input type="date" value={draft.from ?? ""} onChange={(e) => setDraft({ ...draft, from: e.target.value || null })} /></label>
      <label className="text-xs text-muted-foreground flex items-center gap-2">{el ? "έως" : "to"}<Input type="date" value={draft.to ?? ""} onChange={(e) => setDraft({ ...draft, to: e.target.value || null })} /></label>
      <div className="flex gap-2 lg:col-span-2">
        <Button type="submit"><Search className="h-4 w-4 mr-1" />{el ? "Αναζήτηση" : "Search"}</Button>
        <Button type="button" variant="ghost" onClick={() => apply({ kind })}>{el ? "Καθαρισμός" : "Clear"}</Button>
      </div>
    </form>

    <div className="mt-3 p-3 border border-dashed border-border rounded-lg text-sm">
      {user ? <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Bookmark className="h-4 w-4" />
          <Input className="max-w-xs h-8" placeholder={el ? "Όνομα αναζήτησης" : "Name this search"} value={name} onChange={(e) => setName(e.target.value)} aria-label={el ? "Όνομα αναζήτησης" : "Name this search"} />
          <Button size="sm" variant="outline" disabled={!name.trim()} onClick={save}>{el ? "Αποθήκευση αναζήτησης" : "Save search"}</Button>
        </div>
        {(saved.data ?? []).length > 0 && <ul className="flex flex-wrap gap-2">{saved.data!.map((s) => (
          <li key={s.id} className="flex items-center gap-2 border border-border rounded-md px-2 py-1">
            <button className="underline" onClick={() => setParams(paramsFrom(s.filters))}>{s.name}</button>
            <label className="flex items-center gap-1 text-xs text-muted-foreground"><BellRing className="h-3 w-3" />{el ? "Ημερήσια ενημέρωση" : "Daily digest"}<Switch checked={s.daily_digest} onCheckedChange={(v) => setDigest(s, v)} aria-label={el ? "Ημερήσια ενημέρωση" : "Daily digest"} /></label>
            <button onClick={() => remove(s)} aria-label={el ? "Διαγραφή" : "Delete"}><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></button>
          </li>))}</ul>}
        <p className="text-xs text-muted-foreground">{el ? "Η ημερήσια ενημέρωση εμφανίζεται στις ειδοποιήσεις σας (καμπανάκι)." : "Daily digests arrive in your notifications (the bell)."}</p>
      </div> : <p className="text-muted-foreground"><button className="underline" onClick={() => { localStorage.setItem(RETURN_KEY, loc.pathname + loc.search); setLogin(true); }}>{el ? "Συνδεθείτε" : "Sign in"}</button> {el ? "για να αποθηκεύετε αναζητήσεις και να λαμβάνετε ημερήσια ενημέρωση." : "to save searches and get a daily digest."}</p>}
    </div>

    <p className="text-xs text-muted-foreground mt-4">{isLoading ? "…" : isError ? (el ? "Τα στοιχεία δεν φορτώθηκαν." : "Could not load notices.") : `${data?.count ?? 0} ${kind === "tender" ? (el ? "ανοιχτοί διαγωνισμοί" : "open tenders") : (el ? "αναθέσεις" : "contract awards")}`}</p>
    <ul className="divide-y divide-border mt-2">{(data?.rows ?? []).map((n) => (
      <li key={n.reference_number} className="py-4">
        <div className="flex flex-wrap gap-1.5 mb-1">
          {n.focus.map((x) => <Badge key={x} variant="outline" className="text-[10px]">{FOCUS_LABELS[x as FocusCategory]?.[lang] ?? x}</Badge>)}
          {n.amends_reference && <Badge variant="secondary" className="text-[10px]">{el ? "Τροποποίηση" : "Amended"}</Badge>}
          {n.cancelled && <Badge variant="destructive" className="text-[10px]">{el ? "Ματαιώθηκε" : "Cancelled"}</Badge>}
        </div>
        <a href={n.official_url} target="_blank" rel="noopener noreferrer" lang="el" className="font-serif font-semibold text-lg hover:underline break-words">{n.title}</a>
        <dl className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-1 text-sm mt-2">
          <div><dt className="text-xs text-muted-foreground">{el ? "Αναθέτουσα αρχή" : "Contracting authority"}</dt><dd lang="el">{n.authority_name ?? NA}</dd></div>
          <div><dt className="text-xs text-muted-foreground">{el ? "Δημοσίευση" : "Published"}</dt><dd>{dt(n.published_at)}</dd></div>
          {kind === "tender"
            ? <div><dt className="text-xs text-muted-foreground">{el ? "Προθεσμία υποβολής" : "Submission deadline"}</dt><dd className="font-medium">{dt(n.deadline_at, true)}</dd></div>
            : <div><dt className="text-xs text-muted-foreground">{el ? "Ανάδοχος" : "Awarded to"}</dt><dd lang="el">{n.winners.length ? n.winners.join(", ") : NA}</dd></div>}
          <div><dt className="text-xs text-muted-foreground">{el ? "Αξία" : "Value"}</dt><dd>{money(n.value_without_vat, n.currency)}</dd></div>
          <div className="sm:col-span-2"><dt className="text-xs text-muted-foreground">{el ? "Κατηγορία (CPV)" : "Procurement category (CPV)"}</dt><dd lang="el" className="line-clamp-2">{n.cpv_codes.length ? n.cpv_codes.map((c, i) => `${c} ${n.cpv_labels[i] ?? ""}`.trim()).join(" · ") : NA}</dd></div>
          <div><dt className="text-xs text-muted-foreground">{el ? "Διαδικασία" : "Procedure"}</dt><dd lang="el">{[n.notice_type, n.procedure_type].filter(Boolean).join(" · ") || NA}</dd></div>
          <div><dt className="text-xs text-muted-foreground">{el ? "Κωδικός ΑΔΑΜ" : "Reference (ADAM)"}</dt><dd className="font-mono text-xs">{n.reference_number}</dd></div>
        </dl>
        <p className="flex flex-wrap gap-4 text-xs mt-2">
          <a href={n.official_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline">{el ? "Επίσημο έγγραφο (ΚΗΜΔΗΣ)" : "Official notice (KIMDIS)"}<ExternalLink className="h-3 w-3" /></a>
          {n.diavgeia_url && <a href={n.diavgeia_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline">Διαύγεια<ExternalLink className="h-3 w-3" /></a>}
        </p>
      </li>))}</ul>
    {!isLoading && !data?.rows.length && <p className="border border-dashed border-border p-6 text-sm text-muted-foreground">{el ? "Δεν βρέθηκαν αποτελέσματα για αυτά τα φίλτρα." : "No notices match these filters."}</p>}
    {(data?.count ?? 0) > limit && <Button variant="outline" className="mt-4" onClick={() => setLimit(limit + PAGE)}>{el ? "Περισσότερα" : "Show more"}</Button>}
    <p className="text-xs text-muted-foreground mt-8 max-w-4xl">{el ? "Πηγή: ΚΗΜΔΗΣ Open Data API. Ελέγξτε πάντα το επίσημο έγγραφο πριν υποβάλετε προσφορά." : "Source: KIMDIS Open Data API. Always check the official notice before bidding."}{" "}
      <a href={KIMDIS_SEARCH_URL} target="_blank" rel="noopener noreferrer" className="underline">{el ? "Αναζήτηση στο ΚΗΜΔΗΣ" : "Official KIMDIS search"}</a> · <Link to={grHref("/greece/business-pulse")} className="underline">{el ? "Οικονομικοί Δείκτες Ελλάδας" : "Greece Business Pulse"}</Link></p>
  </div>;
}
