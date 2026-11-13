# Conference & Meeting Venues: import, owner claims and paid upgrades

Builds on the existing Conference Venues section on TourismHub (1 venue and 4 rooms today, plus the quote form). Each physical venue keeps one page, in English and Greek.

Note: the hotels PDF has not arrived. Only the brief came through again, so please attach `Hotels_with_Conference_Facilites_13_4_21.pdf`. Everything else can be built first, and the import runs as soon as the file is here.

## 1. PDF import preview (admin)
- Upload the PDF in the dashboard. It is kept privately, with its import date.
- Each row shows the venue, its locality, its rooms and seating by layout, and the PDF page it came from.
- Each row also shows its proposed match: a new venue, a match to an existing profile, a possible duplicate, or a possible renamed property. Matching uses name, locality, and the website or address.
- Everything imports as a draft. Blanks stay blank, and fields that still need checking are listed. Name, operating status, website, business contact and room capacities must be confirmed before publishing.
- Later imports never overwrite verified corrections from owners or staff.

## 2. Public directory
- Search and filter by district, venue type, number of delegates and seating layout. When both delegates and a layout are chosen, a venue appears only if one of its rooms fits that many people in that layout.
- Each venue page shows only verified details: location, website, approved logo and photos, facilities, accessibility, parking, catering and AV. A room table lists theatre, classroom, boardroom, banquet, U-shape and cocktail, with a "last verified" date.
- "Request a Quote" stays as today. It appears only when a confirmed venue contact exists, and the recipient is looked up on the server. Planner enquiries stay separate from owner requests.

## 3. Owner claims and updates
- Every venue page gets "Claim or Update This Listing" and "Contact BusinessHub".
- The form collects name, role, organisation, business email, details and optional attachments.
- A representative is verified by a code sent to an email on the venue's own domain, or approved by an admin. Verified representatives get a "My venues" page and can edit only their own venues.
- The free listing allows basic corrections and one approved logo. Extra photos can be sent for review, with a permission tick, and the page shows what each plan includes. Only images and PDFs up to 5 MB are accepted.
- Submissions stay private until approved, and the public page stays unchanged meanwhile.

## 4. Paid upgrades (staff quote or payment link, as you chose)
- "Request a Paid Upgrade" goes on the venue page and in "My venues". It shows the current plan and the benefits staff have set: a bigger gallery, a cover image, a brochure, a richer profile and "Featured" placement.
- Request stages: received, under review, awaiting payment, active, declined, expired.
- An admin marks the payment received and sets the term dates. Benefits then switch on, and paid venues are labelled "Featured".
- When the term ends, the listing returns to the free display and approved media is kept.

## 5. Staff queue
- One dashboard tab for claims, corrections, logo and photo approvals, and upgrade requests. It shows the venue, representative, status, payment and change history.
- Plan names, benefits and prices are editable by admins.

## Tests and report
- Automated tests check the room-fit filter, the "never overwrite verified" rule, that owners can edit only their own venues, that unapproved files stay private, the plan expiry, and the quote recipient.
- One full test of a single venue: PDF import, check, publish, claim, logo approval and a manual paid upgrade. Online card checkout is skipped, per your choice.
- The signed-in steps can only be tested if a test account is available.
- The report will give the import counts, unresolved matches, fields still to verify, and what is needed to send emails. Sending the owner verification code and quote emails needs a verified email domain, which is not set up yet. Until then, admin approval is the fallback.

## Technical details
- New tables: venue_import_batches/rows (with source page and match status), venue_claims, venue_representatives (user_id, listing_id, verified), venue_change_requests (JSON diff, status), venue_media (private bucket until approved), venue_plans (editable), venue_upgrade_requests (status, term dates, payment reference with a unique key so duplicates are ignored).
- RLS covers all of these: an owner can access a row only through venue_representatives, and admins through has_role. A new private storage bucket holds submissions, and approval copies a file into public storage.
- Room fields reuse tour_venue_rooms. Verified fields are tracked in `verified_fields` on tour_listings, and the importer skips them.
- PDF parsing runs once in the sandbox (pdfplumber), and the parsed rows go into the preview tables. The AI is not involved.
