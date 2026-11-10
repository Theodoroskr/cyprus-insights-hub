// Runs after `vite build` (postbuild): writes dist/article/<id>/index.html per recent
// published story so link previews show that story's own title and photo.
// If the database can't be reached, it skips without failing the publish.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { buildStoryHtml, type PreviewStory } from "../src/lib/storyPreview";

function readEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  const file = resolve(".env");
  if (existsSync(file)) for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/.exec(line);
    if (m) env[m[1]] = m[2];
  }
  return { ...env, ...(process.env as Record<string, string>) };
}

const LIMIT = 2000;

async function main() {
  const env = readEnv();
  const url = env.VITE_SUPABASE_URL, key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const tplPath = resolve("dist/index.html");
  if (!url || !key || !existsSync(tplPath)) throw new Error("missing env or dist/index.html");
  const template = readFileSync(tplPath, "utf8");
  const stories: PreviewStory[] = [];
  for (let from = 0; from < LIMIT; from += 1000) {
    const res = await fetch(`${url}/rest/v1/cna_articles?select=id,title,summary,what_happened,image_url,vertical&status=eq.published&published_at=not.is.null&order=published_at.desc`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Range: `${from}-${from + 999}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = (await res.json()) as PreviewStory[];
    stories.push(...rows);
    if (rows.length < 1000) break;
  }
  for (const s of stories) {
    if (!/^[0-9a-f-]{36}$/i.test(s.id)) continue;
    const dir = resolve("dist/article", s.id);
    mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, "index.html"), buildStoryHtml(template, s));
  }
  console.log(`story previews: wrote ${stories.length} pages`);
}

main().catch((e) => console.warn("story previews skipped:", e.message));
