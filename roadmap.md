# Roadmap — Company intelligence

- [x] Schema: events, news links, review queue, regulatory records, status history, correction requests
- [x] One master company record (registry) + review of 14 curated matches
- [x] News linking engine + duplicate detection (URL, fingerprint)
- [x] Company page sections: news, people, timeline, regulatory, sources
- [x] Who's Who: Greek name, dates, news, correction form
- [x] Admin Review tab + source access status/counters on Health tab
- [ ] Backfill entity extraction for all ~900 older articles (runs 15/hour automatically)
- [ ] CySEC warnings & enforcement collection — blocked: Firecrawl credits
- [ ] CSE announcements feed — blocked: feed unreachable + reuse permission
- [ ] CNA — blocked: licence (source marked Pending Permission)
- [ ] Semantic-similarity duplicate check (later)
- [ ] Profile claiming (deferred)

- [x] CySEC investment-firm licences imported (248)
- [x] CSE price reader hardened; 70 near-matches queued; failing sources retried; 14 Who's Who companies linked
- [ ] CySEC crypto/AIFM/admin-service lists — pages load their tables in-browser; need a different read method
- [ ] 7 news sources still failing (4 pages unreadable, 3 site-side SSL/blocking)
