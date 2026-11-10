UPDATE public.fin_lit_findings SET status = 'approved', approved_at = now() WHERE status <> 'approved';
