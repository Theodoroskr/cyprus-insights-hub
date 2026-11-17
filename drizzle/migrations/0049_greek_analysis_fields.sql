ALTER TABLE public.cna_articles
  ADD COLUMN IF NOT EXISTS what_happened_el text,
  ADD COLUMN IF NOT EXISTS why_it_matters_el text,
  ADD COLUMN IF NOT EXISTS what_to_do_el text;