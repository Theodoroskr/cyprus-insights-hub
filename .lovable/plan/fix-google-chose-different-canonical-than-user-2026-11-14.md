# Fix "Google chose different canonical than user"

## What I found
When Google first downloads a page, it gets the raw HTML before the site's own code runs. I checked that raw HTML on the live site:

- **Story pages from your last publish are fine.** Each one has its own title and its own main address.
- **Almost every other page is the same blank shell.** This covers all 54,790 company pages, the city pages, and section pages like /funding, /economy, /compliance and /explore/conference-venues. Each one has the homepage title, the general description and no main address of its own.
- The sitemap lists all of those 54,790 company pages. Google gets tens of thousands of identical-looking pages, decides they are copies, and picks another page (usually the homepage) as the "real" one.
- Stories added since the last publish also get the blank shell until you publish again.

I couldn't open the exact list of affected pages in Search Console. Two Search Console accounts are linked to this project, so the first step is choosing the right one.

## What I'll do
1. **Confirm the affected pages.** Pick the right Search Console account, then pull sample URLs from the "Duplicate, Google chose different canonical" report. This confirms which page types are affected before anything changes.
2. **Give every section page its own head at publish time.** About 60 pages, such as /funding, /economy, /compliance, /energy and /explore/*. Each gets its own title, description and main address, the same way story pages already do.
3. **Give company pages their own head.** Each company gets its own title ("Company name — Cyprus Company Profile"), its own description and its own main address. Writing 55,000 separate pages every publish is too heavy, so this is done one of two ways (see question below).
4. **Do the same for city and category directory pages,** venue and place pages, and funding call pages.
5. **Keep the sitemap honest.** Only list pages that now carry their own main address. Re-check a sample the way Google sees it.
6. **Ask Google to re-check.** Use "Validate fix" in Search Console on that report.

## Decision needed: company pages
- **A. Publish-time pages for a capped set.** Companies with licences, news mentions or other extra data (a few thousand) get their own page file. The rest stay out of the sitemap for now. Simple and quick, but fewer company pages in Google.
- **B. Serve company heads on request.** Use the existing company-page renderer so every one of the 55,000 company addresses returns its own head to Google. This means turning on the routing for businesshub.cy that sends search robots to it. All companies are covered, but it needs that setup to work on your domain.

## Technical details
- Extend the `postbuild` step to write `dist/<route>/index.html` with self-referencing canonical, og:url, title and description for static routes (from `ROUTE_META`/static sitemap), city pages, funding calls and venues. This uses the same template approach as `generate-story-previews.ts`.
- Option A: write files for a filtered subset of `directory_companies`, and trim `companies-*.xml` to match.
- Option B: wire `render-company` behind the domain's robot routing. Verify with a Googlebot user-agent fetch that the title and canonical are company-specific.
- Fetch samples with a Googlebot user agent after publishing, to confirm each page's main address points to itself.
