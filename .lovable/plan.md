# TourismHub.cy — Explore Cyprus (assessment and plan)

## Assessment
- Fits the existing platform well: same layout, EN/EL language switch, admin review/publish pattern (as used by ComplianceHub), official-source registry and RLS "published only" rules.
- Clash to avoid: `/tourism` already shows official arrival statistics. Explore Cyprus will live at `/explore` and the stats page stays where it is (statistics are deferred in this brief anyway).
- No map exists yet. The map view will use Google Maps (connection card shown during build); pins only for listings with verified coordinates. Map display cannot be tested inside the sandbox — you'll check it on the live site.
- Realistic content outcome: listings are written from official pages and kept in draft until each one has a source link and "last verified" date. Expect some destinations (Troodos, Protaras) to need editor input before reaching 3 published listings.
- Images: only photos with recorded rights. Where none are confirmed, a destination shows a neutral illustration instead of a photo.

## What visitors get
- `/explore` — landing: search, destination cards (Nicosia, Limassol, Larnaka, Pafos, Famagusta, Troodos), category links (Museums & heritage, Beaches, Nature & trails, Wineries, Traditional villages, Family), list/map toggle sharing the same filters.
- `/explore/:destination` — intro, image, filtered listings. Famagusta has sub-pages Ayia Napa and Protaras. Troodos is an area spanning districts.
- `/explore/place/:slug` — one page per place, shown on every related destination; only confirmed details (hours, admission, booking, accessibility, parking, official link, source, last verified, photo credit). Variable hours point to the official page.
- Search understands EN/EL names and variants (Pafos/Paphos, Ayia/Agia Napa, Larnaka/Larnaca, Lefkosia/Nicosia, Lemesos/Limassol, etc.).
- "Explore Cyprus" added to the main BusinessHub menu, footer and sitemap (published items only).

## What editors get
- New "TourismHub" admin panel: create/edit listings and destinations, link a listing to several destinations, set coordinates as verified, record photo rights, mark "verified today", draft/publish.
- Source registry with the six starting sources plus Department of Antiquities and Troodos candidates (marked pending until checked).

## Build steps
1. Database: destinations (with parent, district, aliases), listings, listing↔destination links, photos (rights, credit), sources; public can read only published rows; admins manage all.
2. Pages and shared filtering/search logic with EN/EL labels.
3. Google Maps connection and map view.
4. Admin panel in the Editorial Dashboard.
5. Research official pages and add curated listings (target 3+ per destination); publish only fully verified ones.
6. Checks: tests for variant search, filters, multi-destination listing without duplicates, draft hiding; browser checks signed-out vs admin, EN/EL.
7. Report routes, published counts per destination, sources used, and gaps.

## Technical notes
- Tables: `tour_destinations`, `tour_listings`, `tour_listing_destinations`, `tour_photos`, `tour_sources`, with GRANTs + RLS (`status='published'` public, `has_role(admin)` write).
- Search normalisation (accent/greek-latin folding + alias list) in `src/lib/explore.ts`, unit-tested.
- Map: Maps JS via managed browser key, `google.maps.Marker`, `clickableIcons:false`.
- AGENTS.md rule: Explore listings public only when published with source + verified date.
