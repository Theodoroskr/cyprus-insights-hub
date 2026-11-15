alter table public.cna_articles add column if not exists featured_until timestamptz;
comment on column public.cna_articles.featured_until is 'Editor highlight: while in the future, the story is kept as the homepage/hub lead.';
create index if not exists cna_articles_featured_until_idx on public.cna_articles (featured_until) where featured_until is not null;