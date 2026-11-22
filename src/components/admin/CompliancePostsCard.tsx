import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, Scale, Send } from "lucide-react";

type Preview = {
  item: { id: string; authority: string; title: string; publication_date: string | null; link: string } | null;
  reason?: string; image?: string; messages?: { facebook: string; linkedin: string; x: string };
};

async function invoke(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("post-compliance-updates", { body });
  if (error) {
    const details = error instanceof FunctionsHttpError ? await error.context.text() : error.message;
    let msg = details;
    try { msg = JSON.parse(details).error ?? details; } catch { /* plain text */ }
    throw new Error(msg);
  }
  return data;
}

/** Twice-daily ComplianceHub posts: preview the next one, post it now, and see what went out. */
export function CompliancePostsCard() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const preview = useQuery({ queryKey: ["compliance-post-preview"], queryFn: async () => (await invoke({ action: "preview" })) as Preview, retry: false });
  const history = useQuery({
    queryKey: ["compliance-post-history"],
    queryFn: async () => {
      const { data, error } = await supabase.from("social_compliance_posts")
        .select("id, created_at, platform, status, error, slot, compliance_items(authority, title_en, official_title)")
        .order("created_at", { ascending: false }).limit(30);
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
      qc.invalidateQueries({ queryKey: ["compliance-post-history"] });
      qc.invalidateQueries({ queryKey: ["compliance-post-preview"] });
    },
    onError: (e: Error) => toast({ title: "Could not post", description: e.message, variant: "destructive" }),
  });

  const p = preview.data;
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Scale className="h-5 w-5" /> ComplianceHub posts</CardTitle>
        <CardDescription>
          Twice a day, at 10:00 and 16:00 Cyprus time, one published regulatory update goes to Facebook, LinkedIn and X (each account only while its own posting is switched on).
          Newest official updates from the last 3 weeks first, each posted once, a different authority from the previous post when possible. Nothing new means no post.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {preview.isLoading && <p className="text-sm text-muted-foreground">Finding the next update…</p>}
        {preview.error && <p className="text-sm text-destructive">{(preview.error as Error).message}</p>}
        {p && !p.item && <p className="text-sm text-muted-foreground">{p.reason}</p>}
        {p?.item && p.messages && (
          <div className="grid gap-4 md:grid-cols-[280px_1fr]">
            {p.image && <img src={p.image} alt="" className="w-full rounded-md border" />}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm"><Eye className="h-4 w-4" /> Next post: <strong>{p.item.authority}</strong></div>
              <pre className="whitespace-pre-wrap rounded-md bg-muted p-3 text-xs leading-relaxed">{p.messages.facebook}</pre>
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground">Shorter version for X</summary>
                <pre className="mt-2 whitespace-pre-wrap rounded-md bg-muted p-3">{p.messages.x}</pre>
              </details>
            </div>
          </div>
        )}
        <Button onClick={() => postNow.mutate()} disabled={postNow.isPending || !p?.item} className="gap-1.5">
          <Send className="h-4 w-4" /> {postNow.isPending ? "Posting…" : "Post this update now"}
        </Button>
        <div>
          <h4 className="text-sm font-semibold mb-2">Recent ComplianceHub posts</h4>
          {(history.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No ComplianceHub posts yet.</p>
          ) : (
            <ul className="divide-y text-sm">
              {history.data!.map((r) => {
                const it = r.compliance_items as { authority: string; title_en: string | null; official_title: string } | null;
                return (
                  <li key={r.id} className="py-2 flex flex-wrap items-center gap-2">
                    <span className="text-muted-foreground w-36">{new Date(r.created_at).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}</span>
                    <Badge variant="outline" className="capitalize">{r.platform === "x" ? "X" : r.platform}</Badge>
                    <span className="truncate max-w-md">{it ? `${it.authority}: ${it.title_en ?? it.official_title}` : "—"}</span>
                    {r.status === "failed"
                      ? <span className="text-destructive text-xs truncate max-w-md" title={r.error ?? ""}>Failed: {r.error}</span>
                      : <Badge variant="secondary">Posted</Badge>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
