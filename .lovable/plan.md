# Import the 2021 hotels PDF into the venue import preview

The PDF ("Conference Centres & Hotels with Meeting Rooms", dated 13 April 2021) lists about 36 hotels across Nicosia, Limassol, Paphos, Larnaca, Ayia Napa, Protaras and the hill resorts. For each hotel it gives a phone, website, address and contact person. It also gives the number of meeting rooms and the hotel's **maximum** capacity by layout (theatre, classroom, reception, U-shape, banquet), plus bedrooms and a description.

It does **not** name individual meeting rooms or give capacities per room.

## What I'll do
1. **Store the source:** save the PDF privately and record it as an import batch with its date (13 Apr 2021) and import date.
2. **Read every hotel:** extract name, star rating, district, locality, website, address, phone, number of meeting rooms, maximum capacity by layout, bedrooms and the PDF page. I'll use a fixed reader for the PDF's layout, not AI, and leave anything missing blank (for example capacities given as "500-600" keep the lower figure and note the range).
3. **Propose matches:** compare each hotel with existing venue profiles by website, name and locality. Each row is marked as a new venue, a match, a possible duplicate or a possible renamed property. Cleopatra Hotel is not in the PDF; I'll check other overlaps when the rows are matched.
4. **Flag what needs checking:** every row is flagged for current name, operating status, website, business contact and room capacities, because the data is from 2021. Nothing is published.
5. **Show it in the Venues tab → Import:** staff review each row and choose "Create draft", "Merge into match" or "Skip".
6. **Then report back:** I'll give the number of hotels read, the matches and possible duplicates, and any rows the reader couldn't fully parse.

## Two handling choices
- **Capacities:** the PDF gives only each hotel's largest figure per layout. I'll keep them as a "Largest room (2021 figure)" line inside the draft, clearly marked, not as named rooms. Staff or the owner replace it with real room-by-room figures before the room table is published.
- **Contact people:** the PDF names individual staff, with personal emails. I'll keep these in the import record for staff only, never on public pages. Shared addresses such as events@ or info@ can be offered as the business contact once confirmed.

## Technical details
- Parse with `pdftotext -layout` in the sandbox, splitting blocks on "Hotel Name:". District comes from the section headings and the page number from page breaks.
- Insert one `venue_import_batches` row and N `venue_import_rows` rows: `raw` holds the full block, `needs_verification` holds all five publish fields, and match status comes from `matchImportRow`.
- The PDF goes into the private `venue-submissions` bucket under `imports/`.
- No schema changes.
