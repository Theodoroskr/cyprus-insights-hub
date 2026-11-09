# "Something went wrong" error on the homepage

## What happened
- The error appeared briefly while the preview restarted after the last change. During the restart, the top menu loaded before the page's navigation was ready, so the page crashed.
- I've opened the homepage again in a test browser: it now loads normally (ticker, menu and stories) with no errors.

## What to do
- Reload the preview once. No change to the site is needed.
- If the error comes back after reloading, approve this plan and I'll investigate further and fix the cause in the top menu and page navigation.

## Technical details
- Logged error: `useNavigate() may be used only in the context of a <Router>` in `TopNavigation`, raised from a re-optimised dependency bundle (`react-router-dom.mjs?v=...`) during the dev-server restart. It happens when two copies of the router load at once, not because of a code bug.
- A fresh headless load of `/` showed no page errors.
