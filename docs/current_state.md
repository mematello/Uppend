# Uppend — Current State

*This file is the single source of truth for "what's true right now." It
is rewritten in place at the close of every session — not appended to.
Resolved items are removed here and folded into changelog.md /
decisions.md instead. See architecture.md / decisions.md / schema.md /
changelog.md for anything not called out below as recently changed.*

*Last updated: 2026-09-28 (Session 21)*

> [!WARNING]
> OPEN QUESTION, not yet discussed: the product was described this session as 'already a SaaS, not a personal tool anymore' — a framing shift from every existing doc (AGENTS.md's 'solo-developer personal tool' framing, project_overview.md's non-goals, and several recent decisions, e.g. the re-engagement email's threshold/preference-center scoping, which were explicitly reasoned from single-user assumptions). This needs its own dedicated discussion next session before any doc or decision is revised to match — do not silently update AGENTS.md's Project Context section or re-litigate past decisions until that conversation happens.

## 1. Confirmed working / shipped

- **At-Risk Nudge**: Fixed `streakText` collapsed `at_risk` into `none`'s copy/emoji in the daily summary email; added distinct ⚠️ copy for at-risk state, conditional CTA (`/new`, "Save Your Streak") for at-risk vs. `/dashboard` otherwise.
- **Pluralization Fix**: Fixed streak-count pluralization bug ("1 days" → "1 day") in `streakText`.
- **Streak-Loss Acknowledgment**: `getStreakStatus()` now returns an optional `previousCount` when status resolves to `none`, via backward-tracing the prior streak chain; daily summary email gives distinct 🔄 copy ("Your N day streak ended — start a new one today") when a real prior streak existed, vs. unchanged copy for genuinely new users. Dashboard badge unaffected (confirmed via its own `status !== 'none'` guard).
- **Re-Engagement Email**: 14-day-inactivity detection via new `v_reengagement_candidates` view, three-way no-login action-link flow (found_job / still_looking / snooze) via a SECURITY DEFINER RPC (`redeem_reengagement_token`) and a new unauthenticated `/api/reengagement` route (standard client only, no service-role), new profiles columns (`reengagement_status` enum, `reengagement_snoozed_until`, `reengagement_last_sent_date`), new `action_tokens` table (deny-all RLS). Auto-clears snoozed (not paused_found_job) on new application. Note two real bugs caught and fixed pre-merge during review: a snooze spam-loop (fixed via resetting status atomically at the cron lock step) and a rollback bug that permanently destroyed a user's snoozed state on any failed send (fixed by restoring all three fields, not just the lock-date field, requiring the view to also expose `reengagement_status`/`reengagement_snoozed_until`).

## 2. Open / blocking

- **SaaS architecture review findings** (from an informal review, not yet acted on): `select('*')` on the dashboard applications query pulls heavy columns (`raw_jd`, `extraction_confidence`) unnecessarily — proposed fix is to slim the query projection for the list view and fetch full detail only on the detail page. Also flagged: confirm `revalidateTag` is called on every mutating route (audit, not known-broken). Also flagged: current client-side in-memory search/filter approach is fine up to a few hundred applications per user, would need server-side pagination if any user's application count grows into the thousands — not an issue today, noted for awareness only.
- **Timezone input UX**: onboarding/Settings timezone field requires free-text typing when not using autodetect; requested to become a dropdown/autocomplete picker instead.
- **AI model exhaustion — core feature unusable**: when the full Gemini fallback chain (gemini-3.5-flash → gemini-3-flash-preview → gemini-3.1-flash-lite-preview) is exhausted, `/api/extract` and `/api/match` become fully unusable app-wide, surfacing "high demand" errors to users. Raised as urgent/core-feature-breaking. Two directions floated, neither decided: (a) add a non-Gemini fallback provider (note: BYOK is currently explicitly Gemini-only per an earlier decision, would need revisiting), or (b) some other mitigation — needs its own investigation before any plan.
- **Mobile layout, two distinct issues**: (a) progress/stat rows stack vertically on mobile and each span full width, instead of sitting in one row; (b) the dashboard header (welcome label + theme/settings/logout/new-application buttons) is left-aligned on mobile, leaving dead whitespace on the right — wants either right-aligned buttons or a layout that keeps the label and buttons on the same row.
- **Bug report**: on the application detail/edit page (`/applications/[id]`), pasting a `job_link` does not trigger source auto-detection the way it does on `/new`. Flag for next session: this may be intentional per the existing "Source URL Auto-Detect Scope: /new Only" decision (`decisions.md`, 2026-09-15) — confirm with the user whether they're asking to reverse that decision, or reporting a regression against a behavior they expected but that was never actually implemented on the edit page.
- **New feature idea, unscoped: "archive as snapshot"** — let a user archive all or selected applications at once (e.g. after landing a job) to start a fresh pipeline, with archived applications retained/viewable separately rather than deleted.
- **New feature idea, unscoped, larger: application sharing between users** — a user could share an application (individually or via the same archive/select-all-or-some mechanism above) so another user could apply to the same posting. Note: this is the first multi-user/social feature raised for this app; flag as a discussion point given the still-open personal-tool-vs-SaaS framing question above.
- **`RETRY_ELAPSED_BUDGET_MS = 5000`** (cron reminders retry budget) is a heuristic default, not validated against real latency data. First real signal will be either no more "Timeout"-status cron-job.org notifications, or a fresh failure whose response body (now instrumented with `elapsedMs`/`retriedCount`) gives real numbers to tune against.
- **Two minor non-blocking observations carried over** from the post-delete-session fix (still unaddressed, low priority): (1) bfcache redirect's `?message=Session+expired` param may not be read/displayed by `login/page.tsx` — cosmetic; (2) `checkLocalData` catch block in `migrate/page.tsx` redirects silently on local-data-read failure with no error message shown — narrow failure case, low stakes.
- **Shared DB Environment Gap**: Testing branches still risks polluting production data. Formalizing separated environments (local mock or staging database) remains unaddressed.
- **Legal Pages**: `/terms` and `/privacy` still draft-pending lawyer review. Discretionary, user's call on launch timing.
- **AGENTS.md Outdated Context**: The "Project Context" section still reads "ApplyFlow is an AI-powered job application tracker...". Still intentionally unfixed pending a manual pass.

## 3. Next steps, priority order

**Backlog:**
1. **JD URL-fetching**: Large feature, touches a Protected AI Route, needs its own full plan cycle. Investigation was paused mid-way, real-URL fetch testing not yet done.
2. **Visual Identity Pass**: A visual-identity pass on the app's uniform rounded-full pill treatment is needed. This was flagged twice during Phase 2 review but was deliberately deferred as its own scoped design task, not touched piecemeal.

## 4. Future plans (not yet scoped)

*(No current vague future plans; concrete features moved to Open / blocking)*
