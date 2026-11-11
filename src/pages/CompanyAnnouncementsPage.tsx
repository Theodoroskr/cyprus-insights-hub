import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Megaphone, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnnouncementCard } from "@/components/announcements/AnnouncementCard";
import { useAcademyLang } from "@/lib/academy";
import { type Announcement, type Section, CY_TAG_LABEL, DEAL_TYPE_KEYS, LISTED_TYPE_KEYS, STAGE_LABEL, TYPE_LABEL, announcementDate, t } from "@/lib/announcements";

const DATE_WINDOWS: Record<string, number | null> = { any: null, d30: 30, d90: 90, d365: 365 };

export default function CompanyAnnouncementsPage() {
  const [params, setParams] = useSearchParams();
  const tab: Section = params.get("tab") === "deals" ? "deals" : "listed";
  const [lang, setLang] = useAcademyLang();
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [sector, setSector] = useState("all");
  const [stage, setStage] = useState("all");
  const [cyTag, setCyTag] = useState("all");
  const [win, setWin] = useState("any");

  const { data = [], isLoading } = useQuery({
    queryKey: ["company-announcements", tab],
    queryFn: async () => {
      const { data, error } = await supabase.from("company_announcements").select("*").eq("section", tab).eq("status", "published")
        .order("source_published_at", { ascending: false, nullsFirst: false }).limit(500);
      if (error) throw error;
      return (data ?? []) as unknown as Announcement[];
    },
  });

  const sectors = useMemo(() => [...new Set(data.map((a) => a.sector).filter(Boolean) as string[])].sort(), [data]);
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const days = DATE_WINDOWS[win];
    const since = days ? Date.now() - days * 86400000 : null;
    return data.filter((a) =>
      (!needle || [a.company_name, a.buyer ?? "", ...a.investors, a.title].some((s) => s.toLowerCase().includes(needle))) &&
      (type === "all" || a.announcement_type === type) &&
      (sector === "all" || a.sector === sector) &&
      (tab !== "deals" || stage === "all" || a.deal_stage === stage) &&
      (tab !== "deals" || cyTag === "all" || a.cyprus_tags.includes(cyTag)) &&
      (!since || Date.parse(announcementDate(a)) >= since),
    ).sort((x, y) => Date.parse(announcementDate(y)) - Date.parse(announcementDate(x)));
  }, [data, q, type, sector, stage, cyTag, win, tab]);

  const switchTab = (s: Section) => { setType("all"); setStage("all"); setCyTag("all"); setParams(s === "deals" ? { tab: "deals" } : {}); };
  const typeKeys = tab === "deals" ? DEAL_TYPE_KEYS : LISTED_TYPE_KEYS;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={tab === "deals" ? "Funding & Investment Deals in Cyprus" : "Company Announcements — Cyprus-listed company disclosures"}
        description="Official disclosures from Cyprus Stock Exchange companies — results, dividends, buybacks, shareholdings, acquisitions and board changes — plus funding and investment deals in Cyprus, each linked to its source."
        path="/company-announcements" />
      <TopNavigation onSearch={() => {}} />
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-10">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3">
                <Megaphone className="h-6 w-6 text-secondary" />
                <h1 className="text-3xl font-serif font-bold text-foreground">{t("pageTitle", lang)}</h1>
              </div>
              <p className="text-muted-foreground mt-2 max-w-2xl">{t("intro", lang)}</p>
            </div>
            <div className="flex gap-1 border border-border rounded-md p-0.5" role="group" aria-label="Language">
              {(["en", "el"] as const).map((l) => <Button key={l} size="sm" variant={lang === l ? "default" : "ghost"} className="h-7 px-2.5" onClick={() => setLang(l)}>{l === "en" ? "EN" : "ΕΛ"}</Button>)}
            </div>
          </div>
          <div role="tablist" className="flex flex-wrap gap-2 mt-6">
            {(["listed", "deals"] as Section[]).map((s) => (
              <Button key={s} role="tab" aria-selected={tab === s} size="sm" variant={tab === s ? "default" : "outline"} onClick={() => switchTab(s)}>{t(s, lang)}</Button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto] mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder={t("search", lang)} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t("search", lang)} />
          </div>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="md:w-48" aria-label="Type"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">{t("allTypes", lang)}</SelectItem>{typeKeys.map((k) => <SelectItem key={k} value={k}>{TYPE_LABEL[k][lang]}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={sector} onValueChange={setSector}>
            <SelectTrigger className="md:w-44" aria-label="Sector"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">{t("allSectors", lang)}</SelectItem>{sectors.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={win} onValueChange={setWin}>
            <SelectTrigger className="md:w-44" aria-label="Date"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.keys(DATE_WINDOWS).map((k) => <SelectItem key={k} value={k}>{t(k === "any" ? "anyDate" : k, lang)}</SelectItem>)}</SelectContent>
          </Select>
          {tab === "deals" && (
            <>
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger aria-label="Stage"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">{t("allStages", lang)}</SelectItem>{Object.keys(STAGE_LABEL).map((k) => <SelectItem key={k} value={k}>{STAGE_LABEL[k][lang]}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={cyTag} onValueChange={setCyTag}>
                <SelectTrigger aria-label="Cyprus connection"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">{t("allTags", lang)}</SelectItem>{Object.keys(CY_TAG_LABEL).map((k) => <SelectItem key={k} value={k}>{CY_TAG_LABEL[k][lang]}</SelectItem>)}</SelectContent>
              </Select>
            </>
          )}
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />)}</div>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground py-16 text-center">{t("none", lang)}</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">{rows.map((a) => <AnnouncementCard key={a.id} a={a} lang={lang} />)}</div>
        )}
        <p className="text-xs text-muted-foreground mt-8">{t("summaryNote", lang)}</p>
      </div>
      <Footer />
    </div>
  );
}
