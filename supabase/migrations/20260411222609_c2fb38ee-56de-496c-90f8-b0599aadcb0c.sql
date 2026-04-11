
-- Create company watchlist table
CREATE TABLE public.company_watchlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_type TEXT NOT NULL DEFAULT 'directory', -- 'directory' or 'editorial'
  company_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  company_slug TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique constraint: one watch per user per company
ALTER TABLE public.company_watchlist ADD CONSTRAINT unique_user_company UNIQUE (user_id, company_id);

-- Enable RLS
ALTER TABLE public.company_watchlist ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own watchlist"
ON public.company_watchlist FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own watchlist"
ON public.company_watchlist FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watchlist"
ON public.company_watchlist FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can remove from own watchlist"
ON public.company_watchlist FOR DELETE
USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_watchlist_user ON public.company_watchlist (user_id);
CREATE INDEX idx_watchlist_company ON public.company_watchlist (company_id);
