# Mastercard demo: interactive scores, explanations and a new chart

The private demo already reuses the Financial Literacy score and figure blocks, so it now has the tappable score bars, the animated 56/100 dial and the ⓘ notes on figure cards. This plan builds on that for the demo page only.

## What changes on the demo page

1. **Interactive headline figures (dark top banner)**
   - The three figures (56/100, 17%, 34%) become tappable tiles.
   - Tapping a tile opens a short note explaining what it means, in English and Greek. The note comes from the same explanations used on the Financial Literacy pages.

2. **Clearer score section**
   - A short line above the scores: "Tap any score to see what it means".
   - Each score bar shows the OECD target (70) as a marker where one applies.

3. **New chart: "Cyprus vs Europe over time"**
   - A full line chart with Cyprus as a solid red line and the EU or euro area as a dashed charcoal line, in Mastercard colours.
   - Buttons above the chart switch the figure: Inflation, Food prices, Mortgage rate, Deposit rate, Saving rate.
   - A year filter (from 2019 onwards) and hover tooltips show each month's or year's value.
   - Below the chart, a sentence in plain words explains the selected figure.

4. **Small "Cyprus vs EU at a glance" chart**
   - Bars comparing the latest Cyprus figure with the EU for saving rate, unexpected expenses and inflation.

## What does not change
- Public Financial Literacy pages, data sources, calculators, quiz and simulator.
- The demo stays admin-only and keeps the partnership disclaimer.

## Technical details
- New `DemoTrendChart` and `DemoCompareBars` components in `src/components/demo/`. They use existing `useFinLitStats` data, recharts, and `--mc-*` colour tokens.
- The hero tiles become buttons with an expandable note from `scoreExplain` (`finlitExplain.ts`).
- The only page changed is `MastercardDemoPage.tsx`.
- I'll check it on desktop and phone as an admin.
