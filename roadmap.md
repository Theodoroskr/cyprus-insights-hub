# Roadmap — Company intelligence

- [x] Schema: events, news links, review queue, regulatory records, status history, correction requests
- [x] One master company record (registry) + review of 14 curated matches
- [x] News linking engine + duplicate detection (URL, fingerprint)
- [x] Company page sections: news, people, timeline, regulatory, sources
- [x] Who's Who: Greek name, dates, news, correction form
- [x] Admin Review tab + source access status/counters on Health tab
- [x] News matcher on its own hourly schedule (:30), 40 stories per run
- [ ] Backfill entity extraction for ~500 older articles (clears automatically at 40/hour, ~13 hours)
- [ ] CySEC warnings & enforcement collection — blocked: Firecrawl credits
- [ ] CSE announcements feed — blocked: feed unreachable + reuse permission
- [ ] CNA — blocked: licence (source marked Pending Permission)
- [ ] Semantic-similarity duplicate check (later)
- [ ] Profile claiming (deferred)

- [x] CySEC investment-firm licences imported (248)
- [x] CSE price reader hardened; 70 near-matches queued; failing sources retried; 14 Who's Who companies linked
- [ ] CySEC crypto/AIFM/admin-service lists — pages load their tables in-browser; need a different read method
- [x] Failing/silent news sources repointed to their current pages (15 fixed; ICPAC paused — site unreadable by the scraper); moved pages now show as errors on the Health tab
- [x] Remove gap between Intelligence Hub and Custom Studio
- [x] Article page layout (news articles); interviews/sponsored keep their own header
- [x] Disable three sample sponsored posts; retain sponsored articles and turn Custom Studio into a scheduled banner placement
- [x] Set up three distinct homepage banner positions, mobile story placement, and remove consecutive generic banners
- [x] Blend same-day news sources/topics across the homepage and regulatory sidebar without changing publication dates
- [x] House banners for Infocredit Group, ComplianceSuite, RisQo in the three homepage spaces
- [x] Vary backup photos (4 per hub) so stories without photos don't repeat
- [x] Article photos: unwrap website photo cards, use story's own photo, same photo on preview and page, hub-only backups
- [x] News & Insights lists the latest scraped stories with hub filter and Load more

# Roadmap — Regulator matching (Nov 2026)
- [x] Central Bank register parser: banks, e-money and payment institutions read from official CBC pages/spreadsheets, auto-matched (registration no. → alias → unique name)
- [x] Alias & suffix matcher: strip city/branch words ("Cyta Limassol", "Deloitte Cyprus"), harvest former/trading names from CySEC & CBC as aliases, used by news linking and all regulator imports
- [x] Fold old placeholder bank profiles into the official registry records
- [x] Company page shows CBC licence type, number and status
