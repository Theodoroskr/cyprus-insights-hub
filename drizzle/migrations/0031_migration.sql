alter table public.tour_listings
  add column if not exists locality_el text,
  add column if not exists address_el text,
  add column if not exists opening_hours_el text,
  add column if not exists admission_el text,
  add column if not exists accessibility_el text,
  add column if not exists parking_el text;