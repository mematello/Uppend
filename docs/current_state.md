# Uppend — Current State

*This file is the single source of truth for "what's true right now." It
is rewritten in place at the close of every session — not appended to.
Resolved items are removed here and folded into changelog.md /
decisions.md instead. See architecture.md / decisions.md / schema.md /
changelog.md for anything not called out below as recently changed.*

*Last updated: 2026-09-16 (Session 17)*

## 1. Confirmed working / shipped

- **Post-delete session & local-merge fix**: `fix/post-delete-session-and-local-merge`
  merged 2026-09-10 (commit `0a3cbb2`). Real-device verification (bfcache
  repro, all three prompt buttons on signup/login, iOS Safari) was
  completed before merge. Note: this was missed in the Session 16
  documentation close despite being done — this file now correctly
  reflects it as resolved.
- **Cron reminders reliability (two-part fix)**: Root cause was Supabase's
  service-role client having zero retry/timeout handling, compounding
  with this route having no `maxDuration` set (Vercel Hobby's implicit
  ~10s execution cap). Part 1 (`54a9574`, 09-13): added a bounded retry
  (1 retry, 500ms delay) for transient errors across all four Supabase
  call sites in the route. Part 2 (`5ea0ccb`, 09-15), after a new
  "Timeout" failure mode appeared post-merge: made the retry time-budget
  aware (skips the retry if elapsed time already exceeds
  `RETRY_ELAPSED_BUDGET_MS`, currently 5000ms — see open items) so a
  slow first attempt fails fast with a clean 500 instead of risking a
  platform-level kill. Added `elapsedMs`/`retriedCount` to every response
  body, since Vercel Hobby log retention is too short to debug after the
  fact — cron-job.org's retained response body is now the durable
  evidence source.
- **Supabase local-dev auth redirect fixed**: magic-link auth was
  landing on `/` with a stray `?code=` param instead of `/auth/callback`
  on localhost — Supabase's Redirect URLs allowlist only had the
  production wildcard, not a local one. Fixed by adding
  `http://localhost:3000/**` in the Supabase dashboard (Authentication ?
  URL Configuration). Config-only, no code change. Same class of issue
  as the 2026-08-24 production fix, just never extended to local dev.
- **Dashboard: job-link quick access** (`3f97fdb`, 09-15): persistent
  external-link icon next to company name in the dashboard table/cards,
  opens `job_link` in a new tab, hidden entirely when no link is set.
  Revised after informal UI review (Gemini feedback on a screenshot):
  long company names now truncate with an ellipsis on desktop
  (`md:max-w-[12rem] md:truncate`, `title` attribute for full name on
  hover) to fix an icon-wrapping bug, and the icon switched from
  always-visible to hover-reveal on desktop only (`group-hover`),
  staying always-visible on mobile where no hover state exists.
- **Dashboard: sort/page state persistence** (`634747c`, 09-15):
  `sortField`, `sortAsc`, and `currentPage` now persist across
  in-app navigation via `sessionStorage` (keys `dashboard_sort_field`,
  `dashboard_sort_asc`, `dashboard_current_page`), resetting on browser
  close. Deliberately separate from the existing `pageSize` preference,
  which stays on `localStorage` (permanent) and was left untouched.
  `filter`/`searchQuery` are explicitly out of scope, also untouched.
- **Source field URL auto-detection** (`1d2881e`, `476b552`, 09-15/16):
  new `matchSourceFromUrl()` in `lib/constants.ts` — deliberately
  separate from `matchSourceOption()` (used for AI-extraction text
  matching), since that function's "Other + freeText" fallback would
  dump a raw URL into the free-text source field if reused for URL
  input. Triggers on paste into the `job_link` field on `/new` only
  (not the edit page — deliberate, to avoid silently overriding a
  source the user already set on an existing application). Matches
  LinkedIn/Indeed/JobStreet/Facebook by domain keyword; defaults to
  "Company Website" for anything else. Two bugs found in manual testing
  and fixed: (1) the source `<select>`'s custom `onChange` bypassed the
  shared `aiSuggestedFields` clearing logic every other field uses,
  so a manual override wasn't being tracked as confirmed; (2) the
  paste handler originally blocked re-detection on *any* existing
  source value, so pasting a second link never updated an
  auto-suggested (but not yet manually confirmed) source. Both fixed
  by correctly distinguishing "still just a guess" from "user
  confirmed" via `aiSuggestedFields`. The visual "AI suggested" Sparkles
  icon/blue-border cue was built, then deliberately removed per
  product preference — not shown for source, and not extended to the
  AI-extraction flow either, closing the inconsistency by removal
  rather than addition.
- **Native `<select>` dropdown arrow spacing** (`f8246e3`, 09-16): all 8
  native `<select>` elements across `/new` and the application detail
  page (currency, source, status, priority × 2 files) had the browser's
  default arrow sitting flush against the edge. Fixed with
  `appearance-none` + rebalanced padding + a positioned Lucide
  `ChevronDown` icon, matching the icon language already used elsewhere
  in the app.
- **Portfolio website updated** (external repo, separate Claude
  session): ApplyFlow ? Uppend rename reflected on the portfolio site.
  Antigravity generated a `PORTFOLIO_UPDATE_CONTEXT.md` handoff file in
  the portfolio repo summarizing the rebrand facts and auditing existing
  ApplyFlow references, for the other session to work from directly
  alongside the live repo.

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
1. JD URL-fetching feature — large, touches a Protected AI Route, needs
   its own full plan cycle, don't bundle with smaller tasks.

## 4. Future plans (not yet scoped)

- **Gamification**: application goals and related mechanics (streaks,
  targets, progress tracking) to motivate consistent job-search activity.
  Early-stage idea, not yet scoped or planned.
