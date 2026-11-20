import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, endOfDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Copy, Download, Loader2, Mail, Plus, RefreshCw, X } from "lucide-react";
import {
  buildNewsletterHtml, defaultSubject, isInternational, liveBanners, pickStories,
  type NewsletterBanner, type NewsletterStory,
} from "@/lib/newsletter";

const SHARES = [
  { v: "1", label: "100% Cyprus" }, { v: "0.75", label: "75% Cyprus / 25% International" },
  { v: "0.5", label: "50% / 50%" },
];
const NONE = "none";

export function NewsletterPanel() {
  const [issue, setIssue] = useState(1);
  const [weekEnding, setWeekEnding] = useState(format(new Date(), "yyyy-MM-dd"));
  const [days, setDays] = useState(7);
  const [count, setCount] = useState(8);
  const [share, setShare] = useState("0.75");
  const [intro, setIntro] = useState("Good morning. Here is what mattered for Cyprus business this week, plus the international stories worth knowing about.");
  const [subject, setSubject] = useState("");
  const [subjectEdited, setSubjectEdited] = useState(false);
  const [selected, setSelected] = useState<string[] | null>(null);
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<"cyprus" | "international">("cyprus");
  const [bannerIds, setBannerIds] = useState<{ top: string; mid: string; footer: string } | null>(null);

  const to = endOfDay(new Date(weekEnding + "T12:00:00"));
  const from = subDays(to, days);

  const storiesQ = useQuery({
    queryKey: ["newsletter-stories", from.toISOString(), to.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase.from("cna_articles")
        .select("id,title,summary,what_happened,why_it_matters,image_url,vertical,tags,published_at")
        .eq("status", "published").contains("edition", ["cy"])
        .gte("published_at", from.toISOString()).lte("published_at", to.toISOString())
        .order("published_at", { ascending: false }).limit(600);
      if (error) throw error;
      const views: Record<string, number> = {};
      for (let page = 0; page < 20; page++) {
        const { data: rows, error: vErr } = await supabase.from("article_views").select("article_id")
          .gte("created_at", from.toISOString()).lte("created_at", to.toISOString())
          .range(page * 1000, page * 1000 + 999);
        if (vErr) break;
        for (const r of rows ?? []) views[r.article_id] = (views[r.article_id] ?? 0) + 1;
        if (!rows || rows.length < 1000) break;
      }
      return { stories: (data ?? []) as NewsletterStory[], views };
    },
  });

  const bannersQ = useQuery({
    queryKey: ["newsletter-banners"],
    queryFn: async () => {
      const { data, error } = await supabase.from("banner_placements")
        .select("id,name,slot_id,image_url,click_url,is_active,starts_at,ends_at").eq("is_active", true);
      if (error) throw error;
      return liveBanners((data ?? []) as NewsletterBanner[]);
    },
  });

  const stories = storiesQ.data?.stories ?? [];
  const views = storiesQ.data?.views ?? {};
  const byId = useMemo(() => new Map(stories.map((s) => [s.id, s])), [stories]);
  const banners = bannersQ.data ?? [];

  const autoPick = () => {
    const picked = pickStories(stories, views, count, Number(share));
    setSelected(picked.map((s) => s.id));
  };

  // First load (and after changing the week): pick automatically.
  useEffect(() => { if (storiesQ.data) autoPick(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [storiesQ.data]);
  useEffect(() => {
    if (bannerIds || !banners.length) return;
    setBannerIds({ top: banners[0]?.id ?? NONE, mid: banners[1]?.id ?? NONE, footer: banners[2]?.id ?? NONE });
  }, [banners, bannerIds]);

  const chosen = (selected ?? []).map((id) => byId.get(id)).filter(Boolean) as NewsletterStory[];
  // Same order the email uses: Cyprus first, then International.
  const ordered = [...chosen.filter((s) => !isInternational(s)), ...chosen.filter((s) => isInternational(s))];
  const nLocal = ordered.filter((s) => !isInternational(s)).length;
  const nIntl = ordered.length - nLocal;
  const bannerById = (id?: string) => banners.find((b) => b.id === id) ?? null;
  const campaign = `weekly-briefing-${weekEnding}`;
  const dateLabel = format(to, "EEEE d MMMM yyyy");
  const autoSubject = defaultSubject(issue, ordered[0]);
  const finalSubject = subjectEdited ? subject : autoSubject;

  const html = useMemo(() => buildNewsletterHtml({
    issue, dateLabel, campaign, intro, stories: ordered,
    banners: { top: bannerById(bannerIds?.top), mid: bannerById(bannerIds?.mid), footer: bannerById(bannerIds?.footer) },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [issue, dateLabel, campaign, intro, ordered.map((s) => s.id).join(), bannerIds, banners]);

  const move = (id: string, dir: -1 | 1) => {
    const group = ordered.filter((s) => isInternational(s) === isInternational(byId.get(id)!)).map((s) => s.id);
    const i = group.indexOf(id), j = i + dir;
    if (j < 0 || j >= group.length) return;
    [group[i], group[j]] = [group[j], group[i]];
    const other = ordered.filter((s) => isInternational(s) !== isInternational(byId.get(id)!)).map((s) => s.id);
    setSelected([...group, ...other]);
  };
  const remove = (id: string) => setSelected((cur) => (cur ?? []).filter((x) => x !== id));
  const add = (id: string) => setSelected((cur) => [...(cur ?? []), id]);

  const candidates = stories
    .filter((s) => !(selected ?? []).includes(s.id))
    .filter((s) => (scope === "international") === isInternational(s))
    .filter((s) => !search.trim() || s.title.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => (views[b.id] ?? 0) - (views[a.id] ?? 0))
    .slice(0, 40);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.write([new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([ordered.map((s) => s.title).join("\n")], { type: "text/plain" }),
      })]);
      toast.success("Copied — paste it straight into a new Gmail or Outlook email");
    } catch {
      await navigator.clipboard.writeText(html);
      toast.success("Copied the HTML code");
    }
  };
  const copyCode = async () => { await navigator.clipboard.writeText(html); toast.success("HTML code copied"); };
  const download = () => {
    const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    const a = document.createElement("a");
    a.href = url; a.download = `cyprus-business-briefing-${issue}-${weekEnding}.html`; a.click();
    URL.revokeObjectURL(url);
  };

  const target = Math.round(count * Number(share));

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <Mail className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Weekly briefing</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Picks the week's most-read Cyprus Edition stories and live banners, then builds the email. Copy it into Gmail or Outlook, or download the HTML for an email tool.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-xs font-medium text-muted-foreground space-y-1">Issue no.
            <Input type="number" min={1} value={issue} onChange={(e) => setIssue(Math.max(1, Number(e.target.value) || 1))} />
          </label>
          <label className="text-xs font-medium text-muted-foreground space-y-1">Week ending
            <Input type="date" value={weekEnding} onChange={(e) => e.target.value && setWeekEnding(e.target.value)} />
          </label>
          <label className="text-xs font-medium text-muted-foreground space-y-1">Days covered
            <Input type="number" min={1} max={31} value={days} onChange={(e) => setDays(Math.min(31, Math.max(1, Number(e.target.value) || 7)))} />
          </label>
          <label className="text-xs font-medium text-muted-foreground space-y-1">Number of stories
            <Input type="number" min={3} max={20} value={count} onChange={(e) => setCount(Math.min(20, Math.max(3, Number(e.target.value) || 8)))} />
          </label>
          <label className="text-xs font-medium text-muted-foreground space-y-1">Mix
            <Select value={share} onValueChange={setShare}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{SHARES.map((s) => <SelectItem key={s.v} value={s.v}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </label>
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <label className="text-xs font-medium text-muted-foreground space-y-1">Subject line
            <Input value={finalSubject} onChange={(e) => { setSubject(e.target.value); setSubjectEdited(true); }} />
          </label>
          <label className="text-xs font-medium text-muted-foreground space-y-1">Editor's note (optional)
            <Textarea rows={2} value={intro} onChange={(e) => setIntro(e.target.value)} />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button onClick={autoPick} disabled={storiesQ.isLoading} className="gap-1.5">
            <RefreshCw className="h-4 w-4" /> Pick stories again
          </Button>
          <span className="text-sm text-muted-foreground">
            {storiesQ.isLoading ? "Loading stories…" : `${stories.length} stories published ${format(from, "d MMM")} – ${format(to, "d MMM")}`}
          </span>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_640px]">
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="font-semibold text-foreground">In this issue ({ordered.length})</h3>
              <div className="flex gap-2 text-xs">
                <Badge variant={nLocal === target ? "secondary" : "outline"}>{nLocal} Cyprus</Badge>
                <Badge variant={ordered.length - nLocal === count - target ? "secondary" : "outline"}>{nIntl} International</Badge>
              </div>
            </div>
            {storiesQ.isLoading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : ordered.length === 0 ? (
              <p className="text-sm text-muted-foreground">No stories picked yet. Add some from the list below.</p>
            ) : (
              <ol className="space-y-2">
                {ordered.map((s, i) => (
                  <li key={s.id} className="flex items-start gap-2 rounded-md border border-border p-2">
                    <span className="w-5 shrink-0 text-xs font-semibold text-muted-foreground pt-0.5">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <a href={`/article/${s.id}`} target="_blank" rel="noreferrer" className="text-sm font-medium text-foreground hover:underline line-clamp-2">{s.title}</a>
                      <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-[10px]">{isInternational(s) ? "International" : "Cyprus"}</Badge>
                        {i === 0 && <Badge className="text-[10px]">Lead</Badge>}
                        <span>{views[s.id] ?? 0} views</span>
                        {s.published_at && <span>· {format(new Date(s.published_at), "EEE d MMM")}</span>}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-0.5">
                      <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Move up" onClick={() => move(s.id, -1)}><ArrowUp className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Move down" onClick={() => move(s.id, 1)}><ArrowDown className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Remove" onClick={() => remove(s.id)}><X className="h-3.5 w-3.5" /></Button>
                    </div>
                  </li>
                ))}
              </ol>
            )}
            <p className="mt-3 text-xs text-muted-foreground">The first Cyprus story is the lead. Cyprus stories come first, then International.</p>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground mb-3">Banners</h3>
            {banners.length === 0 ? <p className="text-sm text-muted-foreground">No live banners right now.</p> : (
              <div className="grid gap-3 sm:grid-cols-3">
                {([["top", "Under the intro"], ["mid", "Before International"], ["footer", "Bottom"]] as const).map(([k, lbl]) => (
                  <label key={k} className="text-xs font-medium text-muted-foreground space-y-1">{lbl}
                    <Select value={bannerIds?.[k] ?? NONE} onValueChange={(v) => setBannerIds((cur) => ({ top: NONE, mid: NONE, footer: NONE, ...cur, [k]: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>No banner</SelectItem>
                        {banners.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </label>
                ))}
              </div>
            )}
            <p className="mt-3 text-xs text-muted-foreground">Only banners that are switched on and within their dates are listed. Clicks are tagged "newsletter" in your visitor stats.</p>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="font-semibold text-foreground">Add a story</h3>
              <div className="flex gap-1">
                <Button size="sm" variant={scope === "cyprus" ? "default" : "outline"} onClick={() => setScope("cyprus")}>Cyprus</Button>
                <Button size="sm" variant={scope === "international" ? "default" : "outline"} onClick={() => setScope("international")}>International</Button>
              </div>
            </div>
            <Input placeholder="Search headlines…" value={search} onChange={(e) => setSearch(e.target.value)} className="mb-3" />
            <ul className="max-h-96 space-y-1 overflow-y-auto">
              {candidates.map((s) => (
                <li key={s.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground line-clamp-1">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{views[s.id] ?? 0} views{s.published_at ? ` · ${format(new Date(s.published_at), "EEE d MMM")}` : ""}</p>
                  </div>
                  <Button size="sm" variant="ghost" className="gap-1" onClick={() => add(s.id)}><Plus className="h-3.5 w-3.5" /> Add</Button>
                </li>
              ))}
              {!candidates.length && <li className="text-sm text-muted-foreground px-2">No more stories in this list.</li>}
            </ul>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={copyEmail} className="gap-1.5" disabled={!ordered.length}><Copy className="h-4 w-4" /> Copy email</Button>
            <Button variant="outline" onClick={copyCode} className="gap-1.5" disabled={!ordered.length}><Copy className="h-4 w-4" /> Copy HTML code</Button>
            <Button variant="outline" onClick={download} className="gap-1.5" disabled={!ordered.length}><Download className="h-4 w-4" /> Download .html</Button>
            <Button variant="ghost" onClick={async () => { await navigator.clipboard.writeText(finalSubject); toast.success("Subject copied"); }}>Copy subject</Button>
          </div>
          <div className="rounded-lg border border-border bg-muted overflow-hidden">
            <iframe title="Newsletter preview" srcDoc={html} className="h-[1400px] w-full bg-background" />
          </div>
        </div>
      </div>
    </div>
  );
}
