# Uppend — Current State

*This file is the single source of truth for "what's true right now." It
is rewritten in place at the close of every session — not appended to.
Resolved items are removed here and folded into changelog.md /
decisions.md instead. See architecture.md / decisions.md / schema.md /
changelog.md for anything not called out below as recently changed.*

*Last updated: 2026-10-01 (Session 23)*

## 1. Confirmed working / shipped
- **BYOK Fallback Scope Fixed**: Fixed a bug where BYOK users could fall through into other provider chains if their preferred provider exhausted its models, triggering false Invalid API Key errors and false exhaustion operator alerts. BYOK extraction and matching are now strictly scoped to the user's active provider.
- **Groq Fallback Chain**: Implemented `OpenAICompatibleProvider` to fall back to Groq models (`gpt-oss-120b` then `gpt-oss-20b`) sharing a single tracking bucket (`groq:shared-bucket`) when Gemini fails, keeping the core feature functional under heavy load. A custom `geminiToStrictJsonSchema` post-processor bypasses Zod 4's AST mismatch to correctly format Groq's strict-mode payload requirements, handling `nullable: true` schema definitions perfectly without hallucinations.
- **Exhaustion Event Off-by-One Fix**: The `all_models_exhausted` telemetry logging bug that resulted in a row update failing is fixed and merged (`fix/exhaustion-event-off-by-one`).
- **At-Risk Nudge**: Fixed `streakText` collapsed `at_risk` into `none`'s copy/emoji in the daily summary email; added distinct ⚠️ copy for at-risk state, conditional CTA (`/new`, "Save Your Streak") for at-risk vs. `/dashboard` otherwise.
- **Pluralization Fix**: Fixed streak-count pluralization bug ("1 days" → "1 day") in `streakText`.
- **Streak-Loss Acknowledgment**: `getStreakStatus()` now returns an optional `previousCount` when status resolves to `none`, via backward-tracing the prior streak chain; daily summary email gives distinct 🔄 copy ("Your N day streak ended — start a new one today") when a real prior streak existed, vs. unchanged copy for genuinely new users. Dashboard badge unaffected (confirmed via its own `status !== 'none'` guard).
- **Re-Engagement Email**: 14-day-inactivity detection via new `v_reengagement_candidates` view, three-way no-login action-link flow (found_job / still_looking / snooze) via a SECURITY DEFINER RPC (`redeem_reengagement_token`) and a new unauthenticated `/api/reengagement` route (standard client only, no service-role), new profiles columns (`reengagement_status` enum, `reengagement_snoozed_until`, `reengagement_last_sent_date`), new `action_tokens` table (deny-all RLS). Auto-clears snoozed (not paused_found_job) on new application. Note two real bugs caught and fixed pre-merge during review: a snooze spam-loop (fixed via resetting status atomically at the cron lock step) and a rollback bug that permanently destroyed a user's snoozed state on any failed send (fixed by restoring all three fields, not just the lock-date field, requiring the view to also expose `reengagement_status`/`reengagement_snoozed_until`).

## 2. Open / blocking

- **5xx Shared Bucket Blocking**: Should a 5xx error on `120b` block the shared bucket entirely, or still try `20b`? (This requires a protected-route change and its own plan cycle).
- **BYOK multi-provider extension (phase 2)**: Letting BYOK users add their own Groq/other-provider keys as a personal fallback is the next planned work, not yet started.
- **BYOK Multi-Provider maxDuration Risk**: A two-key BYOK chain can make up to 5 sequential model calls without a `maxDuration` limit on the `/api/extract` or `/api/match` routes. This risks a Vercel function timeout error (504 Gateway Timeout) on long chains before exhaustion completes properly.
- **Client-side 429 Handling**: The client side `/new` route currently overrides any 429 response body with a generic "All AI models are currently at capacity" message, hiding the new BYOK-specific exhaustion messages.
- **Documentation Drift**: References to BYOK being Gemini-only in `architecture.md`, `README.md`, and `decisions.md` are stale and need updating for Phase 2. The Privacy Policy also requires an update to include Groq as a processor.
- **SaaS architecture review findings** (from an informal review, not yet acted on): `select('*')` on the dashboard applications query pulls heavy columns (`raw_jd`, `extraction_confidence`) unnecessarily — proposed fix is to slim the query projection for the list view and fetch full detail only on the detail page. Also flagged: confirm `revalidateTag` is called on every mutating route (audit, not known-broken). Also flagged: current client-side in-memory search/filter approach is fine up to a few hundred applications per user, would need server-side pagination if any user's application count grows into the thousands — not an issue today, noted for awareness only.
- **Timezone input UX**: onboarding/Settings timezone field requires free-text typing when not using autodetect; requested to become a dropdown/autocomplete picker instead.
- **Mobile layout, two distinct issues**: (a) progress/stat rows stack vertically on mobile and each span full width, instead of sitting in one row; (b) the dashboard header (welcome label + theme/settings/logout/new-application buttons) is left-aligned on mobile, leaving dead whitespace on the right — wants either right-aligned buttons or a layout that keeps the label and buttons on the same row.
- **Bug report**: on the application detail/edit page (`/applications/[id]`), pasting a `job_link` does not trigger source auto-detection the way it does on `/new`. Flag for next session: this may be intentional per the existing "Source URL Auto-Detect Scope: /new Only" decision (`decisions.md`, 2026-09-15) — confirm with the user whether they're asking to reverse that decision, or reporting a regression against a behavior they expected but that was never actually implemented on the edit page.
- **New feature idea, unscoped: "archive as snapshot"** — let a user archive all or selected applications at once (e.g. after landing a job) to start a fresh pipeline, with archived applications retained/viewable separately rather than deleted.
- **New feature idea, unscoped, larger: application sharing between users** — a user could share an application (individually or via the same archive/select-all-or-some mechanism above) so another user could apply to the same posting. Note: this is the first multi-user/social feature raised for this app; flag as a discussion point.
- **`RETRY_ELAPSED_BUDGET_MS = 5000`** (cron reminders retry budget) is a heuristic default, not validated against real latency data. First real signal will be either no more "Timeout"-status cron-job.org notifications, or a fresh failure whose response body (now instrumented with `elapsedMs`/`retriedCount`) gives real numbers to tune against.
- **Two minor non-blocking observations carried over** from the post-delete-session fix (still unaddressed, low priority): (1) bfcache redirect's `?message=Session+expired` param may not be read/displayed by `login/page.tsx` — cosmetic; (2) `checkLocalData` catch block in `migrate/page.tsx` redirects silently on local-data-read failure with no error message shown — narrow failure case, low stakes.
- **Shared DB Environment Gap**: Testing branches still risks polluting production data. Formalizing separated environments (local mock or staging database) remains unaddressed.
- **Legal Pages**: `/terms` and `/privacy` still draft-pending lawyer review. Discretionary, user's call on launch timing. Open questions for the lawyer:
  - Free-tier Gemini data use (confirmed unpaid tier; policy now discloses it; ask the lawyer whether a notice at paste or upload time is needed).
  - Groq DPA coverage (do we need to sign a specific DPA, or are standard terms enough?).
  - Data retention (verify exact retention durations for Google and Groq).
  - EEA/UK handling (are SCCs/cookie banners required for our US-based processors, given we use no analytics cookies?).
  - EEA/UK paid-tier terms (confirm if EEA/UK users are exempt from free-tier data use per Google terms).
  - Vercel hosting/Analytics (whether this needs to be explicitly disclosed in the privacy policy, as it currently isn't mentioned).
- **AGENTS.md Outdated Context**: The "Project Context" section still reads "ApplyFlow is an AI-powered job application tracker...". Still intentionally unfixed pending a manual pass.

## 3. Next steps, priority order

**Backlog:**
1. **JD URL-fetching**: Large feature, touches a Protected AI Route, needs its own full plan cycle. Investigation was paused mid-way, real-URL fetch testing not yet done.
2. **Visual Identity Pass**: A visual-identity pass on the app's uniform rounded-full pill treatment is needed. This was flagged twice during Phase 2 review but was deliberately deferred as its own scoped design task, not touched piecemeal.
3. **Non-tech-job-seeker generalization idea**: An idea to broaden the platform for non-tech job seekers (which would touch `applications.tech_stack` schema + both Protected AI Route prompts). Raised this session, not yet scoped.

## 4. Future plans (not yet scoped)

*(No current vague future plans; concrete features moved to Open / blocking)*
