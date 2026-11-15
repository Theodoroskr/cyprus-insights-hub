# Fix the 8 failing news sources

The list you sent shows 8 sources that collected nothing. I checked each news page address today.

## What I found and what to do

| Source | Problem | Fix |
|---|---|---|
| European Banking Authority | Page moved | Switch to its new Press releases page (works) |
| Bank for International Settlements | Page moved | Switch to its Press releases page (works) |
| UNCTAD | Page moved | Switch to its new Newsroom page (works) |
| EU Publications Office | News page removed | Pause; no public news list found |
| Sifted | Site blocks automated readers | Pause |
| DSA Cyprus (two entries) | Duplicate; old address is dead, new site has no news list | Remove the dead duplicate, pause the other |
| ICPAC | Page works again (it was a one-off failure) | Leave on; next run should succeed |

## After the change
- Run each fixed source once and confirm stories are found.
- Paused sources show a clear reason in the sources list, so they stop showing as errors every day.

## Technical details
- Update `content_sources.scrape_path`: EBA `/publications-and-media/press-releases`, BIS `/press/pressrels.htm`, UNCTAD `/newsroom`.
- Set `active=false` with a note for EU Publications Office, Sifted, and DSA (`dsa.cy`); delete the `dsa.mfa.gov.cy` duplicate row.
- Trigger `scrape-sources` for the 3 fixed rows and check `last_error` is cleared.
