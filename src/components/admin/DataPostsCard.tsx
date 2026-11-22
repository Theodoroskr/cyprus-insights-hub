import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, Eye, Send } from "lucide-react";

const TOPIC_NAMES: Record<string, string> = {
  "greece-pulse": "Greece Business Pulse", "cyprus-economy": "Cyprus economy", "cyprus-banking": "Cyprus banking",
  "cyprus-property": "Cyprus property", "cyprus-tourism": "Cyprus tourism", integrity: "Corruption Perceptions Index",
};

type Preview = { topic: string; image: string; messages: { facebook: string; linkedin: string; x: string }; postedToday: string[] };

async function invoke(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("post-data-highlight", { body });
  if (error) {
    const details = error instanceof FunctionsHttpError ? await error.context.text() : error.message;
    let msg = details;
    try { msg = JSON.parse(details).error ?? details; } catch { /* plain text */ }
    throw new Error(msg);
  }
  return data;
}

/** Daily official-data post: preview today's post, post it now, and see what went out. */
export function DataPostsCard() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const preview = useQuery({ queryKey: ["data-post-preview"], queryFn: async () => (await invoke({ action: "preview" })) as Preview, retry: false });
  const history = useQuery({
    queryKey: ["data-post-history"],
    queryFn: async () => {
      const { data, error } = await supabase.from("social_data_posts").select("*").order("created_at", { ascending: false }).limit(30);
      if (error) throw error;
      return data ?? [];
    },
  });

  const postNow = useMutation({
    mutationFn: () => invoke({ force: true }),
    onSuccess: (r) => {
      const failed = (r.results ?? []).filter((x: { ok: boolean }) => !x.ok);
      toast({
        title: r.posted ? `Posted to ${r.posted} account${r.posted === 1 ? "" : "s"}` : r.reason ?? "Nothing posted",
        description: failed.length ? failed.map((f: { platform: string; error: string }) => `${f.platform}: ${f.error}`).join("\n") : undefined,
        variant: failed.length ? "destructive" : undefined,
      });
      qc.invalidateQueries({ queryKey: ["data-post-history"] });
      qc.invalidateQueries({ queryKey: ["data-post-preview"] });
    },
    onError: (e: Error) => toast({ title: "Could not post", description: e.message, variant: "destructive" }),
  });

  const p = preview.data;
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Daily data post</CardTitle>
        <CardDescription>
          Every day at 11:00 Cyprus time one post with the latest official figures goes to Facebook, LinkedIn and X (each account only while its own posting is switched on).
          Topics take turns: Greece Business Pulse, Cyprus economy, banking, property and tourism; a new release goes first, and the Corruption Perceptions Index is posted once per new edition.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {preview.isLoading && <p className="text-sm text-muted-foreground">Building today's post…</p>}
        {preview.error && <p className="text-sm text-destructive">{(preview.error as Error).message}</p>}
        {p && (
          <div className="grid gap-4 md:grid-cols-[280px_1fr]">
            <img src={p.image} alt="" className="w-full rounded-md border" />
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Eye className="h-4 w-4" /> Today's topic: <strong>{TOPIC_NAMES[p.topic] ?? p.topic}</strong>
                {p.postedToday.length > 0 && <Badge variant="secondary">Already posted to {p.postedToday.join(", ")}</Badge>}
              </div>
              <pre className="whitespace-pre-wrap rounded-md bg-muted p-3 text-xs leading-relaxed">{p.messages.facebook}</pre>
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground">Shorter version for X</summary>
                <pre className="mt-2 whitespace-pre-wrap rounded-md bg-muted p-3">{p.messages.x}</pre>
              </details>
            </div>
          </div>
        )}
        <Button onClick={() => postNow.mutate()} disabled={postNow.isPending || !p} className="gap-1.5">
          <Send className="h-4 w-4" /> {postNow.isPending ? "Posting…" : "Post today's figures now"}
        </Button>

        <div>
          <h4 className="text-sm font-semibold mb-2">Recent data posts</h4>
          {(history.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No data posts yet.</p>
          ) : (
            <ul className="divide-y text-sm">
              {history.data!.map((r) => (
                <li key={r.id} className="py-2 flex flex-wrap items-center gap-2">
                  <span className="text-muted-foreground w-36">{new Date(r.created_at).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}</span>
                  <Badge variant="outline" className="capitalize">{r.platform === "x" ? "X" : r.platform}</Badge>
                  <span>{TOPIC_NAMES[r.topic] ?? r.topic}</span>
                  {r.status === "failed"
                    ? <span className="text-destructive text-xs truncate max-w-md" title={r.error ?? ""}>Failed: {r.error}</span>
                    : <Badge variant="secondary">Posted</Badge>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
