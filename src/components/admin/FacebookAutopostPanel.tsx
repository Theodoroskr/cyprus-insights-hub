import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Send } from "lucide-react";

type FbPage = { id: string; name: string; canPost: boolean };

async function invoke(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("post-to-facebook", { body });
  if (error) {
    const details = error instanceof FunctionsHttpError ? await error.context.text() : error.message;
    let msg = details;
    try { msg = JSON.parse(details).error ?? details; } catch { /* plain text */ }
    throw new Error(msg);
  }
  return data;
}

export function FacebookAutopostPanel() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [limitDraft, setLimitDraft] = useState<string>("");

  const settings = useQuery({
    queryKey: ["fb-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("facebook_autopost_settings").select("*").eq("id", true).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const pages = useQuery({
    queryKey: ["fb-pages"],
    queryFn: async () => ((await invoke({ action: "list_pages" })).pages ?? []) as FbPage[],
    retry: false,
  });

  const posts = useQuery({
    queryKey: ["fb-posts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("facebook_posts").select("*").order("created_at", { ascending: false }).limit(30);
      if (error) throw error;
      const ids = (data ?? []).map((p) => p.article_id);
      const { data: arts } = ids.length ? await supabase.from("cna_articles").select("id,title").in("id", ids) : { data: [] };
      const titles = new Map((arts ?? []).map((a) => [a.id, a.title]));
      return (data ?? []).map((p) => ({ ...p, title: titles.get(p.article_id) ?? "(story removed)" }));
    },
  });

  const save = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      const { error } = await supabase.from("facebook_autopost_settings")
        .update({ ...patch, updated_at: new Date().toISOString() }).eq("id", true);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fb-settings"] }); toast({ title: "Saved" }); },
    onError: (e: Error) => toast({ title: "Could not save", description: e.message, variant: "destructive" }),
  });

  const runNow = useMutation({
    mutationFn: () => invoke({ action: "run", force: true }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["fb-posts"] });
      qc.invalidateQueries({ queryKey: ["fb-settings"] });
      toast({ title: r.skipped ? "Nothing posted" : `Posted ${r.posted ?? 0} stor${r.posted === 1 ? "y" : "ies"}`, description: r.skipped ?? r.reason });
    },
    onError: (e: Error) => toast({ title: "Posting failed", description: e.message, variant: "destructive" }),
  });

  const s = settings.data;
  const postable = (pages.data ?? []).filter((p) => p.canPost);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Facebook auto-posting</CardTitle>
          <CardDescription>
            New stories post to the chosen Facebook page between 07:00 and 21:00 Cyprus time, spread through the day,
            up to the daily limit. Each story is posted once.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-2 max-w-md">
            <Label>Facebook page</Label>
            {pages.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading your pages…</p>
            ) : pages.error ? (
              <p className="text-sm text-destructive">Could not read your pages: {(pages.error as Error).message}</p>
            ) : (
              <Select
                value={s?.page_id ?? undefined}
                onValueChange={(id) => {
                  const p = postable.find((x) => x.id === id);
                  save.mutate({ page_id: id, page_name: p?.name ?? null });
                }}
              >
                <SelectTrigger><SelectValue placeholder="Choose a page" /></SelectTrigger>
                <SelectContent>
                  {postable.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <p className="text-xs text-muted-foreground">
              Only pages included in your Facebook token appear here. If the BusinessHub page is missing, create a new token
              with that page ticked and update it under Connectors → Facebook Pages.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={!!s?.enabled}
              disabled={!s?.page_id || save.isPending}
              onCheckedChange={(v) => save.mutate({ enabled: v })}
              id="fb-enabled"
            />
            <Label htmlFor="fb-enabled">Post automatically{!s?.page_id ? " (choose a page first)" : ""}</Label>
          </div>

          <div className="flex items-end gap-2 max-w-xs">
            <div className="grid gap-2 flex-1">
              <Label htmlFor="fb-limit">Stories per day (max)</Label>
              <Input
                id="fb-limit" type="number" min={1} max={50}
                value={limitDraft || String(s?.daily_limit ?? 20)}
                onChange={(e) => setLimitDraft(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              disabled={!limitDraft || Number(limitDraft) < 1 || Number(limitDraft) > 50}
              onClick={() => { save.mutate({ daily_limit: Number(limitDraft) }); setLimitDraft(""); }}
            >Save</Button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => runNow.mutate()} disabled={!s?.enabled || runNow.isPending} className="gap-1.5">
              <Send className="h-4 w-4" /> {runNow.isPending ? "Posting…" : "Post now"}
            </Button>
            <span className="text-xs text-muted-foreground">
              Posts up to 3 waiting stories now (still within today's limit).
              {s?.last_run_at ? ` Last run ${new Date(s.last_run_at).toLocaleString("en-GB")}.` : ""}
            </span>
          </div>
          {s?.last_error && <p className="text-sm text-destructive">Last problem: {s.last_error}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent posts</CardTitle>
          <Button size="sm" variant="ghost" onClick={() => posts.refetch()}><RefreshCw className="h-4 w-4" /></Button>
        </CardHeader>
        <CardContent>
          {(posts.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing posted yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {posts.data!.map((p) => (
                <li key={p.id} className="py-2 flex items-start justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <a href={`/article/${p.article_id}`} className="font-medium hover:underline line-clamp-1">{p.title}</a>
                    {p.error && <p className="text-xs text-destructive line-clamp-2">{p.error}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString("en-GB")}</span>
                    <Badge variant={p.status === "posted" ? "default" : "destructive"}>{p.status}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
