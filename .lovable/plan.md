# Add the EIB Investment Survey 2026 cybersecurity story

## Finding
No, we didn't collect it. The only related EIB item we have is an unpublished draft about Exein, a cybersecurity company. We watch EIB press releases, but this survey post came from EIB's social media ("link in bio"). Survey reports go out on EIB's publications pages, which we don't watch.

## What I will do
1. Find the official EIB Investment Survey 2026 page and check the figures (8% had a serious cyber incident, 82% are investing in protection).
2. Add it as a story in the usual "What happened / Why it matters / What to do" format, filed under Compliance/RegTech (cyber), with an EU badge and a link to the EIB source. It goes in as a draft for you to approve.
3. Start watching EIB's publications and surveys pages too, so future surveys come in automatically.

## Technical details
- Add a scrape path for the EIB publications listing to the `eib` content source (stays under the existing access rules).
- Insert one `cna_articles` draft with source_url = the official EIB survey page; figures only from that page.
