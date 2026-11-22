# Greece edition fully in English from the International edition

## Goal
Every link from the International edition (menu, switcher, edition cards, "More" links) opens the Greece pages in English, and the visitor stays in English while moving around the Greece edition, until they choose EL.

## What changes
1. **All International → Greece links open in English**
   - International menu "Markets → Greece edition", the International/Cyprus/Greece switcher (when on International), the "Greece" market column "More" link and edition cards all add `?lang=en`.
   - Greek visitors coming from the Greece edition itself keep Greek.
2. **English stays on while browsing Greece**
   - Every link inside the Greece edition (section bar, Greece header menu, story links, Opportunities, Business Pulse, "Compare with Cyprus") carries the current language, so a page opened in English keeps English on every click and on refresh/shared links.
   - Greece story pages opened from an English Greece page show the English text.
3. **Every Greece section has English content**
   - Check all seven sections, Business Pulse, Opportunities and story pages in EN: headings, labels, dates, empty states, tabs (e.g. Announcements "deals") and the Greece menu all in English.
   - Stories without an English version are hidden in EN (as already done for Greek), and any remaining Greek-only items are queued for translation by the existing scheduled translator.
4. **Page language for search engines**
   - English Greece pages set `lang="en"` and English page titles/descriptions.

## Checks
- Tests: International menu/switcher Greece links include `lang=en`; Greece internal links keep the chosen language.
- Browser check: open each Greece link from International, click through 3–4 Greece pages and a story, confirm no Greek interface text; then switch EL and confirm Greek.

## Technical details
- `networkEditions.greeceHome(host, lang)` uses `grEnHref` when the source edition is International; `siteSections.intlNav` uses it.
- Add `grLangHref(path, lang)` in `src/lib/edition.ts`; use it in `GreecePage.tsx` Shell/StoryList/MiniCard, `greeceNav(lang)`, Opportunities and BusinessPulse.
- Article page reads `?lang=` / stored Greece language to pick `title`/`title_el` for Greece stories.
- Update `networkEditions.test.ts` and add `greeceEnglishLinks.test.ts`.
