# RSS feeds: current state and missing feeds

## What exists today
- Main feed: /rss.xml (all stories)
- Separate section feeds: /rss/business.xml, /rss/fintech.xml, /rss/compliance.xml, /rss/regtech.xml, /rss/sme.xml, /rss/greece.xml

## Missing
- Tourism, Energy, International edition, and a Cyprus-only feed.

## Proposal
1. Add /rss/tourism.xml, /rss/energy.xml, /rss/international.xml (non-Cyprus stories) and /rss/cyprus.xml.
2. Advertise each feed in its hub's page header so feed readers find it automatically.
3. Add a small "RSS feeds" list in the footer linking all feeds.

## Technical notes
- Extend the prebuild RSS script that already writes public/rss*; reuse the same story filters as the International/hub pages.
