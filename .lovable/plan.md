# Launch the BusinessHub.cy newsletter

## Goal
Turn Facebook visitors into readers who come back: a real email briefing they can sign up for from any page, especially story pages.

## What changes for visitors
1. **Sign-up box on every story page.** A short "Get the Cyprus business briefing" box under each story, plus a slim version in the story sidebar. Email address, then optional name/company. Same box stays on the homepage.
2. **Honest wording.** The form stops saying "when the briefing launches". It says what they get: daily (weekdays, morning Cyprus time) or weekly (Friday) choice, topics (Business, Compliance, FinTech, RegTech).
3. **Confirm your email.** After signing up, the person gets one confirmation email with a button; only confirmed addresses receive the briefing. This keeps the list clean and protects inbox delivery.
4. **The briefing itself.** Top 5–8 English stories from the last 24 hours (or week), mixed across sources like the homepage, each with headline, one-line summary and link. Every link tagged so visits show as "newsletter" in analytics.
5. **Unsubscribe in one click**, on every email.
6. **Admin view.** Subscriber count, confirmed vs pending, last send, open the latest briefing in the browser.

## What you need to do
- **Add email records for businesshub.cy** in your domain settings (I'll show the exact records). Needed for the confirmation email.
- **Choose a newsletter sending service.** Lovable's built-in email can send the confirmation email, but not list emails like a daily briefing (that would hurt delivery for all your emails). The briefing needs a dedicated service such as Brevo, Mailchimp or Resend (free tiers cover a few thousand subscribers). I'll ask which one once we start, and you'll connect your account.

## Order of work
1. Sign-up boxes on story pages + new wording (works immediately, collects emails).
2. Email domain setup + confirmation email.
3. Connect the newsletter service, build the daily/weekly briefing and schedule it.
4. Admin view and a test send to you.

## Technical details
- Reuse `newsletter_subscribers` (existing RLS insert policy); add confirmation token / confirmed_at flow via an edge function.
- Confirmation email via Lovable app emails (one recipient, triggered by their sign-up).
- Briefing built from `useBlendedNews`-equivalent server logic over published `cna_articles`, sent through the chosen provider's connector; scheduled with pg_cron, guarded by `requireTrustedCaller`; one send per subscriber per period logged to avoid duplicates.
- UTM: `utm_source=newsletter&utm_medium=email`.
