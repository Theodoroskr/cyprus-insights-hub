import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FundingCard, type CallCardData } from "@/components/funding/FundingCard";
import { FundingGate } from "@/components/funding/FundingGate";
import {
  APPLICANTS, GEOGRAPHY, INSTRUMENTS, SECTORS, VIEWS, PREVIEW_LIMIT, deadlineCutoff, lbl, readFilters, type Lang,
} from "@/lib/funding";

const PAGE = 30;
const COLS = "slug,title_en,title_el,issuer,programme,call_reference,eligibility_summary,instrument_type,sectors,deadline_date,deadline_time,application_url,official_url,total_budget_eur";
const today = () => new Date().toISOString().slice(0, 10);
const clean = (s: string) => s.replace(/[%,()*\\]/g, " ").trim().slice(0, 80);

export default function FundingPage() {
  const [sp, setSp] = useSearchParams();
  const { user, loading } = useAuth();
  const lang: Lang = sp.get("lang") === "el" ? "el" : "en";
  const f = readFilters(sp);
  const set = (k: string, v: string) => { const n = new URLSearchParams(sp); if (v) n.set(k, v); else n.delete(k); setSp(n, { replace: true }); };
  const t = (en: string, el: string) => (lang === "el" ? el : en);

  const preview = useQuery({
    queryKey: ["funding-preview"],
    enabled: !loading && !user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_funding_preview");
      if (error) throw error;
      return (data ?? []).slice(0, PREVIEW_LIMIT) as CallCardData[];
    },
  });

  const programmes = useQuery({
    queryKey: ["funding-programmes", user?.id],
    enabled: !!user,
    staleTime: 3600_000,
    queryFn: async () => {
      const { data } = await supabase.from("funding_calls").select("programme").eq("status", "verified").neq("call_state", "closed").limit(2000);
      const counts = new Map<string, number>();
      for (const r of data ?? []) if (r.programme) counts.set(r.programme, (counts.get(r.programme) ?? 0) + 1);
      return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([p]) => p);
    },
  });

  const list = useInfiniteQuery({
    queryKey: ["funding-calls", user?.id, f],
    enabled: !!user,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      let q = supabase.from("funding_calls").select(COLS, { count: "exact" }).eq("status", "verified");
      const d = today();
      if (f.view === "closed") q = q.lt("deadline_date", d);
      else if (f.view === "upcoming") q = q.eq("call_state", "upcoming").or(`deadline_date.is.null,deadline_date.gte.${d}`);
      else if (f.view === "ongoing") q = q.eq("call_state", "ongoing");
      else q = q.eq("call_state", "open").gte("deadline_date", d);
      if (f.sector) q = q.contains("sectors", [f.sector]);
      if (f.applicant) q = q.contains("applicant_types", [f.applicant]);
      if (f.instrument) q = q.eq("instrument_type", f.instrument);
      if (f.geography) q = q.eq("geography", f.geography);
      if (f.programme) q = q.eq("programme", f.programme);
      const cut = deadlineCutoff(f.within);
      if (cut) q = q.lte("deadline_date", cut);
      const term = clean(f.q);
      if (term) q = q.or(`title_en.ilike.%${term}%,title_el.ilike.%${term}%,call_reference.ilike.%${term}%,issuer.ilike.%${term}%,programme.ilike.%${term}%`);
      q = f.view === "closed" ? q.order("deadline_date", { ascending: false }) : q.order("deadline_date", { ascending: true, nullsFirst: false });
      const { data, error, count } = await q.order("title_en").range(pageParam * PAGE, pageParam * PAGE + PAGE - 1);
      if (error) throw error;
      return { rows: (data ?? []) as CallCardData[], count: count ?? 0 };
    },
    getNextPageParam: (last, all) => (last.rows.length === PAGE ? all.length : undefined),
  });
  const rows = useMemo(() => list.data?.pages.flatMap((p) => p.rows) ?? [], [list.data]);
  const total = list.data?.pages[0]?.count ?? 0;

  const select = (key: string, value: string, map: Record<string, { en: string; el: string }> | string[], label: string) => (
    <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {label}
      <select value={value} onChange={(e) => set(key, e.target.value)} className="h-10 rounded-md border border-input bg-background px-2 text-sm font-normal normal-case tracking-normal text-foreground">
        <option value="">{t("All", "Όλα")}</option>
        {Array.isArray(map) ? map.map((p) => <option key={p} value={p}>{p}</option>)
          : Object.keys(map).map((k) => <option key={k} value={k}>{map[k][lang]}</option>)}
      </select>
    </label>
  );

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={t("Funding & Subsidies in Cyprus — Grants, Vouchers and EU Calls", "Χρηματοδοτήσεις & Χορηγίες στην Κύπρο")}
        description="Verified national and EU funding calls open to applicants in Cyprus: grants, subsidies and vouchers from RIF, ministries and the European Commission, with deadlines and official application links."
        path="/funding"
      />
      <TopNavigation />
      <main className="max-w-[1200px] mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b-4 border-foreground pb-5 mb-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary">{t("Funding & Subsidies", "Χρηματοδοτήσεις & Χορηγίες")}</p>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mt-1">
              {f.sector === "tourism" ? t("Funding for tourism & hospitality", "Χρηματοδοτήσεις για τουρισμό & φιλοξενία") : t("Funding opportunities in Cyprus", "Ευκαιρίες χρηματοδότησης στην Κύπρο")}
            </h1>
            <p className="text-muted-foreground mt-2 max-w-3xl">
              {t("National and EU calls open to applicants in Cyprus. Every opportunity is checked against the issuer's official call documents and links straight to the official application.",
                 "Εθνικές και ευρωπαϊκές προσκλήσεις ανοικτές σε αιτητές στην Κύπρο. Κάθε ευκαιρία ελέγχεται με τα επίσημα έγγραφα της πρόσκλησης και οδηγεί απευθείας στην επίσημη αίτηση.")}
            </p>
          </div>
          <div className="inline-flex rounded-md border border-border p-0.5">
            {(["en", "el"] as Lang[]).map((l) => (
              <button key={l} onClick={() => set("lang", l === "en" ? "" : "el")} className={`px-3 py-1.5 text-sm rounded ${lang === l ? "bg-primary text-primary-foreground" : "text-foreground"}`}>
                {l === "en" ? "English" : "Ελληνικά"}
              </button>
            ))}
          </div>
        </div>

        {!user ? (
          <>
            <h2 className="font-serif text-xl font-bold mb-4">{t("Open now: three verified calls", "Ανοικτές τώρα: τρεις επιβεβαιωμένες προσκλήσεις")}</h2>
            <div className="grid md:grid-cols-3 gap-5 mb-8">
              {(preview.data ?? []).map((c) => <FundingCard key={c.slug ?? c.title_en} c={c} lang={lang} preview />)}
              {preview.isLoading && [0, 1, 2].map((i) => <div key={i} className="h-56 rounded-lg bg-muted animate-pulse" />)}
            </div>
            <FundingGate lang={lang} />
          </>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mb-4" role="tablist">
              {(Object.keys(VIEWS) as (keyof typeof VIEWS)[]).map((v) => (
                <Button key={v} size="sm" variant={f.view === v ? "default" : "outline"} onClick={() => set("view", v === "open" ? "" : v)}>{VIEWS[v][lang]}</Button>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:col-span-2">
                {t("Search", "Αναζήτηση")}
                <div className="relative">
                  <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                  <Input defaultValue={f.q} onKeyDown={(e) => { if (e.key === "Enter") set("q", (e.target as HTMLInputElement).value); }} onBlur={(e) => set("q", e.target.value)}
                    placeholder={t("Title, call code, issuer or programme", "Τίτλος, κωδικός, φορέας ή πρόγραμμα")} className="pl-8 h-10 normal-case font-normal tracking-normal" />
                </div>
              </label>
              {select("sector", f.sector, SECTORS, t("Sector", "Τομέας"))}
              {select("applicant", f.applicant, APPLICANTS, t("Applicant", "Αιτητής"))}
              {select("type", f.instrument, INSTRUMENTS, t("Funding type", "Είδος"))}
              {select("geo", f.geography, GEOGRAPHY, t("Geography", "Γεωγραφία"))}
              {select("programme", f.programme, programmes.data ?? [], t("Programme", "Πρόγραμμα"))}
              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("Deadline", "Προθεσμία")}
                <select value={f.within} onChange={(e) => set("within", e.target.value)} className="h-10 rounded-md border border-input bg-background px-2 text-sm font-normal normal-case tracking-normal text-foreground">
                  <option value="">{t("Any", "Οποιαδήποτε")}</option>
                  <option value="30">{t("Within 30 days", "Εντός 30 ημερών")}</option>
                  <option value="90">{t("Within 90 days", "Εντός 90 ημερών")}</option>
                  <option value="180">{t("Within 6 months", "Εντός 6 μηνών")}</option>
                </select>
              </label>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              {list.isLoading ? t("Loading…", "Φόρτωση…") : t(`${total.toLocaleString("en-GB")} verified opportunities`, `${total.toLocaleString("el-GR")} επιβεβαιωμένες ευκαιρίες`)}
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {rows.map((c) => <FundingCard key={c.slug ?? c.title_en} c={c} lang={lang} />)}
            </div>
            {!list.isLoading && rows.length === 0 && (
              <p className="text-center text-muted-foreground py-12">{t("No verified calls match these filters.", "Καμία πρόσκληση δεν ταιριάζει με τα φίλτρα.")}</p>
            )}
            {list.hasNextPage && (
              <div className="text-center mt-8">
                <Button variant="outline" onClick={() => list.fetchNextPage()} disabled={list.isFetchingNextPage}>{t("Show more", "Περισσότερα")}</Button>
              </div>
            )}
          </>
        )}
        <p className="text-xs text-muted-foreground mt-10">
          {t("Sources: European Commission Funding & Tenders Portal, Research & Innovation Foundation, Cyprus ministries and funding bodies. Always confirm terms in the official call documents before applying.",
             "Πηγές: Πύλη Χρηματοδοτήσεων & Προσφορών της Ευρωπαϊκής Επιτροπής, Ίδρυμα Έρευνας και Καινοτομίας, υπουργεία και φορείς χρηματοδότησης. Επιβεβαιώνετε πάντα τους όρους στα επίσημα έγγραφα πριν την υποβολή.")}
        </p>
      </main>
      <Footer />
    </div>
  );
}
