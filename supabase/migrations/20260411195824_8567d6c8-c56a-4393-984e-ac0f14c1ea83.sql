
-- Translate main Greek city names to English
UPDATE public.directory_companies SET city = 'Nicosia' WHERE city IN ('Λευκωσία', 'Λευλωσία');
UPDATE public.directory_companies SET city = 'Limassol' WHERE city = 'Λεμεσός';
UPDATE public.directory_companies SET city = 'Larnaca' WHERE city IN ('Λάρνακα', 'Λάρνακος');
UPDATE public.directory_companies SET city = 'Paphos' WHERE city IN ('Πάφος', 'Κάτω Πάφος');
UPDATE public.directory_companies SET city = 'Famagusta' WHERE city IN ('Αμμόχωστος', 'Αμμοχωστος');
UPDATE public.directory_companies SET city = 'Paralimni' WHERE city = 'Παραλίμνι';
UPDATE public.directory_companies SET city = 'Dali' WHERE city = 'Δάλι (Ηλιούπολη)';
UPDATE public.directory_companies SET city = 'Lythrodontas' WHERE city = 'Λυθροδόντας';

-- Fix postal-code-only entries (set to null)
UPDATE public.directory_companies SET city = NULL, city_slug = NULL 
WHERE city ~ '^\d+$';

-- Also translate organisation_status common values
UPDATE public.directory_companies SET organisation_status = 'Active' WHERE organisation_status = 'Εγγεγραμμένη';
UPDATE public.directory_companies SET organisation_status = 'Dissolved' WHERE organisation_status IN ('Διαγραμμένη', 'Διαλυμένη');
UPDATE public.directory_companies SET organisation_status = 'In Dissolution' WHERE organisation_status = 'Υπό Διάλυση';
UPDATE public.directory_companies SET organisation_status = 'Stricken Off' WHERE organisation_status = 'Διαγεγραμμένη';

-- Translate organisation_type common values  
UPDATE public.directory_companies SET organisation_type = 'Limited Company' WHERE organisation_type = 'Εταιρεία Περιορισμένης Ευθύνης';
UPDATE public.directory_companies SET organisation_type = 'Partnership' WHERE organisation_type = 'Συνεταιρισμός';
UPDATE public.directory_companies SET organisation_type = 'Sole Proprietorship' WHERE organisation_type = 'Ατομική Επιχείρηση';
UPDATE public.directory_companies SET organisation_type = 'Non-Profit Organisation' WHERE organisation_type = 'Μη Κερδοσκοπικός Οργανισμός';
UPDATE public.directory_companies SET organisation_type = 'Branch of Foreign Company' WHERE organisation_type = 'Υποκατάστημα Αλλοδαπής Εταιρείας';
UPDATE public.directory_companies SET organisation_type = 'European Company (SE)' WHERE organisation_type = 'Ευρωπαϊκή Εταιρεία (SE)';
