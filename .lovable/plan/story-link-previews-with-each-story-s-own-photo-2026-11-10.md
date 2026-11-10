# Story link previews with each story's own photo

## Goal
When a story link (businesshub.cy/article/...) is pasted into Facebook, WhatsApp or LinkedIn, the preview shows that story's headline, summary and photo instead of the general BusinessHub.cy card.

## What changes for you
- Every published story gets its own preview card on the next publish.
- Stories added after a publish show the general card until the following publish (automatic Facebook posts are unaffected — they upload the photo directly).
- Visitors see exactly the same story page as today.

## How it works
1. At publish time, a new step (next to the existing sitemap and feed steps) reads the newest published stories and writes one small page per story at `article/<id>/index.html`.
2. Each page is a copy of the site's main page with that story's title, summary, photo, address and "article" type placed in the head, so link-preview robots read them without running the app.
3. The browser then loads the normal app on top, so readers see the usual story page.
4. If the story photo is missing or from a site that blocks robots, the hub's branded picture is used instead.
5. If the database can't be reached during publish, the step is skipped and the site publishes normally.

## Checks
- Small tests for the head-tag builder (title/summary escaping, photo fallback, self-referencing address).
- After publish, fetch a story link as Facebook does and confirm its own title and photo appear.

## Technical details
- `src/lib/storyPreview.ts`: pure builder injecting og:/twitter: tags, canonical and description into the built `index.html` template (marked `data-rh` so the app replaces them cleanly).
- `scripts/generate-story-previews.ts`: runs as a postbuild step (needs `dist/index.html`), writes `dist/article/<id>/index.html` for recent published `cna_articles` (cap ~2,000 to keep publish fast).
- Hosting serves the folder file for `/article/<id>` before the app fallback; verify this after publish, and if not, fall back to the existing pre-render worker.
- Record the rule in `AGENTS.md`.
