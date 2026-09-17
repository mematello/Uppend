# Uppend — Current State

*This file is the single source of truth for "what's true right now." It
is rewritten in place at the close of every session — not appended to.
Resolved items are removed here and folded into changelog.md /
decisions.md instead. See architecture.md / decisions.md / schema.md /
changelog.md for anything not called out below as recently changed.*

*Last updated: 2026-09-17 (Session 18)*

## 1. Confirmed working / shipped

- **Doc Cleanup**: Updated ApplyFlow → Uppend references in README.md, architecture.md, decisions.md, and AGENTS.md, fixing legacy mkro-applyflow.vercel.app URLs and the applyflowapp@gmail.com address to their uppend equivalents. Includes updating the fallback string in the cron reminders route.
- **Current Streak Feature**: Added a "Current Streak" tracker to the dashboard header (computed live from `applications.created_at` with no schema changes, preventing drift if a calculation is ever missed). Uses a strict "must include today in local timezone" rule, surfacing an `active`, `at_risk`, or `none` state (`getStreakStatus`) — no separate visual treatment for brand-new users vs lapsed streaks.
- **Activity Heatmap Feature**: Added an application activity heatmap to the dashboard, triggered via the new streak badge. Final form is an anchored dropdown (reusing the existing status-filter/model-selector structural pattern for UI consistency) showing a single-month view with standard 7-column calendar layout and native hover tooltips. Includes previous/next month navigation (clamped to the user's account creation month and the current local month), plus final dark-mode contrast tuning and strict future-date clipping.

## 2. Open / blocking

- **`RETRY_ELAPSED_BUDGET_MS = 5000`** (cron reminders retry budget) is
  a heuristic default, not validated against real latency data. First
  real signal will be either no more "Timeout"-status cron-job.org
  notifications, or a fresh failure whose response body (now
  instrumented with `elapsedMs`/`retriedCount`) gives real numbers to
  tune against.
- **Two minor non-blocking observations carried over** from the
  post-delete-session fix (still unaddressed, low priority): (1)
  bfcache redirect's `?message=Session+expired` param may not be
  read/displayed by `login/page.tsx` — cosmetic; (2) `checkLocalData`
  catch block in `migrate/page.tsx` redirects silently on local-data-read
  failure with no error message shown — narrow failure case, low stakes.
- **Shared DB Environment Gap**: Testing branches still risks polluting
  production data. Formalizing separated environments (local mock or
  staging database) remains unaddressed.
- **Legal Pages**: `/terms` and `/privacy` still draft-pending lawyer
  review. Discretionary, user's call on launch timing.
- **AGENTS.md Outdated Context**: The "Project Context" section still
  reads "ApplyFlow is an AI-powered job application tracker...". Still
  intentionally unfixed pending a manual pass.

## 3. Next steps, priority order

**Backlog:**
1. **Gamification Phase 2 (Goals)**: User-configurable daily target (default 5/day), requires a new `profiles` column. Scoped but not yet implemented.
2. **Gamification Phase 3 (Unified Reminder Email)**: Unified daily streak+goal reminder email sent at a fixed app-wide ~8PM-local time via `reminder_timezone` (distinct from the user-configurable `reminder_send_time` used for next-action reminders), with a settings toggle to disable. Scoped but not yet implemented.
3. **JD URL-fetching**: Large feature, touches a Protected AI Route, needs its own full plan cycle. Investigation was paused mid-way, real-URL fetch testing not yet done.

## 4. Future plans (not yet scoped)

*(No current vague future plans; Gamification moved to concretely scoped Next Steps above)*
