ALTER TABLE public.gr_procurement_notices
  ADD COLUMN search_text text GENERATED ALWAYS AS (translate(lower(title), 'άέήίόύώϊϋΐΰς', 'αεηιουωιυιυσ')) STORED,
  ADD COLUMN authority_search text GENERATED ALWAYS AS (translate(lower(coalesce(authority_name, '')), 'άέήίόύώϊϋΐΰς', 'αεηιουωιυιυσ')) STORED;