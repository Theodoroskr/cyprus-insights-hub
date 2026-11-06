# Directory check and the 11880 question

## How the directory is doing
In the browser, the directory home, the city pages, the company pages and search all load without errors (tested with Limassol, Amana Capital and "bank of cyprus").

Problems found:
- **Duplicate companies.** 270 companies have no registration number. They were added automatically from regulator lists, and they repeat only 99 different names. 83 of them repeat a company that is already in the registry. For example, Bank of Cyprus shows up 5 times: once with registration number 165 and 4 times without one.
- **Wrong total.** The page says "60,000+ companies", but the directory holds 54,899.
- **No map locations.** None of the companies has a map position, so map or "near me" features can't work.
- About 39,700 companies are marked as active.

## Should you combine it with 11880?
I don't recommend merging the two sites. They serve different people:
- **This site (Cyprus Edition)** is about business intelligence: registered companies, who runs them, their licences and the news about them. Its readers are professionals checking out a company.
- **11880 (Cyprus Business Compass)** is a bilingual Greek/English listing of local businesses, built around phone enquiries and fuel prices. It has its own separate database and staff back office.

Merging them would mix two audiences and two sets of data, and it would add a lot of rework. A better approach is to link them: on a company page here, show a "Contact via 11880" link when that business is listed on 11880, and in the other direction let 11880 link to the company profile here. Each site keeps its own focus. This can be a later step that needs work in both projects.

## Proposed fixes (this project only)
1. Merge the duplicate unregistered companies into the matching registered company when the name is an exact match, and move their licence records over. Names that match only roughly go to the Review tab instead of being merged. Leftover copies of the same unregistered name become one record.
2. Stop the regulator scraper from adding a new company when one with the same name already exists. It will link to that company or send the case to review instead.
3. Show the real company count instead of "60,000+".
4. Keep the duplicate "Bank of Cyprus" style results out of search.

## Technical details
- Use exact matches on `lower(company_name)` against rows that have a `registration_no`. Move `regulated_entities.matched_company_id`, `regulatory_records.directory_company_id`, `companies.directory_company_id` and `company_events` to the surviving row, then delete the rows without a registration number. Ambiguous matches go to `match_review_queue`.
- Change the auto-creation step in `scrape-regulators` so it looks up an existing company by name before inserting.
- Read the count on the hero section from the directory data (rounded down, for example "54,000+").
- Geocoding is out of scope here.
