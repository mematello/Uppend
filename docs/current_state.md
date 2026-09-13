# Uppend — Current State

*This file is the single source of truth for "what's true right now." It
is rewritten in place at the close of every session — not appended to.
Resolved items are removed here and folded into changelog.md /
decisions.md instead. Replaces the handoff_context_sessionN.md chain.
See architecture.md / decisions.md / schema.md / changelog.md for
anything not called out below as recently changed.*

*Last updated: 2026-09-13 (Session 16)*

## 1. Confirmed working / shipped

- **Uppend Rebrand:** Rebranded from ApplyFlow to Uppend across UI, metadata, local storage, and documentation. Merged to main via standard `--no-ff` commit.
- **IndexedDB Migration:** Deployed `migrateLegacyDb()` to securely transfer local user data from `applyflow_local` to `uppend_local` using an idempotent write-then-delete approach.
- **Gmail SMTP Account Migration:** Successfully migrated to the new Gmail sender address across Vercel and Supabase using an account rename to preserve sender reputation.

## 2. Open / blocking

- **Branch `fix/post-delete-session-and-local-merge`**: implementation complete for both issues (bfcache pageshow re-validation in SettingsClient.tsx; intent-threaded /migrate confirmation prompt with 3-way decline handling in migrate/page.tsx, login/page.tsx, signup/page.tsx, auth/callback/route.ts). Verified via real git diff and real npm run build (clean compile, no new warnings, /api/extract and /api/match confirmed untouched via diff).
- **IMPORTANT**: Real-device verification (bfcache repro, all three prompt buttons on both signup/login, IndexedDB state after each, iOS Safari specifically) has NOT been confirmed as completed. Do not mark this branch as merged or fully verified — it remains blocking pending that pass.
- **Two minor non-blocking observations carried over**: (1) bfcache redirect's `?message=Session+expired` param may not be read/displayed by login/page.tsx — cosmetic; (2) checkLocalData catch block in migrate/page.tsx now redirects silently on local-data-read failure with no error message shown — narrow failure case, low stakes.
- **Cron reminders failing in production**: `/api/cron/reminders` has failed consistently with 500 Internal Server Error per cron-job.org notifications, recurring across at least 09/11 and 09/13/2026. Not yet investigated. Needs root-cause investigation before anything else touches that route.
- **Shared DB Environment Gap:** Testing branches currently risks polluting production data. We need to formalize separated environments (e.g., local mock or staging database).
- **Legal Pages:** `/terms` and `/privacy` are still draft-pending lawyer review. Discretionary, user's call on launch timing.
- **AGENTS.md Outdated Context:** The "Project Context" section of `AGENTS.md` still reads "ApplyFlow is an AI-powered job application tracker...". This was intentionally skipped during the rebrand but needs a manual update.

## 3. Next steps, priority order

**Backlog:**
1. JD URL-fetching feature — large, touches a Protected AI Route, needs its own full plan cycle, don't bundle with smaller tasks.

## 4. Future plans (not yet scoped)

- **Gamification:** application goals and related mechanics (e.g. streaks, targets, progress tracking) to motivate consistent job-search activity. Early-stage idea, not yet scoped or planned — flagged here for future discussion, not an active backlog item.
- Quick access to an application's job link without opening the full detail page (e.g. right-click/context-menu shortcut on the dashboard table, or other UX alternatives) — idea stage, not yet scoped.
- Dashboard table state persistence: retain sort column/direction and current page across navigation (e.g. viewing an application, visiting settings) for the duration of the browser session, resetting to default (sorted by latest application) on browser close. Not yet scoped.
- Source field auto-detection from pasted job link URL, with user override remaining available. Not yet scoped.
