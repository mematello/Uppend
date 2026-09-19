# Uppend — Decisions Log

## [2026-09-19] Quote of the Day: Local Pool Over External API
- Context: ZenQuotes `/today` endpoint was initially chosen for the dashboard's daily quote, but testing revealed it has no topic filtering and returned unrelated, off-theme quotes.
- Decision: Replaced the ZenQuotes API fetch with a curated local quote list and a deterministic day-of-year rotation algorithm, completely removing the external dependency.
- Reasoning: A local pool guarantees topical relevance for a job search app. It also avoids adding a second unreliable third-party quotes API (after Quotable was already ruled out due to API outages), maintaining consistency with the app's existing skepticism toward fragile external dependencies.

## [2026-09-18] Streak Weekend Exemption
- Context: Weekends shouldn't break an application streak.
- Decision: Amends the 2026-09-17 "Streak Feature Core Mechanics" and "Streak 3-State Model". `at_risk`/`active` now key off a "covered" day (application OR weekend) rather than application alone. The streak count still only increments on days with a real application, so idle weekends don't inflate it. Weekends are hardcoded as Sat/Sun with no regional configurability, accepted as reasonable for a single-user personal tool. Kept live-computed with zero schema change, consistent with the original architecture rationale.

## [2026-09-17] Streak Feature Core Mechanics
- Context: Defining the bounds and architecture for the new application streak feature.
- Decision: A streak counts consecutive calendar days (in the user's local timezone) where at least one application was created. Drafts count equally to submitted apps; edits do not count. The streak must include today to be considered "active". The streak is computed live from `applications.created_at` on every read, rather than being stored in the database.
- Reasoning: Live computation avoids drift if a state-update is ever missed, directly mirroring the self-healing time-match philosophy already successfully used in the cron reminders route.

## [2026-09-17] Streak 3-State Model
- Context: Determining how to represent streaks and lapses to the user.
- Decision: Implemented a 3-state model (`active`, `at_risk`, `none`). "Active" means today is covered. "At risk" means yesterday is covered but today is not. "None" means a gap of >1 day, or a brand new user with 0 apps.
- Reasoning: Deliberately chose to hide the badge entirely on any gap >1 day, treating a lapsed streak identically to a brand new user. No separate "lapsed" state UI is needed; the absence of the badge is the signal.

## [2026-09-17] Activity Heatmap Layout and Scope
- Context: Displaying the historical volume of applications via a GitHub-style activity grid.
- Decision: Chose a single-month view with standard 7-column calendar layout and month-by-month navigation (clamped to account creation month) rather than the original proposal of an indefinite horizontal scroll with weeks as columns.
- Reasoning: A single-month calendar view with standard orientation is significantly more readable on mobile and provides better temporal anchoring than an ever-growing horizontal scroll.

## [2026-09-17] Activity Heatmap Anchored Dropdown
- Context: Determining the trigger and container for the Activity Heatmap.
- Decision: Replaced the initial full-screen modal implementation with an anchored dropdown panel attached to the streak badge, reusing the existing custom button+dropdown pattern used for the dashboard status filter and `/new` model selector.
- Reasoning: The full-screen modal felt overly heavy for an activity check. Reusing the existing anchored dropdown pattern maintains UI consistency across the app and avoids introducing a net-new presentation pattern just for this feature.

## [2026-09-17] Reminder Email App-Wide Timing Policy
- Context: Deciding when the unified daily streak+goal reminder email should be sent.
- Decision: Deliberately chose a fixed app-wide time policy (~8PM local via `reminder_timezone`) rather than reusing the existing user-configurable `reminder_send_time` (which is used for next-action reminders).
- Reasoning: Next-action reminders are tactical and user-directed (when do I want to do this work), whereas gamification/streak reminders are behavioral nudges that are most effective at the end of the day when reflecting on activity. Keeping them distinct prevents overloading a single user preference.

## [2026-09-13] Intent-Based Auth Threading
- Context: Differentiating a login from a signup post-auth to determine the default UX for local data migration.
- Decision: Explicit `intent=signup`/`intent=login` query param threaded through `emailRedirectTo` chosen over a `created_at`-freshness heuristic.
- Reasoning: Freshness heuristic was rejected due to magic-link click delay making any time window unreliable.

## [2026-09-13] Universal Local-Data Merge Prompt
- Context: Deciding when to show the local-data merge confirmation prompt.
- Decision: Always show the local-data merge confirmation prompt on both intents (not just login).
- Reasoning: An earlier direction of skipping the prompt on signup was reconsidered and rejected, since a new signup on a shared device could otherwise silently inherit a previous guest's local data, the same class of risk the prompt exists to prevent.

## [2026-09-13] Three-Way Decline Handling for Local Data
- Context: Handling the user's choice to decline merging local data.
- Decision: Implemented three-way decline handling ("Yes, add them" / "Skip for now" / "Not mine — delete it") over a single binary decline.
- Reasoning: A single "No, delete" was rejected because it would destroy a returning user's own legitimate local data in the common login case; the two-option split separates "not now" from "not mine."

## [2026-09-13] Intent-Based Visual Weighting for Prompts
- Context: Styling the local-data merge prompt based on intent.
- Decision: Primary-styled "Yes" on signup (expected common case per the product's Local-Mode-then-signup flow), equal weight across all three options on login (forces an unforced choice given higher stakes of an existing account absorbing stray data).

## [2026-09-10] Uppend Name Selection
- Context: Rebranding the application.
- Decision: Chose "Uppend" after investigating that "ApplyFlow" was already taken. Confirmed npm package name availability, no conflicting SaaS/consumer product found, informal search found no trademark conflict (formal USPTO clearance search not performed).

## [2026-09-10] Rebrand Scope Constraints
- Context: Defining the bounds of the rebranding effort.
- Decision: Repo rename, Vercel project rename, and Supabase project_id label were deliberately deferred/excluded. Repo and Vercel renames are pending manual updates to match the live rebrand. The Supabase label was intentionally left as `applyFlow` permanently since it's internal-only and never user-facing, not worth the churn.

## [2026-09-10] IndexedDB Migration over Silent Break
- Context: The IndexedDB `DB_NAME` needed to be changed due to the rebrand.
- Decision: Implemented a migration rather than a silent break.
- Reasoning: Local Mode is a public no-signup feature, meaning other people's browsers may hold data under the old name, not just the admin's. A migration prevents data loss for these users.

## [2026-09-10] Gmail Address Migration Approach
- Context: Migrating to a new Gmail address for SMTP following the rebrand.
- Decision: Used Google's account-rename feature (which preserves account history and alias, not a cold new mailbox) rather than creating a new account from scratch.
- Reasoning: Specifically chosen to avoid restarting SPF/DKIM and sender reputation from zero.

## [2026-09-09] Dashboard Applications Caching Strategy
- Context: Dashboard load time was impacted by sequential, uncached Supabase queries.
- Decision: Wrapped the applications query in Next.js `unstable_cache` tagged by `user_id`, and added `revalidateTag` to all mutation routes. 
- Decision: Used the `serviceClient` inside the cache closure instead of the standard cookie-based client. This intentionally bypasses RLS because Next.js prohibits dynamic functions like `cookies()` inside `unstable_cache`. Security relies entirely on the explicit `.eq('user_id', userId)` scoping in the query.

## [2026-09-09] Dashboard Data Fetch Parallelization
- Context: The dashboard sequentially fetched the user profile and then the applications query.
- Decision: Parallelized both queries using `Promise.all`.
- Trade-offs: A brand-new user with no profile will now trigger an applications fetch (and populate an empty cache entry) before being redirected to `/onboarding`. This small unnecessary work for an edge case was accepted for the performance gains of concurrency on all normal dashboard loads.

## [2026-09-09] Shared DB Environment Gap
- Context: Manual verification of feature branches currently happens against the live production database environment.
- Decision: Flagged this as a significant gap. Testing against production risks accidental mutations or lingering test data (e.g. test applications). Moving forward, we need to separate environments (using synthetic local/mock data or a dedicated staging instance) to isolate testing from live data.

## [2026-09-08] Source field dropdown design
- Context: Source field needed to be converted from free text to a dropdown.
- Decision: Chose dropdown+free-text-fallback with substring/keyword AI-auto-match over a strict fixed dropdown. Rejected two keywords ("direct", "meta") from the initial keyword list during plan review for false-positive risk.
- Reasoning: `/api/extract` returns open-ended text and a strict list would silently discard or block legitimate AI-extracted values.

## [2026-09-08] Dashboard dropdown
- Context: Needed to replace the native `<select>` for the dashboard status filter.
- Decision: Chose to replicate the existing custom button+dropdown pattern (from the model selector) over adopting shadcn/ui.
- Reasoning: shadcn isn't currently a dependency anywhere in this codebase and introducing it for one dropdown wasn't worth the new surface area.

## [2026-09-08] Ghosted Status Validation & UI Sync
- Context: The "ghosted" status was previously added to the database enum and the Dashboard filter, but was omitted from the Zod validation schemas (`PatchSchema`, `ApplicationInsertSchema`) and the individual application edit/create UI dropdowns. This caused optimistic UI updates to fail with a 400 error on save.
- Decision: Added `'ghosted'` to the Zod schemas and the `<select>` options in `ApplicationDetailClient.tsx` and `page.tsx` to achieve full parity across the application stack.
- Reasoning: A database enum addition must always be accompanied by corresponding updates to API boundary validation schemas and frontend forms to prevent validation failures.

## [2026-09-07] Resume Extraction Failure Signal — Additive API Field
- Context: `/api/resumes` silently caught PDF/DOCX extraction errors and saved the resume with `extracted_text: null`, with no signal in the response at all. The only existing indicator was a red label in the Settings resume list, discoverable only after the fact.
- Decision: Added `extractionFailed: boolean` to the existing success response (200), derived from the already-computed local `extractedText` variable. Non-breaking: response shape for the working case is unchanged.
- Reasoning: The upload itself succeeds even when extraction fails, so this should surface as a warning at the point of action, not a hard error — consistent with treating file-upload success and text-extraction success as separate signals.

## [2026-09-07] Save-Confirmation Toast — Additive, Not Relocated
- Context: A save-confirmation toast already existed on `/applications/[id]` but rendered at the top of a long form while the sticky "Save Changes" button lives at the bottom — invisible in practice without scrolling up.
- Decision: Added a second toast instance anchored next to the sticky save button, reusing the same `toast` state rather than introducing new state. The original top toast was left in place rather than relocated.
- Rejected alternative: Auto-scrolling to the top on save. Rejected as inconsistent with how the app otherwise avoids overriding user scroll/navigation state (cf. the Unsaved Changes modal's respect for user-initiated navigation), and disruptive to anyone continuing to edit further down the page.

## [2026-09-07] Save Toast Dismissal Tied to Existing Dirty-State Pattern
- Context: With two toast instances now sharing one `toast` state, a successful save's confirmation could persist indefinitely as the user continued editing without saving again — including for tech-stack chip edits, which set `isDirty` via `handleTechKeyDown`/`removeTech` rather than `handleInputChange`.
- Decision: `setToast(null)` added at all three existing `setIsDirty(true)` call sites (`handleInputChange`, `handleTechKeyDown`, `removeTech`), rather than a time-based auto-dismiss.
- Reasoning: Mirrors the existing dirty-state convention (`decisions.md`, 2026-09-06: boolean flag set on first interaction, no deep-equality diffing) instead of introducing a new pattern. A stale "success" toast surviving through unsaved edits is misleading regardless of how long it's been on screen, so tying dismissal to the edit action itself is more correct than a timer.

## [2026-09-06] Save-Confirmation UX & Sticky Footer Toast
- Context: The application detail save confirmation rendered at the top of the form, leaving users without immediate feedback when clicking the bottom-anchored sticky "Save Changes" button.
- Decision: Reused the existing `toast` state to render an identical inline confirmation immediately adjacent to the "Save Changes" button. Added logic to automatically dismiss the toast (`setToast(null)`) across all three dirty-state functions (`handleInputChange`, `handleTechKeyDown`, `removeTech`) as soon as the user resumes editing.
- Reasoning: A bottom-anchored toast provides proximate feedback where the user's cursor is. However, a persistently floating success message in a sticky footer is distracting, hence the choice to auto-dismiss on edit rather than persisting until the next save attempt.

## [2026-09-06] Resume Extraction Silent-Failure UX
- Context: The backend (`/api/resumes`) silently catches extraction failures and saves the resume with `extracted_text: null`. The frontend failed to surface this at upload time, and the `/new` extraction flow silently skipped match analysis without context.
- Decision: Appended an `extractionFailed` boolean flag to the existing success response of `/api/resumes`, rather than treating it as a hard HTTP error (because the file upload itself succeeds). Added a persistent warning to the upload component, and updated the `/new` toast logic to explicitly differentiate between "no default resume" and "current resume lacks text".
- Reasoning: Treating extraction failure as a hard error would break the primary intent (uploading the file), but failing to signal it leaves the user confused when downstream AI features (match analysis) silently fail to run.

## [2026-09-06] Unsaved Changes Navigation Guard (Custom Modal)
- Context: Native `window.confirm()` was used in `popstate` to prevent users from losing unsaved changes via iOS Safari's swipe-back gesture.
- Decision: Replaced `window.confirm()` with a custom React modal (`<UnsavedChangesModal />`) injected via `createPortal` to `document.body`.
- Reasoning: Safari silently suppresses `window.confirm` during gesture-triggered `popstate` events, returning `false` automatically. This instantly re-pushed the guard state, effectively trapping mobile users on the page with no UI. `createPortal` was also specifically chosen to prevent transformed ancestors from hijacking the modal's `fixed` positioning on long forms.

## [2026-09-06] Unsaved Changes Dirty State Tracking
- Context: Need to track whether the form has unsaved changes to trigger the navigation guard.
- Decision: Opted for a simple boolean flag (`isDirty`) set on the first user interaction, rather than deep equality diffing against the initial state.
- Trade-offs: Deep equality adds significant complexity (especially with AI-suggested fields) for a marginal cosmetic UX improvement (un-flagging `isDirty` if a user types and deletes a single character). The boolean flag perfectly fulfills the core requirement (preventing data loss) without introducing brittle comparison logic.

## [2026-09-06] Textarea Sizing Platform Constraints
- Context: Need textareas (`notes`, `interview_notes`) to be taller on mobile for better usability.
- Decision: Used Tailwind `min-h-48 resize-y` across all long-form textareas. 
- Constraint Noted: iOS Safari natively lacks support for the CSS `resize` property. Drag-resize is a desktop-only feature. The actual fix for mobile usability is the `min-h-48` class; the lack of a drag handle on iOS is a platform limitation, not a bug to be fixed.

## [2026-09-06] Email URL Resolution Fallback Chain
- Context: The cron reminder emails were constructing links using `process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'`, resulting in `localhost` links in production because Vercel doesn't auto-set `NEXT_PUBLIC_APP_URL`.
- Decision: Implemented a robust `getBaseUrl()` helper fallback chain: `APP_URL` → `VERCEL_PROJECT_PRODUCTION_URL` → `VERCEL_URL` → `http://localhost:3000`.
- Reasoning: Leverages Vercel's built-in system environment variables to guarantee a valid production URL without requiring manual env var configuration, while still allowing local overrides via `APP_URL`.

## [2026-09-05] Filter Row Redesign & Information Density
- Context: The dashboard status filter row (10 chips) was overflowing on mobile and causing horizontal scroll bars on desktop, violating the design goal of a clean, app-like interface.
- Decision: Replaced the 10 chips with an `[Active]` chip, `[All]` chip, and a status `<select>` dropdown.
- Reasoning: Chosen over adding a custom scroll affordance or a two-row wrap layout because it solves the root information density problem rather than just managing the overflow, and scales elegantly to mobile viewports without requiring custom breakpoints.

## [2026-09-05] Ghosted/Rejected Hiding Strategy
- Context: Users need a way to filter out dead applications (rejected, withdrawn, ghosted) from their main view.
- Decision: Implemented this via a status-based dashboard filter defaulting to "Active", rather than introducing a separate `is_archived` boolean flag.
- Reasoning: Avoids creating a second, independent state axis that would need to be kept synchronized with the `status` enum.

## [2026-09-05] Legacy Profile Timezone Default
- Context: Added `reminder_timezone` and `reminder_send_time` to profiles. Legacy users without these fields need a safe fallback.
- Decision: Existing users default to UTC timezone and `09:00:00` send time until they explicitly configure their preferences in Settings.
- Trade-offs: Requires a one-time manual backfill via the live SQL editor for the admin's own account (to set `Asia/Manila`), rather than attempting an automated data migration, adhering to the standing convention that one-off data adjustments for a single admin account do not warrant a migration script.

## [2026-09-05] Timezone Detection Strategy
- Context: Capturing the user's timezone during onboarding to accurately send reminders in their local time.
- Decision: Timezone detection relies exclusively on the browser's `Intl.DateTimeFormat().resolvedOptions().timeZone` API, with no IP-based geolocation fallback.
- Trade-offs: Accepted limitation for users who actively block or misreport their browser timezone (e.g., via strict privacy extensions), as they will need to manually correct it in Settings.

## [2026-09-05] External Scheduler for Reminders
- Context: Need to trigger `/api/cron/reminders` every minute to ensure timezone-accurate delivery, but Vercel's Hobby (free) tier strictly restricts native cron jobs (`vercel.json`) to once daily.
- Decision: Removed Vercel native cron entirely and opted to use a third-party free scheduler (cron-job.org) hitting the endpoint every minute with the existing `CRON_SECRET` bearer token, rather than upgrading to Vercel Pro.
- Trade-offs: Introduces a third-party dependency with no SLA and no retry guarantees. 
- Mitigation: To protect against missed ticks silently dropping reminders permanently, the `/api/cron/reminders` route was explicitly designed with self-healing `>=` time-match logic (checking if the local time is `>=` the send time on the target date, rather than exact-minute equality).
## [2026-08-25] Vercel Speed Insights Disabled
- Context: We enabled Vercel Analytics earlier but left Speed Insights unverified.
- Decision: Explicitly decided to leave Speed Insights disabled and toggle it off in the Vercel dashboard. This is an intentional choice to conserve the Vercel free-tier allocation (which is being shared with another project). It is not an open gap.
## [2026-08-25] AI Extraction Confidence Gate Refinement
- Context: `/api/extract` was throwing false positives for legitimate job descriptions that were anonymous (omitted the hiring company's name). The model correctly scored `company_name` confidence as 'low' (because "Unknown" is not a confident hiring company), which triggered our prompt-injection rejection gate.
- Decision: Removed `company_name` from the downstream rejection condition (`validated.extraction_confidence?.company_name === 'low'`). The gate now exclusively checks if `role === 'low'`.
- Trade-offs: A genuine job posting always has some role/title, serving as a reliable anchor, whereas an anonymous posting will lack a company name. Option 1 (`company_name === 'low' && role === 'low'`) was rejected because it relied on an unverified assumption that injections would always fail both, which could pass plausible-sounding role injections through if they included garbage company data.
- Future Hardening Item: Option 3 (schema change to separate "missing data" from "injection attempt" via an explicit `is_injection_attempt: boolean` signal) is the correct long-term architecture but was deferred as scope creep for a small bug fix.

## [2026-08-24] BYOK Default Provider Fallback
- Context: `profiles.preferred_provider` was acting as a hard gate for checking `user_api_keys`, causing users with a saved key but a null preferred provider to be blocked by the free-tier limit.
- Decision: Decoupled the key check by querying `user_api_keys` for `preferred_provider || 'google'`. We default to 'google' when null rather than querying across all providers. This avoids multi-provider complexity and is safe because BYOK is currently locked to Gemini-only.
## [2026-08-23] PDF Extraction Vercel Serverless Architecture Fixes
- Context: Resume extraction failed in production with "Cannot find module" and then "DOMMatrix is not defined".
- Root cause #1: `execSync`-based subprocess extraction wasn't traceable by Vercel's Node File Trace, causing `Cannot find module` in production. 
- Fix: refactored to direct `await import('pdf-parse')` inside the route handler.
- Root cause #2: `pdf-parse@2.x`'s underlying `pdfjs-dist` dependency requires browser-standard canvas APIs (`DOMMatrix`, `ImageData`, `Path2D`) even for text-only extraction, which don't exist in Node's serverless runtime. 
- Fix: added `@napi-rs/canvas` and injected polyfills into `globalThis` before the `pdf-parse` import, plus `serverExternalPackages` and `outputFileTracingIncludes` config in `next.config.ts`.
- Trade-off/accepted risk: injecting `DOMMatrix`/`ImageData`/`Path2D` into `globalThis` persists for the lifetime of a warm Lambda container, meaning it affects all subsequent requests on that container, not just PDF extraction ones. Accepted risk: low likelihood, but if any other dependency uses `typeof DOMMatrix !== 'undefined'` as a browser-vs-server detection heuristic, this could cause it to misbehave. Not currently known to affect anything in this codebase; flagged for awareness if unexplained behavior ever surfaces elsewhere. Note that Option B (scoped canvasFactory injection instead of global mutation, avoiding this risk) was not pursued due to time — flag as a possible future hardening item, not urgent.

## [2026-08-20] Resend to Nodemailer/Gmail SMTP Migration
- Context: We were using Resend for cron reminders and operator alerts, and Supabase's custom SMTP (via Gmail) for auth.
- Decision: Completely removed Resend and migrated all system emails (auth, cron reminders, operator alerts) to a shared Nodemailer transporter using Gmail SMTP (`uppend.noreply@gmail.com`).
- Trade-offs & Risks Accepted: This creates a consolidated single point of failure. All communications now depend on one personal Gmail account with no custom domain, a ~500/day volume ceiling, and a risk of suspension (Gmail is not designed for automated app sending) with no fallback.
- Mitigation: A deliverability spot-check via Mail-Tester scored 9.5/10 (SPF/DKIM passing), but this was a single-point-in-time test and does not constitute ongoing monitoring. This risk is acknowledged and accepted for the current scale.

## [2026-08-20] Operator Alerting Dedup/Threshold Tradeoff
- Context: Need to alert operators when all AI models fail, without causing alert spam during a true failure cascade.
- Decision: Implemented a deduplication threshold (1-hour suppression window, 3-event threshold) backed by an atomic state lock in Postgres. Because `/api/extract` and `/api/match` fire in parallel, a single system-wide outage generates 2 events at a time. We explicitly accepted the tradeoff that this parallel structure means the 3-event threshold is reached on the *second* user attempt (4 events) rather than the third. It biases toward alerting slightly early, which is acceptable.

## [2026-08-20] AI Provider Error Classification & Regex Use
- Context: `parseGeminiError` conflated transient quota failures with permanent model deprecations and malformed request schemas. 
- Decision: Introduced a strict 3-way classification (`TEMPORARY_PROVIDER`, `PERMANENT_PROVIDER`, `TERMINAL_EXECUTION`). Because the Gemini API does not cleanly isolate a "deprecated" error code (it returns a generic 400), we rely on a keyword regex (`/(model|unsupported|deprecated|not found|retired)/i`) for 400s to classify `PERMANENT_PROVIDER`. This is a known fragility point accepted because no better signal exists. Unrecognized 4xx/5xx codes default safely to `TERMINAL_EXECUTION`.

## [2026-08-20] Permanent AI Block Duration
- Context: Deprecated models (`PERMANENT_PROVIDER`) must be removed from the fallback chain so they stop burning request latency.
- Decision: Set the block duration for permanently failed models to 30 days (`2592000` seconds). This is long enough to effectively auto-disable the model for the immediate future, giving operators ample time to push a code update removing it from `models.ts` without needing an emergency hotfix.

## [2026-08-20] Cookie Consent Scope
- Context: Need to add a cookie consent banner for compliance.
- Decision: Implemented an essential-only disclosure banner (no accept/reject toggle) because an audit confirmed there is zero analytics/tracking code in the codebase.

## [2026-08-20] extraction_confidence Schema Handling
- Context: `extraction_confidence` needed to be added to validate low-confidence soft-rejections.
- Decision: Added to `JobExtractionSchema` and the DB insert schema independently, preserving the existing AI Extraction Schema Decoupling decision to prevent tight coupling.

## [2026-08-20] Free-Tier Race Condition Fix
- Context: The `decrement_free_ai_uses` logic was vulnerable to race conditions under concurrent requests, allowing negative balances.
- Decision: Fixed via an atomic check-and-decrement RPC (`0013_atomic_decrement.sql`) and a route-level `decrementOrThrow` helper rather than application-level locking. Decrement only fires post-success to preserve the multi-model fallback resiliency guarantee.

## [2026-08-19] Auth SMTP State — Gmail SMTP Permanent
- Context: Supabase default mailer (~2 emails/hr) was blocking testing. Previously considered temporary until a domain purchase for Resend.
- Decision: Decided to stay on Gmail SMTP (uppend.noreply@gmail.com, App Password auth, smtp.gmail.com:465 SSL) permanently for auth emails in exchange for zero cost. No custom domain purchase is planned.
- Scope: Supabase Auth magic-link delivery only. /api/cron/reminders is unaffected — separate Resend API code path, untouched.
- Trade-offs & Risks Accepted: Non-custom sender header, ~500/day volume cap, and account-suspension risk (Gmail isn't designed for automated app sending).
- Mitigation: If the Gmail account sending is ever flagged or suspended, auth emails will fail app-wide with no automatic fallback. A monitoring and alerting plan will be necessary if launch volume grows.

## [2026-08-19] Free-Tier AI Limits
- Context: Need to control API costs for users without their own API keys.
- Decision: Implemented 5 lifetime free AI uses (not recurring/resettable). This is enforced server-side with a hard stop until BYOK is added, and protected by a PostgreSQL trigger preventing client-side bypass via RLS.

## [2026-08-19] Data Export Formatting
- Context: The previous CSV export derived column headers dynamically from `Object.keys()` of the first application row, leading to misaligned columns when subsequent rows had fields the first row lacked (e.g. nulls).
- Decision: Implemented a strict 25-field explicit allowlist to ensure export column stability. `raw_jd` (large free text) is included in JSON exports but excluded from CSV/XLSX for tabular readability. `interview_stages` are chronologically sorted and flattened into a single string (`all_interview_stages`) for tabular exports. The `resumes` table is excluded.

## [2026-08-19] AI Extraction Schema Decoupling
- Context: A bug caused by a shared schema (`salary_max` leak into DB) demonstrated the risks of tightly coupling the AI extraction shape to the database insert shape.
- Decision: `JobExtractionSchema` and DB insert/update schemas (`ApplicationInsertSchema`) must never be coupled via `extend()` or `pick()`. They will be kept fully independent going forward.

## [2026-08-19] Dashboard Mobile Layout
- Context: The dashboard applications table was causing horizontal scrolling issues on narrow screens.
- Decision: Switched the table to a stacked-card layout on mobile (`md:table-row` / `block` pattern) instead of using scroll hints or horizontal scroll bars, providing a much better native mobile experience.

## [2026-08-19] Local-Mode Application Detail Routing
- Context: Users in local-only mode need access to application detail pages without triggering auth redirects.
- Decision: Added local-mode application detail access to the `middleware.ts` public route allowlist, scoped strictly to the `/applications/[id]` regex pattern.

## [2026-08-16] Impeccable Design Tool Experiment
- Context: Explored using the Impeccable design system to elevate the UI.
- Decision: The experiment was conducted on a separate branch and evaluated. We decided to discard it; the branch was deleted, and no changes were merged to `main`.

## [2026-08-16] BYOK Gemini-Only Scope
- Context: Multi-provider BYOK implementation highlighted schema-format mismatches (Type.OBJECT vs JSON Schema) between providers (OpenAI/Anthropic vs Gemini).
- Decision: Deferred support for other providers. BYOK UI and logic are strictly locked to Google Gemini for now, though underlying architecture (e.g., `getProvider()`) remains intact for future expansion.

## [2026-08-16] Magic Link Auth & SMTP State
- Context: Restructuring authentication and addressing email delivery blocks.
- Decision: Chose Magic Link (signInWithOtp) over Email+Password for both `/login` (shouldCreateUser: false) and `/signup` (shouldCreateUser: true). 
- Decision: Resend SMTP is in a temporary default-SMTP state pending a custom domain purchase due to sandbox restrictions.

## [2026-08-13] Multi-Model Fallback for Resiliency
- Context: A single provider outage (e.g. Gemini 503 or 429 quota errors) shouldn't fail the extraction process completely.
- Decision: Implemented a fallback chain (`gemini-3.5-flash` → `gemini-3-flash-preview` → `gemini-3.1-flash-lite-preview`) that automatically catches provider errors, temporarily blocks the failing model in Postgres, and retries the next model.
- Rejected alternatives: Relying solely on client-side retries or showing the raw provider error.

## [2026-08-13] Parallel AI Execution
- Context: Processing both the job description extraction and resume matching sequentially was too slow.
- Decision: Fired both requests concurrently since they don't depend on each other.

## [2026-09-16] Native Select Dropdown Arrow Styling
- Context: browser-default `<select>` arrows sat flush against the edge
  across all 8 native selects in `/new` and the application detail page.
- Decision: kept every select as a plain native `<select>` element
  (no new shared component/abstraction) and applied `appearance-none` +
  rebalanced padding + an absolutely-positioned Lucide `ChevronDown`
  icon identically to all 8, rather than introducing a custom
  select component.
- Reasoning: this is a pure styling fix with no behavior change; a new
  shared component would have been a larger architectural change than
  the problem warranted, and risked introducing prop/behavior mismatches
  across 8 existing call sites with slightly different conditional
  className logic (e.g. priority's AI-suggested border).

## [2026-09-16] Source Field AI-Suggested Visual Cue Removed
- Context: the source field's URL-auto-detect feature initially reused
  the app's existing `aiSuggestedFields` pattern (Sparkles icon + blue
  border) to visually flag an auto-guessed value, matching how
  priority/role_fit/culture_fit/notes already work when AI-extraction
  fills them.
- Decision: removed the visual cue for source entirely, and did not
  extend it to the AI-extraction flow (which also sets `source` but
  never flagged it as AI-suggested).
- Reasoning: product preference � did not want this specific visual
  signal to appear. Chosen to resolve the resulting inconsistency (URL
  detection flagged, extraction detection not) by removing the feature
  rather than extending it. The underlying `aiSuggestedFields` state
  tracking for `'source'` was kept regardless, since it's still needed
  internally to distinguish "unconfirmed auto-guess" from "user
  confirmed" for the paste-overwrite-protection logic.

## [2026-09-15/16] Source URL Auto-Detect: Separate Matching Function
- Context: `lib/constants.ts` already had `matchSourceOption()` for
  matching AI-extracted natural-language text to a source option, with
  an "Other" + raw-text fallback for anything unmatched.
- Decision: added a new, separate `matchSourceFromUrl()` function
  rather than reusing or extending `matchSourceOption()`.
- Reasoning: `matchSourceOption()`'s fallback behavior (unmatched input
  ? `{option: "Other", freeText: <the whole input>}`) is correct for
  natural-language text but wrong for a URL � applying it directly to a
  pasted job link would dump the raw URL string into the free-text
  "Other" source field. Keeping the functions separate also meant zero
  risk to the already-shipped, tested AI-extraction matching path.

## [2026-09-15] Source URL Auto-Detect Scope: /new Only
- Context: deciding whether pasting a new `job_link` should trigger
  source auto-detection on both the create (`/new`) and edit
  (`/applications/[id]`) pages.
- Decision: scoped to `/new` only.
- Reasoning: on the edit page, `source` has almost always already been
  deliberately set for an existing application (possibly to something
  the URL itself wouldn't correctly guess, e.g. "Referral" for a link a
  friend sent). Re-triggering detection there risked silently
  overriding a considered choice. `/new` is the "quick add while
  creating" moment the feature is actually meant for.

## [2026-09-15] Source URL Auto-Detect: Unmatched URL Fallback
- Context: deciding what should happen when a pasted `job_link` doesn't
  match any known job board (LinkedIn/Indeed/JobStreet/Facebook) � e.g.
  a company's own careers page.
- Decision: default-suggest "Company Website" rather than leaving
  source untouched.
- Reasoning: a job-posting URL that isn't a known job board is usually
  either the company's own site or a branded ATS page (Greenhouse,
  Lever, Workday), making "Company Website" a reasonable default guess.
  Low downside risk since it only ever fires when source was previously
  empty or still just an unconfirmed guess (see the paste-overwrite-
  protection decision below), never overwriting a value the user
  deliberately chose.

## [2026-09-15] Dashboard Job-Link Icon: Persistent vs. Hover-Reveal
- Context: choosing between an always-visible external-link icon next
  to company name (higher visual density, zero interaction cost) versus
  a hover-reveal icon on desktop (quieter table at rest, small "move
  mouse, wait" cost per use).
- Decision: initially shipped always-visible (chosen because the whole
  point of the feature was cutting interaction friction, and a reveal
  delay reintroduces a smaller version of the friction being removed).
  Revised to hover-reveal on desktop only after informal UI review
  flagged visual repetition across rows; kept always-visible on mobile,
  where no hover state exists.
- Reasoning for the revision: once rendered with real (long) company
  names, the row-density cost was more concrete than in the abstract
  design discussion, and the row already had a `group` class available
  from the existing row-hover background, making `group-hover` a small,
  low-risk addition rather than new plumbing.

## [2026-09-15] Dashboard State Persistence: sessionStorage, Not localStorage
- Context: the dashboard's existing `pageSize` preference already
  persists via `localStorage` (permanent, survives browser restarts).
  Sort field/direction and current page needed similar persistence
  across in-app navigation, but explicitly scoped to reset on browser
  close.
- Decision: used `sessionStorage` for sort/page state, deliberately not
  extending the existing `pageSize` `localStorage` pattern to cover it.
- Reasoning: the two have genuinely different lifetime requirements �
  page size is a durable preference, sort/page position is a
  session-scoped convenience. Using the wrong storage mechanism for
  either would violate the explicit requirement (reset-on-close for
  sort/page; permanence for pageSize).

## [2026-09-15] Cron Reminders: Time-Budget-Aware Retry
- Context: the initial transient-error retry fix (2026-09-13) introduced
  a new "Timeout" failure mode on cron-job.org shortly after merging,
  distinct from the "500 Internal Server Error" the fix was meant to
  address. Root cause reasoning (Vercel Hobby log retention made this
  unconfirmable by direct log evidence): the route has no `maxDuration`
  set, so it runs under Vercel Hobby's implicit ~10s execution cap; a
  slow first attempt (previously observed reaching 12-13s) combined
  with a second full retry attempt could exceed that cap, causing
  Vercel to kill the function outright rather than letting the route
  return its own clean JSON 500.
- Decision: made the retry conditional on remaining time budget
  (`RETRY_ELAPSED_BUDGET_MS`, default 5000ms) � skip the retry and fail
  fast with a normal 500 if the first attempt already consumed too much
  of the available time, rather than gambling on a second slow attempt.
  Also added `elapsedMs`/`retriedCount` to every response body.
- Reasoning: turns an opaque platform-level kill back into a
  diagnosable, clean failure in the case where the underlying slowness
  persists across both attempts. The 5000ms budget is an explicit
  heuristic pending real latency data � flagged as an open item, not a
  finalized tuning.
- Note: since Vercel Hobby's log retention is too short to catch
  failures after the fact, the added response-body instrumentation is
  meant to make cron-job.org's own retained execution history the
  durable evidence source for any future tuning of this budget.

## [2026-09-14] Supabase Local-Dev Redirect URL Wildcard
- Context: magic-link auth worked in production but landed on `/` with
  a stray `?code=` param instead of `/auth/callback` when tested on
  localhost � no session was established.
- Decision: added `http://localhost:3000/**` to the Supabase project's
  Redirect URLs allowlist (dashboard config, no code change).
- Reasoning: `emailRedirectTo` is only honored if it exactly matches an
  allowlist entry; without a match, Supabase silently falls back to the
  default Site URL rather than erroring, producing the observed
  symptom. This is the same class of issue as the 2026-08-24 production
  redirect fix (`https://` + `/**` wildcard), which was never extended
  to cover local development at the time.
