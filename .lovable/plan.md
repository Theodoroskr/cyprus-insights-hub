# Separate RSS feeds for Cyprus, Greece and International

## Today
- /rss.xml: every story mixed together
- /rss/greece.xml: Greece stories (already exists)
- Section feeds: business, fintech, compliance, regtech, sme

## Add
1. **/rss/cyprus.xml**: Cyprus stories only.
2. **/rss/international.xml**: stories outside Cyprus and Greece, using the same rule as the International homepage.
3. Check /rss/greece.xml contains only Greece stories.
4. Each edition homepage tells feed readers about its own feed. Footer gets a "RSS feeds" line linking all three.

## Technical notes
- Extend the prebuild RSS script that writes public/rss*; reuse the edition/scope classification already used for the All/Cyprus/International toggle.
- Add tests: a Cyprus story appears only in the Cyprus feed, an international story only in the International feed.
