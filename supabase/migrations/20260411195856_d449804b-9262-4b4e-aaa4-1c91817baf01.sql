
UPDATE public.directory_companies SET organisation_status = 'Reminder Letter Sent' WHERE organisation_status = 'Στάληκε επιστολή Υπενθύμισης';
UPDATE public.directory_companies SET organisation_status = 'Quarterly Notice Published' WHERE organisation_status = 'Δημοσιεύτηκε η Τρίμηνη';
UPDATE public.directory_companies SET organisation_status = 'Voluntary Liquidation by Shareholders' WHERE organisation_status = 'Εκούσια Εκκαθάριση από Μετόχους';
UPDATE public.directory_companies SET organisation_status = 'Dissolved (Voluntary Liquidation Completed)' WHERE organisation_status = 'Διάλυση λόγω Ολοκλήρωσης Εκούσιας Εκκαθάρισης';
UPDATE public.directory_companies SET organisation_status = 'Dissolved (Merger)' WHERE organisation_status = 'Διαλύθηκε λόγω συγχώνευσης';
UPDATE public.directory_companies SET organisation_status = 'Under Receivership' WHERE organisation_status = 'Υπο Διαχείριση';
UPDATE public.directory_companies SET organisation_status = 'Court-Ordered Liquidation' WHERE organisation_status = 'Εκκαθάριση με Διάταγμα Δικαστηρίου';
UPDATE public.directory_companies SET organisation_status = 'Voluntary Liquidation by Creditors' WHERE organisation_status = 'Εκούσια Εκκαθάριση από Πιστωτές';
UPDATE public.directory_companies SET organisation_status = 'Provisional Liquidator Appointed' WHERE organisation_status = 'Διορισμός Προσωρινού Εκκαθαριστή';
UPDATE public.directory_companies SET organisation_status = 'European Company' WHERE organisation_status = 'Ευρωπαϊκή Εταιρεία';
UPDATE public.directory_companies SET organisation_status = 'Under Receivership & Liquidation' WHERE organisation_status = 'Υπο Διαχείριση & Υπο Εκκαθάριση';
UPDATE public.directory_companies SET organisation_type = 'Company' WHERE organisation_type = 'Εταιρεία';
