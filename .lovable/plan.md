

## Plan: User Registration, Premium Resources, Notifications & Upsell System

### The Strategy

Build a freemium model where anonymous visitors see enough value to register, registered users get meaningful extras, and strategically placed upsell prompts drive conversions to premium tiers.

---

### Tier Structure

```text
ANONYMOUS (no account)          REGISTERED (free)              PREMIUM (paid)
─────────────────────          ──────────────────              ──────────────────
3 articles/day                 Unlimited articles              Everything in Free
Headlines only on feeds        Full intelligence cards         PDF report exports
No tool results saving         Save tool results               Custom alerts & digests
No alerts                      Weekly email digest             Daily briefing email
See upsell prompts             Bookmark articles               API access
                               Monthly compliance summary      Priority directory listing
                               Access regulatory calendar      White-label reports
                               Community Q&A access            1-on-1 advisory booking
```

---

### What to Build

#### 1. Authentication System (Supabase Auth)
- Login/Register modal (email + Google OAuth)
- Auth context wrapping the app
- `profiles` table (name, company, role, tier: free/premium)
- `user_roles` table for admin access (editorial dashboard later)
- Protected route wrapper for premium content

#### 2. Registration Gate Components
- **`<ContentGate>`** — wraps articles/tool results; shows teaser + blurred content + "Register free to read" CTA for anonymous users
- **`<ToolResultGate>`** — after completing any SME tool (VAT calc, GDPR checker, etc.), prompt: "Register to save & export your results"
- **`<ArticleCounter>`** — tracks daily article views in localStorage; shows "2 of 3 free articles remaining" banner

#### 3. Upsell Banner Placements (using existing banner system)

Strategic placement across the portal:

| Location | Banner Type | Message |
|----------|-------------|---------|
| After 2nd Intelligence Card in feed | `InsightBanner` | "Get daily briefings delivered to your inbox — Register free" |
| Below each SME tool result | `OperationaliseBanner` | "Save results, track progress over time — Upgrade to Premium" |
| Sidebar on article pages | `SidebarBanner` | "Premium: Export compliance reports as PDF" |
| Between vertical sections on homepage | `LeaderboardBanner` | "BusinessHub Premium — Your competitive edge in Cyprus" |
| Bottom of FinTech/Compliance hub pages | `NativeAdCard` | "Sponsored: Advisory services for [vertical]" (revenue) |
| Footer area, above PartnerStrip | New `PremiumCTABanner` | Full-width premium pitch with feature comparison |
| Profile pages (WhoIsWho) | Inline prompt | "Claim this profile — Register to manage your listing" |

#### 4. Notification System
- **Database**: `user_preferences` table (digest frequency, verticals of interest, alert types)
- **Email notifications** via Lovable Email:
  - Weekly digest (free tier) — top 5 articles from selected verticals
  - Daily briefing (premium) — full intelligence cards + regulatory calendar
  - Breaking alerts (premium) — new regulation, major deal, critical compliance update
- **In-app notification bell** (already exists in TopNavigation as icon):
  - `notifications` table (user_id, type, title, read, created_at)
  - Dropdown showing recent alerts, new articles in your verticals, tool reminders
  - Badge count on bell icon

#### 5. Saved Items & Dashboard
- **`/dashboard`** page for registered users:
  - Saved articles & bookmarks
  - Tool results history (GDPR scores, Digital Maturity over time)
  - Notification preferences
  - Subscription status
- **Bookmark button** on every article card (heart/bookmark icon, visible only to logged-in users)

#### 6. Premium Upsell Triggers (behavioral)
- After 3rd article view: "You're reading a lot — get unlimited access"
- After completing 2 SME tools: "Track your compliance journey over time"
- After visiting 3+ verticals in one session: "Get a personalized daily briefing"
- Monthly: "Your free compliance summary is ready" email (with premium teaser)

---

### Files to Create/Modify

**New files (~12):**
- `src/contexts/AuthContext.tsx` — auth state provider
- `src/components/auth/LoginModal.tsx` — login/register modal
- `src/components/auth/ContentGate.tsx` — content paywall component
- `src/components/auth/ToolResultGate.tsx` — tool result save prompt
- `src/components/auth/ArticleCounter.tsx` — free article limit banner
- `src/components/banners/PremiumCTABanner.tsx` — full-width premium pitch
- `src/components/notifications/NotificationDropdown.tsx` — bell dropdown
- `src/pages/DashboardPage.tsx` — user dashboard
- Supabase migration for profiles, notifications, user_preferences, saved_items tables

**Modified files (~8):**
- `src/App.tsx` — add AuthProvider, Dashboard route
- `src/components/TopNavigation.tsx` — login/register buttons, notification bell with badge
- `src/components/hub/HubNavigation.tsx` — same auth buttons
- `src/components/IntelligenceFeed.tsx` — insert upsell banner after 2nd card
- `src/components/IntelligenceCard.tsx` — add bookmark button
- `src/pages/Index.tsx` — add PremiumCTABanner placement
- `src/pages/SMEPage.tsx` — add ToolResultGate after each tool
- `src/pages/FinTechPage.tsx` & `CompliancePage.tsx` — add upsell banners

---

### Implementation Order

1. Supabase setup (tables, RLS, auth config)
2. Auth context + Login modal
3. Content gating components (ContentGate, ArticleCounter)
4. Upsell banners placed across all pages
5. Notification system (DB + in-app dropdown)
6. User dashboard page
7. Email digest setup (Lovable Email)

