# Company News, Who's Who and Official Sources: audit and plan

Phase 1 audit of your master prompt, checked against the live app and database. Nothing changes until you approve.

## 1. Audit

| Feature | Exists? | What's there now | Gap | Action |
|---|---|---|---|---|
| Company directory | Yes | 54,899 registry companies; 54,629 have a registration number | Two separate company lists: the registry and 14 hand-picked profiles | EXTEND: make the registry the one master company record |
| Company profile page | Partial | Two different page designs for registry and hand-picked companies | No news, people, timeline or sources sections | EXTEND |
| Who's Who | Yes | 66 people, 67 person-company links, all for the 14 hand-picked companies | No Greek name, appointment dates, sources or verification date; no link to registry companies | EXTEND |
| Company news | Partial | 915 scraped news items, plus 12 editorial articles (9 linked to companies, 6 to people) | Scraped news is not linked to any company or person | EXTEND |
| CSE integration | Partial | Share prices only (blocked by Firecrawl credits); CSE is one news source | No announcements feed. The CSE announcements feed did not respond from our server; needs checking | CREATE (after the feed is checked) |
| CySEC integration | Partial | Weekly regulator scrape; 172 regulated firms, 139 matched to the directory; licence flags on companies | Warnings and sanctions are not kept apart from licensed-firm data; no status history | EXTEND |
| CNA integration | Partial | A CNA import exists; 0 stored articles are tagged as CNA | No confirmed licence | DEFER: mark "Pending Permission" until you have a licence |
| Entity matching | Partial | Regulator records matched to companies, with a confidence score | No review queue; no matching for people or news | EXTEND |
| Duplicate detection | Partial | Duplicates checked by original link only | No content fingerprint and no similarity check | EXTEND |
| Automated updates | Yes | Hourly news batch, weekly regulators, ticker 3 times a weekday, digests, monthly trade data | Blocked by Firecrawl credits | REUSE |
| Admin tools | Yes | Editorial dashboard, Health tab with Retry, Sources page | No match review, event fixes, licence status or rejected/duplicate counts | EXTEND |
| Profile claiming | No | Nothing | Everything | DEFER (later phase) |

## 2. Implementation order

1. **One master company record:** link the 14 hand-picked companies and their people to registry companies by registration number, then retire the second page design. (EXTEND)
2. **Evidence-based relationships:** add role type, start and end dates, source link and verified date to person-company links. Add a Greek name and a verified date to people. (EXTEND)
3. **News linking engine:** AI tags each news item with companies, people and one of the 13 event types. Facts are stored separately from summaries, and duplicates are caught by link, fingerprint and similarity. (CREATE, reusing the current news import)
4. **Matching review queue:** automatic links only on registration number or official licence or exchange ID. Name-only matches go to an admin queue. People are never auto-merged. (CREATE)
5. **Profile sections:** Latest News, Key People, Corporate Timeline, Regulatory Information and Sources added to the company page. Person pages show their companies and news. (EXTEND)
6. **CySEC split:** licensed firms, warnings about unauthorised firms, and enforcement actions become separate record types, with status history. Warnings are never shown as a company's own sanction. (EXTEND)
7. **CSE announcements:** use the official feed if it works and is allowed; check every 2 hours. (CREATE, waits on step 8)
8. **Source licence status:** each source gets a status (Active, Pending Permission, Pending Configuration, Authentication Required, Error, Disabled), plus imported, rejected and duplicate counts on the Health tab. Collection runs only for Active sources. (EXTEND)
9. **Privacy safeguards:** a correction request form on person pages; sensitive negative items need human approval before publishing. (CREATE)

## 3. Waiting on you or outside approval

- **CNA licence:** needed for commercial reuse and AI processing.
- **CSE announcements feed:** reuse permission, and confirmation that it is reachable.
- **Firecrawl credits:** all scraping stays blocked until topped up.

## Technical details

- New tables: `company_events` (facts), `news_entity_links` (news to company or person, with confidence and status), `match_review_queue`, `regulatory_records` (type: licensed, warning or enforcement), and `cysec_status_history`.
- New columns: `relationships` gets `role_type`, `started_at`, `ended_at`, `source_url` and `verified_at`. `people` gets `name_el` and `verified_at`. `companies` gets `directory_company_id`. `cna_articles` gets `content_hash` and `canonical_url`. `content_sources` gets `access_status`, `records_imported`, `records_rejected` and `records_duplicate`.
- Reuse the `scrape-sources` and `scrape-regulators` functions and the Health tab. No new cron jobs except CSE announcements. Matching for news and people happens inside the existing hourly batch.
- RLS: public read only for approved links; admins (has_role) manage everything else.
