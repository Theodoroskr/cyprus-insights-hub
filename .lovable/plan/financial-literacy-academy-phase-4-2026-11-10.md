# Financial Literacy Academy (Phase 4)

Defaults used (the questions were skipped):
- BusinessHub writes the English and Greek drafts. Every lesson and quiz stays unpublished until an admin approves it.
- Certificates are anonymous only. No personal details are stored.
- The IPE and Seminario.cy section is built but hidden until course details are approved.
- Delivered in stages. Each stage is checked before the next one starts.

## 1. Assessment of what exists today (reused, not rebuilt)

| Already built | How the Academy uses it |
|---|---|
| Financial Literacy page with its sources and methodology section | Becomes the hub page, with links into the Academy |
| The six calculators | Placed inside lessons; no copies |
| Eurostat and CYSTAT figures, plus the approved OECD results | "Official figure" boxes inside lessons |
| Admin roles, the approval pattern and the editorial dashboard | Academy admin tab |
| The anonymous click counter (already used for Mastercard) | Academy usage statistics |
| Search titles, canonical addresses, the sitemap generator | New pages added to all three |

Missing today: programmes, lessons, quizzes, the assessment, recommendations, certificates, campaigns and Academy statistics.

## 2. Pages

```text
/financial-literacy                      existing hub (+ Academy section)
/financial-literacy/academy              Academy landing
/financial-literacy/academy/:programme   programme page (modules, duration, objectives)
/financial-literacy/academy/:programme/:lesson   lesson (text, calculator, official figure, quiz)
/financial-literacy/assessment           knowledge check (beginner / intermediate / advanced)
/financial-literacy/certificate/:ref     check a completion reference
/financial-literacy/campaigns/:slug      campaign page (stage 4)
```
Each page gets English and Greek titles and search descriptions, its own canonical address, learning-course data for search engines, and a sitemap entry. Only published content is included.

## 3. Stages

**Stage A – Academy foundation**
- Database: programmes, modules/lessons (English and Greek text, level, minutes, objectives, attached calculator, attached official figure, status `draft/review/published/archived`, publish date) and lesson revisions.
- Public pages show only published lessons whose publish date has passed. The database enforces this.
- Admin "Academy" tab: create, edit, review, schedule and archive lessons, with revision history and supporting file uploads.
- Draft content for 5 programmes and 37 modules, entered as drafts for you to review.
  - Credit report lessons describe general practice only.
  - Investment lessons are education only, with a clear notice.
- An English/Greek switch on Academy pages.

**Stage B – Assessment and recommendations**
- A question bank (English and Greek, with explanations). Each question has a category and a level, and 20 are drawn per level.
- Marking happens in the visitor's browser; no answers are sent anywhere.
- The results screen shows a knowledge score, how the visitor did in each category, and recommended lessons. Recommendations follow fixed rules: a low result in a category points to that category's programme.
- A permanent notice says this is a BusinessHub knowledge check, not an OECD test, and that the score cannot be compared with OECD results.
- Lesson quizzes use the same question bank and have pass marks set by admins.

**Stage C – Progress and certificates**
- Progress is saved in the visitor's own browser by default. Visitors can wipe it with one click.
- Completing a programme creates an anonymous "Certificate of Completion" PDF with a reference code. The only record kept is the reference, programme and date, so the verification page works.
- The wording always says "Certificate of Completion", never "Professional Certification" or "accredited".

**Stage D – Campaigns, partner courses and statistics**
- Campaign pages (Financial Literacy Month, Youth, SMEs) built from published lessons and articles, with schedules.
- A partner course section (IPE and Seminario.cy), hidden by default. Paid courses are labelled "Paid".
- An admin-only statistics screen with anonymous totals: page and programme visits, lesson completions, assessment attempts and average score by category, calculator uses, language choice and completion rates. Nothing is tied to a person, and figures are counted only after cookie consent.

## 4. Privacy and safety
- No sign-in is required.
- No questions about income or bank details, and no individual profiles.
- Anonymous statistics are kept for 24 months.
- Unpublished content can't be read by visitors, and only admins can change content (both enforced by the database).
- Pages target WCAG 2.2 AA: keyboard-friendly quizzes, labelled controls and good contrast.
- All lessons and questions are original BusinessHub text. No OECD or commercial material is copied.

## Technical details
- New tables: `academy_programmes`, `academy_lessons`, `academy_lesson_revisions`, `academy_questions`, `academy_certificates` (reference, programme, date only), `academy_campaigns`, `academy_partner_courses`, and `academy_events` (anonymous counts).
  - Each table gets grants, RLS that allows public reads of published rows only, and `has_role` admin writes.
  - Revisions are recorded by a trigger.
- Certificates are created by an edge function that checks completion data sent from the browser and returns the reference. The PDF is generated in the browser.
- The `Calculators` component gets an optional `only` prop to show a single calculator. StatCard/SurveyScores are reused for lesson figures.
- Tests: assessment scoring, recommendation rules, the draw of 20 questions per level, and the published-only filter.
- Approval points: you approve each stage's database change before it is applied, and nothing is published until you approve it.

## Deliverables
At the end, an assessment report (all 14 deliverables, including test results, limitations and a Phase 5 roadmap) saved as a document.
