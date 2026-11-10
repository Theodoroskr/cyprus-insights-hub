# Smaller "Sources & methodology" section

On the Financial Literacy **Sources & Methodology** page, the "How the figures work" list will be made more compact, and one item removed.

## Changes
- **Smaller text:** the section heading and the six question rows (OECD survey method, Survey year vs publication year, Older Cyprus surveys, Eurostat definitions, CYSTAT data, Update frequency) use smaller text and tighter spacing. The answers become slightly smaller too.
- **Remove "Cyprus vs EU limits"** along with its text. This also removes the note about unpublished figures being shown as "Data not available" rather than zero.
- Nothing else on the page changes. The datasets table and source links stay as they are.

## Technical details
- In `EducationAndMethod.tsx` `Methodology()`:
  - Drop the last item.
  - Set `AccordionTrigger` to `text-sm py-2` and content to `text-xs`.
- In `MethodologyPage`, set the "How the figures work" heading to a smaller size.
