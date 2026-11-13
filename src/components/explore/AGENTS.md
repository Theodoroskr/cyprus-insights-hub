# Explore Cyprus (TourismHub)

- `tour_listings` are public only when `published` with a source/official link and a last-verified date (RLS); map pins only when `coords_verified`; one listing links to many destinations via `tour_listing_destinations`. Why: only confirmed visitor details, no duplicate pages.
- Every visitor-facing listing/destination text has an `_el` twin shown via `pick()` with English fallback; districts translate via `DISTRICT_EL`; `?lang=el` opens the Greek version and the switch keeps the URL in step. Why: one page per place in both languages, never a blank field.
