# Corruption index card on the homepage

## What you'll see
A compact card on the Cyprus homepage, placed just under the directory preview and before the mid-page banner:

- Title: "Corruption Perceptions Index 2025"
- Cyprus score (55/100) with its rank (tied 49th of 182) and the change from last year
- Small comparison line: EU average 62, Greece 50
- "Source: Transparency International" note
- Button: "See the full index", which opens the Cyprus corruption page

The figures come straight from the published index data. If an edition isn't published yet, the card shows the last published one. If nothing is published, the card stays hidden.

## Technical details
- New `src/components/home/CpiHomeCard.tsx`: reads the latest published `cpi_editions` row plus the CYP and GRC `cpi_results` rows (public RLS already limits these to published data), and reuses `fmtScore`, `rankLabel` and `cpiPath` from `src/lib/cpi.ts`.
- Insert it in `src/pages/Index.tsx` after `<DirectoryCtaBanner />`.
- Use semantic tokens with the Compliance slate-blue accent.
- Add a small test for the YoY and "hide when nothing is published" logic.
