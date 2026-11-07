# Launch readiness: where the Cyprus Edition stands

## Verdict
Good to go live as a **free news, directory and intelligence portal**. Not ready to take money yet. Hide or fix a few things first (about 1–2 days of work).

## What is solid (verified today)
- News: 1,040 published articles, 127 new in the last 3 days, translated to English, blended feed.
- Directory: ~55k companies, real CySEC and Central Bank licences auto-matched, aliases working.
- Ticker quotes fresh, trade data and regulatory calendar update monthly.
- Review queue nearly empty (4 pending).
- Privacy, terms, cookie pages and cookie banner exist; sitemap and robots exist.

## Must fix before going live
1. **Anyone signed in can make themselves "Premium"** (confirmed: users may edit their own profile row, including the tier). Lock the tier so only admins/payment can change it.
2. **Everyone's profile is publicly readable** (names, companies, job titles). Restrict to own profile + admins.
3. **Banner image storage**: any signed-in user can upload, replace or delete banner files. Restrict to admins.
4. **"Test digest" button** sends notifications to other users. Scope it to the person clicking.
5. **Regulated entities show contact emails publicly** – hide that column from public reads.
6. **Leaked-password protection** off – turn on.
7. **Sitemap** lists a non-existent page (`/directory-home`) and child sitemap links point to a domain that isn't live yet – fix both.

## Hide for now (avoid until finished)
- **€45 KYB report purchase**: the checkout step doesn't exist; success page says "Payment successful" regardless. Replace the button with "Request a report" (enquiry form) until payments are built.
- **Premium upgrade buttons**: lead nowhere. Replace with "Coming soon / join waitlist". Premium blur also still sends the content to the browser – acceptable only while nothing is sold.
- **Newsletter promise**: signups are saved but no email is ever sent. Change copy to "We'll notify you when briefings launch", or set up email (see later).
- **Old `/profile/:id` pages**: use static demo people and made-up figures (e.g. €12M round, €500K fines). Remove route / redirect to Who's Who.
- **SME funding list**: hardcoded "Open" calls and budgets – label as indicative or hide.
- "Coming soon" stubs (sponsored article body, RegTech vendor directory, Resources library) – hide those sections.

## Can launch as-is (acceptable)
- SME calculators (clearly tools, not official advice – add a disclaimer line).
- Public read of directory, news, trade data (intended public content).
- Email/password sign-in only (Google sign-in can come later).

## After launch (phase 2)
- Stripe checkout + webhook + PDF generation for KYB and Premium; server-side premium content.
- Real email sending (domain setup, digests, confirmations).
- Google sign-in.
- Connect businesshub.cy domain (DNS still pending).
- Fix 7 failing news sources.

## Technical details
- Migration: profiles UPDATE policy with check preventing `tier` change (trigger rejecting tier changes unless admin/service role); SELECT policy `auth.uid() = user_id or has_role(admin)`; check public pages that read profiles still work.
- Storage policies on `banner-images`: insert/update/delete only `has_role(auth.uid(),'admin')`; disable listing.
- `regulated_entities.contact_email`: revoke column select from anon/authenticated.
- `send-digest`: accept `user_id` from JWT for test mode, only notify that user.
- Sitemap function: drop `/directory-home`, build child URLs from the function's own URL until domain is live.
- UI: KYB CTA → enquiry dialog (stored in existing `correction_requests`-style table or new `report_requests`), premium buttons → waitlist, newsletter copy, remove `ProfilePage` route + `knowledgeGraph.ts` usage, hide stub sections.
- Enable leaked-password protection in auth settings. Rerun security scan.
