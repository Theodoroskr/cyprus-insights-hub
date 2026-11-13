/** Who's Who is in private build: only admins can see its pages and people links until launch. */
export const WHOISWHO_PUBLIC = false;

/** Venue "Request a Quote" sends to the venue by email. Stays false until an email sender domain is verified and wired
 * (mirrors QUOTE_EMAIL_READY in supabase/functions/_shared/venueQuote.ts); while false the button is disabled everywhere. */
export const VENUE_QUOTE_EMAIL_READY = false;
