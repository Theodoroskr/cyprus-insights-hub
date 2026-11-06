# Fix full article page layout

## What's wrong today (checked on the TikTok / DSA article)

1. **The headline is a whole paragraph.** The page uses the long "What happened" text (about 60 words) as the title instead of the real headline ("Commission preliminarily finds TikTok's 'For You' feed in breach of the DSA…"). It is set in large white letters over a busy photo, which makes it hard to read. The same text then repeats right below in "What happened".
2. **The full story is hidden and messy.** It sits behind a "Summary / Full Article" switch. The stored text still includes the source website's menus, logos and link lists (EC logo, "EN", "Search", "Home"…).
3. **Missing basics.** There is no source name, reading time or author line near the title, and no sidebar. Below a narrow column the page is mostly empty, then jumps straight to related stories.

## Proposed layout

```text
[ Category ] · Source · 6 Nov 2026 · 4 min read
Real headline (serif, dark on light, max 3 lines)
One-line summary (standfirst)
[ Photo, 16:9, with caption/credit ]
-------------------------------------------- +--------------+
| What happened / Why it matters / What to do | | Share        |
| (compact cards, shown once)                 | | Topics/tags  |
|                                             | | Most read    |
| Full article (cleaned, readable width)      | | Related (3)  |
| "Read original at <source>" link            | +--------------+
--------------------------------------------
Related intelligence (4 cards)
```

- Use the real headline, and fall back to a shortened "What happened" only when no headline exists.
- Title and photo are separate: the photo goes under the title, so there's no text over the image.
- The full article shows below the three briefing boxes by default, with no switch. Long stories fold with a "Continue reading" button, which keeps the current length rules.
- Clean the article text when it's shown: remove leading menus and link-only lines, logos and "Skip to content"-type lines, and cookie/footer text. If almost nothing useful is left, show the summary and a clear "Read the full release at <source>" button.
- Add a right sidebar on desktop (share, topics, most read, related). On mobile it stacks below the article.
- Apply the same header and body style to interviews and sponsored articles so all article pages look alike.

## Technical details

- `src/pages/ArticlePage.tsx`: header uses `article.title`; meta row includes source host from `source_url` and `estimateReadingTime`; remove the Tabs and render the body via ReactMarkdown in `prose` with `max-w-[68ch]`; two-column grid `lg:grid-cols-[1fr_300px]`.
- New `src/lib/cleanArticleMarkdown.ts`: strips nav, image-link and link-list lines before the first real paragraph and trims trailing footer blocks. Add a small unit test with the TikTok sample.
- Also clean new articles going forward by running the same rules in `scrape-sources` before saving.
- Share the header block with `InterviewArticlePage` and `SponsoredArticlePage`.
- Verify by screenshotting 3 articles: an EC release, a PIO story and an interview.
