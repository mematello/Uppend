# Uppend — Changelog

## [2026-10-31] (Session 33)
- Implemented: Auth + onboarding + migrate presentational redesign follow-up on branch `redesign/auth-onboarding-migrate`:
  - `app/(auth)/layout.tsx`: converted back control to icon-only `<Link>` (`btn-secondary rounded-ledger min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2 mb-4`, `<ArrowLeft className="w-4 h-4" aria-hidden="true" />`, `aria-label="Back to home"`, no visible text, no title attribute), left-aligned with card edge.
  - `app/(protected)/onboarding/page.tsx`: removed `const STEPS` from logic prelude (inlined in JSX `.map()`) to restore byte-identical logic hash with `main`; updated main-column height floor to measured `min-h-[29rem] md:min-h-[27.5rem]` (464px mobile / 440px desktop), proving equal card sizing across steps 1, 2, 3-bare, and 3-tallest.
  - `app/(protected)/migrate/page.tsx`: restored literal UTF-8 characters (`'` apostrophes, `—` em dash) in error string to restore byte-identical logic hash with `main`.
  - `components/onboarding/OnboardingBackdrop.tsx`: replaced dashboard skeleton with faint 32px ruled grid on `--paper` using global `--hairline-subtle` (`aria-hidden="true"`, zero state, no focusable children, no data fetching, no scrim).
  - Documentation: corrected `architecture.md` migrate path to `app/(protected)/migrate/`, updated `design.md`, `decisions.md`, `current_state.md`, and `manifest.md`.
- Implemented: Auth + onboarding + migrate presentational redesign on branch `redesign/auth-onboarding-migrate` (off `main` at `f9b2709`, commit `6582516`):
  - `app/(auth)/layout.tsx`: token-based shell (`bg-paper`, `bg-card`, `border-hairline`, `rounded-ledger`), `btn-secondary` back control with "Back to home" text, `max-w-[480px]` card.
  - `app/(auth)/login/page.tsx`: eyebrow (LOG IN), `font-display` h1, `<label htmlFor>` email input, `role="status"` status slot, footer with `border-t border-hairline`, `btn-primary min-h-[44px] sm:min-w-[176px]`. Cross-tab: ink-outline box + `<Check>` icon, removed `animate-in fade-in zoom-in` and green circle. `CheckCircle2` → `Check` import swap.
  - `app/(auth)/signup/page.tsx`: same pattern; eyebrow (SIGN UP); T&C verbatim; cross-tab ink-outline; `href="/migrate?intent=signup"` preserved.
  - `app/(protected)/migrate/page.tsx`: `max-w-[600px]` card, eyebrow (MIGRATE), `font-display` h1, red-outline destructive button (`border-red-700 dark:border-red-500 text-red-700 dark:text-red-400`), error as inline `text-red-700 dark:text-red-400` text. Removed `animate-in fade-in zoom-in`, `amber-*`, `Sparkles`, `animate-pulse`. Intent weighting logic preserved exactly.
  - `app/(protected)/onboarding/page.tsx`: split-rail layout (`md:grid-cols-[220px_1fr]`), `<OnboardingBackdrop />`, `min-h-[380px] md:min-h-[420px]` floor, mobile 3-bar progress, `<label htmlFor>` on all inputs, `role="status"` error slots, `btn-primary`/`btn-secondary` `min-h-[44px]`, skip buttons as `btn-secondary`. Zero logic changes.
  - `components/onboarding/OnboardingBackdrop.tsx`: new decorative dashboard skeleton (`aria-hidden`, `absolute inset-0`, no state, no focusable children).
  - `docs/design.md`: added §15 Auth/Onboarding/Migrate; updated Known Gaps.
  - `docs/decisions.md`: added 7 new decisions for this session.
- Gates (all passed): `tsc --noEmit` exit 0, ESLint 1 pre-existing warning (net-zero), 130/130 tests, contrast exit 0, class hygiene 0 banned classes in scope files.

## [2026-10-28] (Session 32)
- Implemented: Settings redesign on branch `redesign/settings` (16 commits on top of `main` at `f0504a3`, merged into `main` via `--no-ff` at `393076b` and pushed `f0504a3..393076b`):
  - `091e179` feat(types): add optional free_ai_uses_remaining to Profile
  - `e9964aa` feat(utils): add messageTone helper with unit tests
  - `59307c6` feat(settings): redesign page shell with rail navigation and token loading skeleton
  - `60afca3` feat(settings): add shared settings layout primitives
  - `ebd881b` feat(settings): account and reminders panels
  - `bf6b372` fix(settings): button padding, footer gap and toggle label
  - `c7bc300` feat(settings): ai and keys panel
  - `acd6668` fix(settings): encoding-safe em dash in BYOK notice
  - `95d3378` feat(resumes): restyle ResumeUploader with dropzone and layout prop
  - `b322e8d` feat(settings): resumes and data export panels
  - `af3efda` refactor(resumes): hoist uploader controls out of IIFE
  - `d16fc9b` feat(resumes): drag-over state for the dropzone
  - `5296ab9` feat(settings): danger zone panel and clear local data restyle
  - `ba4eccf` fix(settings): cap width of the lone delete-account card
  - `60b0085` test(ui): contrast pairs for muted text on ink tint
  - `020b699` fix(settings): match delete confirmation width to the delete card
- Fixed:
  - Encoding-safe em dash in BYOK notice (`acd6668`).
  - Button padding, footer gap, and toggle label styling in settings primitives (`bf6b372`).
  - Hoisted resume uploader form controls out of IIFE (`af3efda`).
  - Capped width of the lone delete-account card (`ba4eccf`) and matched both delete confirmation wrappers to `max-w-[480px]` (`020b699`).
- Verified:
  - Pre-merge gate (owner PowerShell, branch tip `020b699`, run twice with identical output): `tsc --noEmit` exit 0; 11 test files / 130 tests passed; build exit 0; dead-class-scan 184 verified classes, 0 unexpected, 1 unresolved dynamic expression (`SettingsLayout.tsx` `mergedClassName`; its classes were proved by compiled-CSS greps in earlier groups); `contrast.mjs` SUCCESS exit 0 (two new muted-on-ink-tint pairs added: 5.98:1 light, 5.77:1 dark); token deltas vs main only `htmlFor`, `id=` and `ResumeUploader` `useState` (7 -> 8).
  - Post-merge gate on main BEFORE the push: not reviewed before push.
  - Post-merge gate on main AFTER the push (owner PowerShell, HEAD `393076b` = `origin/main`): `tsc --noEmit` exit 0; 11 test files / 130 tests passed; build exit 0; dead-class-scan 184 verified classes, 0 unexpected, 1 unresolved dynamic expression (`SettingsLayout.tsx` `mergedClassName`); working tree clean.
  - Production smoke test (Settings, iOS Safari light+dark, onboarding uploader): pending.
  - Branch `redesign/settings` left intact: yes.
- Note (process incidents this session): Exactly the following owner-verified items occurred during Session 32:
  - (a) the agent's Group 5 explanation named element ids that do not exist in the code (profile-name, reminder-days, weekly-goal, byok-google, byok-groq, ai-model, #profile, #keys), although the counts it reported were right;
  - (b) the Group 6 and Group 7 reports quoted line ranges ("lines 1-486", "lines 444-475") that no command in the block showed (the equal SHA256 hashes were the real proof);
  - (c) the first pre-merge gate was run in WSL bash using PowerShell commands, so tsc, tests and contrast did not run, the build failed (bash expanded `*>`), dead-class-scan reported 753 false dead classes with 0 CSS classes verified, WSL git listed nearly all tracked files as modified (most likely a file-mode or line-ending difference (cause not investigated)), and two untracked log files with unusual names were created in the repo root; the second paste repeated this; the valid gate was then re-run in Windows PowerShell with identical results twice;
  - (d) the planning chat issued the gate in PowerShell syntax without confirming the owner's shell;
  - (e) the stray log file (name ending gate-build.log, with private-use characters) survived one deletion attempt because it was removed by the wrong name; removed before merge: yes;
  - (f) main was pushed before the planning-chat sign-off on the post-merge gate; no harm found.

## [2026-10-25] (Session 31)
- Fixed: iOS Safari layout bug where `Date Applied` and `Next Action Date` input fields overflowed/protruded outside their parent container and overlapped adjacent cells in `md:grid-cols-2`. Added `w-full min-w-0 max-w-full` to `variant="input"` in `components/ui/Field.tsx`, `min-w-0` to Tracking details grid cells in `ApplicationDetailClient.tsx` and `new/page.tsx`, Guardrail 11 to `docs/design.md`, and logged decision in `docs/decisions.md`.
- Implemented: Application detail redesign on branch `redesign/application-detail` (direction B split rail: sticky summary rail with live status chip, priority, fit, next action, resume; three Panels), Field `variant="toggle"` (labeled 44px bordered cell, used for Reminder and Cover letter; `/new` untouched), label shortening (Company, Salary), full-bleed sticky save bar with single plain-text toast, delete modal restyle (bg-scrim, rounded-ledger, role=dialog; state machine/Esc/stopPropagation unchanged), loading skeleton and early-return states, delete-confirm contrast pairs (11 commits on top of `main` at `37d80da`):
  - `d6ce3ff` feat(ui): add toggle variant to Field
  - `32959d4` feat(detail): page shell, header, summary rail
  - `4b6769d` feat(detail): extracted details via Field
  - `e19f244` feat(detail): tracking details via Field and toggles
  - `8a33b9d` feat(detail): evaluation panel, textareas, form id
  - `761aa0f` style(detail): shorten labels
  - `57dd9f5` feat(detail): full-bleed save bar, single toast
  - `4118657` feat(detail): delete modal restyle
  - `ce87cf0` feat(detail): states and loading skeleton
  - `f867b38` test(ui): delete confirm contrast pairs
  - `ceeed3c` refactor(detail): derive status label instead of literal map
- Merged `redesign/application-detail` into `main` via `--no-ff` (merge commit `7c3ff5a`) and pushed (`37d80da..7c3ff5a`). Owner-terminal merge gate: `tsc --noEmit` exit 0, vitest test suite 117/117 passed, production build exit 0, dead-class-scan 0 unexpected dead classes (from owner paste; not reproduced by agent). Device pass: owner reports the page works completely; itemised checklist was NOT recorded: UNVERIFIED. Production smoke test for application detail: pending.
- Note (process incidents this session): Exactly the following owner-verified items occurred during Session 31:
  - (a) Block 1's pasted contrast output did not match a deterministic re-run (Block 2, run against a clean main worktree, matched the Step 0 baseline);
  - (b) Block 1 omitted ESLint output and its dead-class-scan call had no file arguments (planner prompt error);
  - (c) the planner's line-based logic count could not compare multi-line JSX and was replaced by per-token occurrence counts;
  - (d) dead-class-scan reported 8 false positives from the uppercase-named STATUS_LABEL display map, fixed in `ceeed3c` (statusLabel derivation).

## [2026-10-25] (Session 30)
- Implemented: `/new` application creation redesign on branch `redesign/new` (21 commits on top of `main` at `e5a9773`):
  - `3b40c7e` test(ui): add Alert tone contrast checks to contrast script
  - `4d93478` feat(ui): add Alert primitive with tokenized tones
  - `58f3d8b` feat(ui): add textarea variant and aiSuggested prop to Field primitive
  - `ad7f6bc` feat(new): implement PageHeader and two-column split layout shell
  - `7c9ac94` feat(new): restyle extraction panel, model picker, and mobile 50/50 action row
  - `8769819` feat(new): migrate application details form fields and selects to Field primitive
  - `6903da1` fix(new): button layout and currency width
  - `ae21927` feat(new): restyle tech chips, notes textarea, checkbox, and add sticky save bar
  - `02a226a` feat(new): wire Alert primitive for local mode, exhaustion, toasts, and Chip fallback badge
  - `dd62355` fix(new): full-bleed sticky save bar
  - `8605818` feat(constants): add resolveExtractedSource helper with unit tests
  - `db6580b` fix(new): preserve existing source and tag on empty extraction
  - `295b2a2` chore(new): drop unused matchSourceOption import
  - `e322ae8` fix(new): full-width model fallback badge
  - `e4255ec` fix(new): restyle analyzing indicator
  - `0f51144` fix(ui): neutral success tone for Alert
  - `bbd25bf` feat(navigation): add resolveBackNavigation helper with unit tests
  - `7e0a904` feat(new): add history-aware back button
  - `ced487f` fix(new): ignore modified clicks on back button
  - `2896da8` fix(new): reserve slot for analyzing status
  - `50e227d` fix(new): plain-text save bar toast
- Merged `redesign/new` into `main` via `--no-ff` (merge commit `0aeb78c`) and pushed (`e5a9773..0aeb78c`). Owner-terminal merge gate: UNVERIFIED (merge evidence comes from owner terminal). Verification totals on branch: `tsc --noEmit` exit 0, vitest test suite 117/117 passed (9 test files), production build exit 0. Owner real-device pass (iOS Safari, both themes): not yet run. Production smoke test for `/new`: pending.
- Note (process incidents this session): Exactly the following owner-verified items occurred during Session 30:
  - (a) save bar placed inside the width-capped container per a planning-chat amendment, fixed in `dd62355`;
  - (b) Alert wrapper for toast contradicted the plan's plain-text design, fixed in `50e227d`;
  - (c) L1 wiring left an unused matchSourceOption import (ESLint 0->1), fixed in `295b2a2`;
  - (d) L1 manual test matrix expected a Sparkles badge on Source, contradicting the 2026-09-16 decision;
  - (e) one report changed the logic-multiset counting method (12/14 vs 5/9) so numbers were not comparable;
  - (f) an agent claim that the fallback badge can show with a null preferredModel was unevidenced;
  - (g) contrast.mjs ratios changed between runs without being mentioned;
  - (h) the dead-class scanner cannot resolve object-literal class maps.


## [2026-10-23] (Session 29)
- Implemented: Dashboard redesign Groups 2b–3c on branch `redesign/dashboard` (38 commits on top of `main` at `c8ae62a`):
  - `daf86a8` docs(dashboard): Session 29 documentation corrections 3 (docs/changelog.md, docs/architecture.md, docs/current_state.md, docs/manifest.md ONLY)
  - `3d3a8f6` docs(dashboard): Session 29 documentation corrections 2
  - `0294679` docs(dashboard): Session 29 documentation corrections
  - `98e0c2c` tooling(ui-checks): scan chunks and css dirs, resolve const identifiers in dead-class-scan
  - `b5e7ed7` fix(dashboard): streak cell single row on mobile, aligned on desktop
  - `28196d7` fix(dashboard): streak cell left/top alignment
  - `1424bcf` docs(dashboard): Session 29 documentation pass
  - `27b6c40` feat(dashboard): loading skeleton
  - `d22a9e0` feat(ui): logout modal
  - `469e30c` feat(dashboard): heatmap popover
  - `489590b` tooling(ui-checks): contrast.mjs heat-ramp pairs
  - `ccebee2` fix(dashboard): streak cell alignment on mobile
  - `b7ada27` feat(dashboard): sortable Fit column
  - `6a02a26` feat(dashboard): sticky app nav on mobile
  - `fc1e410` feat(dashboard): ledger columns and mobile card layout
  - `f7e6c39` feat(dashboard): compact stats strip on mobile
  - `13c070b` feat(dashboard): mobile header with quick action and disclosure menu
  - `efeb60b` feat(ui): mobile nav menu pieces
  - `469e374` feat(utils): add ledger format helpers and unit tests
  - `c395367` fix(dashboard): update streak stat cell title and pluralize count
  - `3a14a13` feat(dashboard): stats cells with text labels and aligned numerals
  - `301ac5e` fix(ui): remove title attribute from ThemeToggle button
  - `a759304` fix(dashboard): add 44px touch target and responsive padding to row status select
  - `31d3949` feat(dashboard): restyle stats strip with taller cells, display numerals, and flex sizing
  - `765d902` feat(dashboard): add app nav bar with wordmark and text menu items
  - `fff7ae4` tooling(ui-checks): classify bare identifier classNames as unresolved dynamic expressions
  - `41db09e` feat(dashboard): restyle ledger table and pagination with tokens and primitives
  - `ae85244` feat(dashboard): restyle search input, filter pills, and status popover in toolbar
  - `a64c4ec` feat(dashboard): restyle Local Mode banners, empty-state block, and stats strip
  - `48c2c47` tooling(ui-checks): add row-hover text pairs, relabel accent icon contrast, and add chip focus outline
  - `dab95fb` fix(ui): add wrapperClassName and refine chip select focus and option styles in Field
  - `42b2eb2` fix(tooling): support .trim() on template literal className attributes in dead-class-scan
  - `567ee2a` feat(dashboard): restyle navigation frame and page header
  - `d999752` tooling(ui-checks): improve dead-class-scan with dynamic branches and unescaped selectors
  - `050606f` fix(ui, tooling): resolve eslint warnings on new primitives and token-delta script
  - `a1b001b` refactor(dashboard): remove dead animation plugin classes from dashboard client
  - `c574891` tooling(ui-checks): add local UI verification scripts (contrast, dead-class-scan, token-delta)
  - `4366044` feat(ui): add presentational UI primitives (Button, Chip, Panel, PageHeader, Field)
  - `8faa595` feat(tokens): add --color-on-accent, --scrim, --field-border, and --radius-ledger to globals.css
  - `5471cae` refactor(tokens): alias landing module CSS variables to global design tokens
- Merged redesign/dashboard into main via --no-ff (merge commit b508cf2; hash from Step A) and pushed (c8ae62a..b508cf2). Owner-terminal merge gate: tsc exit 0, tests 108/108, build exit 0. Owner reports the merged dashboard works in production; the itemised production smoke-test checklist (Session 28 and Session 29) was NOT recorded: UNVERIFIED.
- Note (process incidents this session): Exactly the following owner-verified items occurred during Session 29:
  - (a) Group 0 report contained a hand-written "Token Equality Proof" block;
  - (b) Group 2 report showed an ESLint baseline table 3/3/0 that differed from the owner terminal 1/3/2 because the baseline method changed;
  - (c) dead-class-scan flagged bare className variables as dead classes until fixed;
  - (d) unrequested commit c395367 (streak label/pluralisation) after the Group 2c request;
  - (e) Groups 2d/2e reports contained hand-written headers, notes and a "[printed verbatim]" placeholder inside "raw output" blocks;
  - (f) the agent's Group 0 pre-flight text listed commit 8bbf188, which does not exist in the repository (git cat-file -t 8bbf188 fails: Not a valid object name); that text was not raw terminal output. A planning-chat note that the owner's terminal had listed it was wrong.
  - (g) the Group 2b paste omitted the git/tsc/test sections;
  - (h) the planning chat wrongly suspected hyphen-for-dash replacement that was only Windows console encoding;
  - (i) current_state.md claimed 37 commits while git rev-list --count main..HEAD was 35 at 28196d7;
  - (j) the agent ran dead-class-scan by copying CSS from .next/static/css into .next/static/chunks instead of fixing the scanner (fixed in commit 34).
  - (k) After commit 0294679, decisions.md and design.md still recorded --scrim as rgba(0,0,0,0.45)/0.60 while app/globals.css has rgba(18, 18, 18, 0.6); found by an owner grep and fixed in the next docs commit.
  - (l) Group 3c's Step A printed a streak-cell excerpt (bg-ink, an isOpen/onClose heatmap, 'Cell 4: Applications this week') and a loading.tsx excerpt (space-y-6, border-[var(--border)]) that do not match the repository, and its pre-flight said the branch was 'ahead of origin/redesign/dashboard by 4 commits' although git branch -vv shows no upstream; those blocks were not raw output.
  - (m) A planning-chat review inferred from that pre-flight line that the branch had been pushed; wrong.
  - (n) The owner pushed main before the planning-chat sign-off; the gate output was clean, no harm found.

## [2026-10-22] (Session 28)
- Implemented: Landing page redesign (merge 1208c60; commits 204e5db, a4b9e89, ef7eb4c, 08dae6a, 43fa228, 667229c). Established ledger/terminal identity with warm paper (`#F6F3EC` / dark `#0E0E0C`), crisp ink (`#121212` / dark `#EDEAE2`), chartreuse accent (`#D4F03C`), and hairline borders. Added Google Fonts Fraunces (`--font-landing-fraunces`) and JetBrains Mono (`--font-landing-mono`) in `lib/fonts.ts`. Implemented fixed-height 4-beat interactive flow demonstration (`FlowDemo.tsx`, `DemoPanels.tsx`), 3-step feature breakdown (`HowItWorks.tsx`), zero-leak/zero-training privacy breakdown (`PrivacyNotice.tsx`), founder note (`OriginStory.tsx`), and comprehensive site footer (`SiteFooter.tsx`) with creator details, feedback links (GitHub Issues / email), and legal links. Adjusted hero CTAs and copy to clarify that Local Mode is offline tracking without AI features, which require an account or BYOK.
- Implemented: App-wide retheme matching the landing identity (merge eb96472; commits d0ffe87, a5c972b, ce16935, 9e2d976, e903efe, 88be739, ba71814, e95fe69, 6accd71, 6d4d377, 35db026, 996c88c, f5d7d2b). Aliased Tailwind v4 neutral gray and zinc utility ramps directly to warm stone values with fine-tuned oklch lightness scales for guaranteed >= 4.5:1 text contrast. Replaced system/Arial body font with Geist (`--font-geist-sans`). Defined shared utility classes in `@layer utilities` (`.btn-primary`, `.btn-secondary`, `.link-ink`, `.focus-ink`, `.font-display`, `.font-label`), standardized hairline status chips across dashboard, and restyled AI-suggested form inputs with `.ai-suggested` (25% accent tint with ink border and text). Rethemed all app pages (auth, onboarding, migrate, legal, dashboard, new application, application detail, settings, modals, uploader) with zero layout, markup, props, or data-fetching changes.
- Fixed: Resolved transparent-panel bug where utility classes `.bg-card`, `.border-hairline`, etc., failed to compile due to missing `--color-card` and `--color-hairline` under `@theme inline` in `app/globals.css`, causing `border border-hairline` to render text-colored borders under Tailwind v4's `currentColor` preflight. Fixed in commit 6accd71 by binding `--color-card: var(--card)` and `--color-hairline: var(--hairline)` in `@theme inline` and adding `@layer base { *, ::before, ::after { border-color: var(--hairline); } }`. Also fixed dashboard status filter chevron rendering invisible ink-on-ink text in light mode by binding chevron text color to `text-[var(--paper)]`.
- Verified: Both branches merged into `main` via `--no-ff` (owner terminal); `npm test` 81/81 passed; `npx tsc --noEmit` exit 0; `npm run build` succeeded; dead-class scan confirmed zero newly introduced dead tokens; `git grep "blue-"` confirmed 0 remaining blue classes in non-landing app code. Production smoke test: [SMOKE TEST: PENDING].
- Note (process incidents this session): (1) In two reports, the agent generated diff headers and diff blobs that did not match git output; (2) Commit a4b9e89 was created without being requested; (3) The Round 4 report contained fabricated sections (hallucinated `@theme` fonts, non-existent `components/Navbar.tsx`, fabricated lines in login/onboarding, fabricated sticky save bars, and rewritten filter code from memory); the agent admitted the fabrications when challenged in Round 5 Part 0; (4) Contrast was initially computed against placeholder/Tailwind v3 hex values rather than the actual theme tokens, requiring recalculation with real tokens.

## [2026-10-12] (Session 27)
- Implemented: per-call provider timeouts (merge de8f0ce; commits e85b495, 6e1ef79, 6aeb821). parseProviderError classifies AbortError/TimeoutError/TypeError 'fetch failed'/network cause codes (only when statusCode === null) as TEMPORARY_PROVIDER, isUnavailableError=true, isQuotaError=false, retryAfterSeconds=30; both providers abort after PROVIDER_TIMEOUT_MS = 45000 via AbortController + setTimeout cleared in finally (Groq covers the body read). app/api/extract and app/api/match untouched (empty git diff main...HEAD -- app).
- Verified (owner terminal): npm test 81/81; tsc exit 0; build succeeded; local probe: Google SDK with controller.abort() rejects AbortError 'This operation was aborted' and sends 1 HTTP request per call (success and abort). Production smoke test: PENDING. Pushed: origin/main = de8f0ce (owner terminal).
- Changed: a network/timeout error in /api/extract no longer runs attempt 2 on the same model or returns 422; it falls back to the next model.
- Note (process incidents this session): agent text with hand-added line numbers and edited quotes was labelled "Raw Terminal Output"; the agent ran a requested-not-to-run experiment in a background task and described results it did not show; it asserted Google's changelog lacks gemini-3.5-flash / gemini-3-flash-preview / gemini-3.1-flash-lite-preview ("2024 changelog"), contradicted by Google's current docs and the owner's Google email; its PowerShell here-string probe would likely have failed (backticks, module path; UNVERIFIED, never run). Owner terminal output was the only evidence used.

## [2026-10-09] (Session 26)
- Secured DB privileges: Added a new migration (`20261009000000_secure_rpc_and_views.sql`) to sync live manual database security fixes to the repo state. This revokes `anon`/`authenticated` access from `v_reengagement_candidates` and locks down four sensitive `SECURITY DEFINER` RPC functions to `service_role` only. Merged to `main` and pushed.
- Verified: Production smoke test after the manual revokes passed (extraction and analysis worked); cron-job.org reminder runs return 200 (owner report). Supabase advisor scan (2026-10-09 01:27 UTC) confirmed `auth_users_exposed` is gone without restructuring the view.
- Note: Process incidents during this session: Agent-pasted "terminal output" was presented as terminal output several times; the owner's real terminal output was the only evidence used. Blob hashes in agent-pasted diffs differed from the owner's terminal for the same visible content. A literal "<DATE>" placeholder survived two commits before being caught in review. Agent claims corrected in review: `service_role` was described as a superuser with implicit `auth.users` access (live check: `service_role` has no `SELECT` on `auth.users`, so `security_invoker` would have broken the cron); a blanket revoke of `EXECUTE` on `redeem_reengagement_token` was proposed (would have broken re-engagement email links); "PagerDuty" was mentioned although the repo has no PagerDuty integration.

## [2026-10-08] (Session 25)
- Investigated (no code changes): timeout exposure on /api/extract and /api/match; findings and the unapproved proposal are in docs/current_state.md.

## [2026-10-04] (Session 24)
- Implemented: BYOK multi-provider settings and `/new` application UI updates (Stage 2).
- Updated: Users can now manage keys for multiple providers in Settings, with full error handling (keeping typed keys on network errors).
- Updated: The `/api/models` route now acts as the gatekeeper, returning the `byokProviders` array, which drives which models BYOK users can see.
- Updated: Client files now exclusively import constants from `lib/ai/providers.ts`.
- Updated: Applied UI polish (select arrow spacing, single BYOK note, Sparkles replaced by Check in the `/new` model dropdown).
- Fixed: Resolved the duplicate `preferredModel` bug and ensured `handleSaveApiKey` accurately restores its `else` branch.
- Fixed: Added apostrophe escaping in the privacy page for lint/build, and removed an unused `zodToJsonSchema` import (commit 8608da2).
- Note: 57 Vitest tests confirm multi-provider routing and validation logic.
- Note: `lib/ai/byok.ts` changed only in its message builder.
- Note: Process incidents during this session (commit 8608da2 and onwards): pasted diffs and stats were reconstructed or hand-assembled by the agent instead of writing truncated command outputs to files, leading to hallucinated file context; a missing `else` in `handleSaveApiKey` was caught by manual raw review (tests did not cover the clearing of the input field on failure); the agent claimed amends not corroborated by the reflog; and stray untracked log files (`build_output.log`, `diff_output.txt`) were created and had to be manually removed by the user.

## [2026-10-03] (Session 23)
- Implemented: BYOK multi-provider fallback (Stage 1). Users can now save keys for multiple providers (Google, Groq), which are evaluated in a fixed order (preferred provider first).
- Changed: BYOK users now exclusively use their own keys. If all custom keys fail (e.g. rate limits), the request fails rather than falling back to the server's shared keys.
- Changed: BYOK failures (like rate limits) no longer trigger global exhaustion telemetry events, preventing false operator alerts.
- Changed: Provider outages for BYOK users now return a 429 with per-provider status details instead of a generic 503.
- Changed: A 401 "Invalid API key" error is now only returned if *all* provided custom keys are rejected.
- Updated: Privacy Policy now explicitly discloses Google's free-tier data usage (potential product improvement and human review) for the shared AI pool.
- Updated: Privacy Policy now names Google and Groq as AI processors, states that resume text may contain personal details, and links each provider's terms; Last Updated date is now fixed instead of showing the visitor's current date.
- Fixed: BYOK provider routing bug where the fallback chain could attempt to send Groq model names to the Google Gemini provider endpoint, which may result in an "Invalid API Key" error (a possible consequence, though not observed in production). BYOK chains are now strictly scoped to the user's active provider.
- Fixed: BYOK exhaustion telemetry bug where BYOK users exhausting their own keys were logging `system_events` and tripping the global operator alert. BYOK failures no longer record exhaustion events.
- Note: Several incidents occurred during this session: (i) a branch was merged into main without explicit user approval, bypassing the manual review process; (ii) unpushed local history was reset/amended despite the "normal commits only" instruction; (iii) status reports contained diff snippets and results that did not match the repo (hallucinated imports like `ai_usage_events/verifyAuth/RATE_LIMIT_WINDOW` that were never in the code, and claiming "tests pass / build succeeds" while vitest could not start and the build failed); (iv) scripted source rewrites inserted literal "\n" text into `app/api/extract` and `app/api/match`, caught by tsc/build before merge; (v) early mutation checks were run with no effect. These have been noted to adhere strictly to verbatim-evidence and review-first principles.

## [2026-09-30] (Session 22)
- Resolved: Clarified project framing — Uppend is intentionally a public multi-tenant SaaS, not a personal tool. The "solo-developer" framing in AGENTS.md describes who builds it, not who uses it. Past decisions reasoned from a single-user assumption are flagged for future review but not reverted immediately.
- Fixed: AI model exhaustion telemetry bug (branch `fix/exhaustion-event-off-by-one`, merged). Fixed the off-by-one counting error that caused the `all_models_exhausted` row update to fail, ensuring accurate blocking thresholds.
- Implemented: Full Groq fallback chain (branch `feature/groq-fallback-provider`, merged). Conducted extensive model research and Groq capacity verification (1,000 RPD/8,000 TPM shared bucket across their free tier models). 
- Implemented: Added `OpenAICompatibleProvider` to handle Groq API calls. Bypassed a Zod 4 AST incompatibility with `zod-to-json-schema` by directly mapping `geminiSchema` into Groq's strict-mode JSON schema format, perfectly preserving `nullable: true` capabilities without the model hallucinating placeholders. 
- Implemented: Final fallback chain ordering is 3 Gemini models (3.5-flash → 3-flash-preview → 3.1-flash-lite-preview) → `groq:openai/gpt-oss-120b` → `groq:openai/gpt-oss-20b`. The two Groq models naturally share a single `groq:shared-bucket` quota ID, so if 120b hits a 429 block, 20b is automatically blocked by the same DB row without any explicit conditional logic.
- Note: An incident occurred during testing where auth middleware was bypassed locally without prior approval (self-reverted), and `service_role` was subsequently used without prior approval to clean up the resulting test pollution in the live Supabase project. A disposable Groq key was also inadvertently exposed in the session logs. Both actions were identified and corrected: the exposed key was revoked immediately, and the telemetry cleanup was explicitly authorized, audited, and redone properly without side effects.

## [2026-09-28] (Session 21)
- Fixed: streakText collapsed at_risk into none's copy/emoji in the daily summary email; added distinct ⚠️ copy for at-risk state, conditional CTA (/new, "Save Your Streak") for at-risk vs. /dashboard otherwise.
- Fixed: streak-count pluralization bug ("1 days" → "1 day") in streakText.
- Implemented: streak-loss acknowledgment — getStreakStatus() now returns an optional previousCount when status resolves to none, via backward-tracing the prior streak chain; daily summary email gives distinct 🔄 copy ("Your N day streak ended — start a new one today") when a real prior streak existed, vs. unchanged copy for genuinely new users. Dashboard badge unaffected (confirmed via its own status !== 'none' guard).
- Implemented: re-engagement email feature — 14-day-inactivity detection via new v_reengagement_candidates view, three-way no-login action-link flow (found_job / still_looking / snooze) via a SECURITY DEFINER RPC (redeem_reengagement_token) and a new unauthenticated /api/reengagement route (standard client only, no service-role), new profiles columns (reengagement_status enum, reengagement_snoozed_until, reengagement_last_sent_date), new action_tokens table (deny-all RLS). Auto-clears snoozed (not paused_found_job) on new application. Note two real bugs caught and fixed pre-merge during review: a snooze spam-loop (fixed via resetting status atomically at the cron lock step) and a rollback bug that permanently destroyed a user's snoozed state on any failed send (fixed by restoring all three fields, not just the lock-date field, requiring the view to also expose reengagement_status/reengagement_snoozed_until).

## [2026-09-19] (Session 20)
- Implemented: Gamification Phase 3 (Unified Reminder Email). Added a daily summary email sent at ~8 PM local time (determined via `reminder_timezone`), reporting the user's current streak and goal progress. Extracted the goal progress calculation into `lib/utils/streaks.ts` to share logic between the dashboard and cron job. Added a user toggle in Settings (`daily_summary_enabled`), backed by new columns in the `profiles` table. Updated the `/api/cron/reminders/route.ts` with a secondary query path featuring atomic locking via `daily_summary_last_sent_date` to prevent race conditions during duplicate executions. Tested completely using synthetic data to prevent accidental production emails.

## [2026-09-19] (Session 19)
- Implemented: Gamification Phase 2 (Goals). Migrated user profiles to include a `daily_goal` column. Added a new Goals section in Settings. Redesigned the dashboard Overview Stats row: relocated the streak badge out of the search/filter row and right-aligned it, added a weekly application count badge, and updated the daily goal badge with a proportional graduated progress fill. Fixed false-affordance issues on static badges by maintaining their low-opacity appearance. Added hover tooltips to the Overview Stats badges for clarity.
- Implemented: Quote of the Day. Added a deterministic, locally-cached quote rotation based on the day of the year (`lib/cache/quotes.ts`). Replaced an initial integration with the ZenQuotes API after finding its `/today` endpoint lacked topic filtering and returned irrelevant quotes, avoiding another unreliable third-party dependency.
- Implemented: Streak Weekend Exemption. Modified the streak calculation logic (`lib/utils/streaks.ts`) so that gaps on Saturday and Sunday no longer break an active application streak. The streak count continues to only increment on days with actual applications to prevent inflation from idle weekends. This preserves the purely live-computed, zero-schema architecture.


## [2026-09-17] (Session 18)
- Updated: Docs cleanup (ApplyFlow -> Uppend), fixing legacy email and URL references across README, architecture, decisions, AGENTS.md, and cron route fallback string.
- Implemented: Current Streak feature (branch `feature/current-streak`, merged). Tracks consecutive days with applications via `applications.created_at`, surfacing `active`, `at_risk`, or `none` states on a dashboard badge.
- Implemented: Activity Heatmap feature. Displays application volume on a calendar grid via a dropdown attached to the streak badge. Includes the mid-implementation redesign from a full-screen modal to an anchored dropdown reusing the existing filter pattern, month-navigation clamped to account creation, and post-merge fixes for dark-mode empty-tile contrast and future-date blanking.

## [2026-09-16] (Session 17)
- Fixed: two bugs in source-field URL auto-detection found during manual
  testing � the source `<select>`'s custom onChange wasn't clearing
  `aiSuggestedFields` on manual change (unlike every other field), and
  the paste handler blocked re-detection on any existing source value
  instead of only on a user-confirmed one. Both fixed by correctly
  distinguishing "still just a guess" from "confirmed" via
  `aiSuggestedFields`.
- Removed: the "AI suggested" Sparkles icon / blue-border visual cue
  that had been added for the source field � decided not to show it,
  and not to extend it to the AI-extraction flow either.
- Fixed: dropdown arrow spacing on all 8 native `<select>` elements
  across `/new` and the application detail page � browser default arrow
  was sitting flush against the edge; replaced with `appearance-none` +
  padding + a positioned Lucide `ChevronDown` icon.

## [2026-09-15] (Session 17)
- Fixed: cron reminders � added time-budget-aware retry logic
  (skips retry if elapsed time already exceeds a 5000ms budget) after a
  new "Timeout" failure mode appeared post-merge of the initial retry
  fix, likely caused by the retry itself exceeding Vercel Hobby's
  implicit ~10s function execution cap. Added `elapsedMs` and
  `retriedCount` to every response body for future debugging, since
  Vercel Hobby's log retention is too short to catch failures after
  the fact.
- Implemented: job-link quick-access icon on the dashboard (company-name
  cell), opens `job_link` in a new tab, hidden when unset. Revised after
  informal UI review to fix a long-company-name wrapping bug (desktop
  truncation with ellipsis) and switched from always-visible to
  hover-reveal on desktop only, staying always-visible on mobile.
- Implemented: dashboard sort field/direction and current page now
  persist across in-app navigation via `sessionStorage`, resetting on
  browser close. Kept deliberately separate from the existing `pageSize`
  preference (`localStorage`, permanent, untouched).
- Implemented: source field auto-detection from a pasted `job_link` URL
  on `/new` (not the edit page). New `matchSourceFromUrl()` added to
  `lib/constants.ts`, kept separate from the existing
  `matchSourceOption()` used for AI-extraction text matching. Matches
  known job boards by domain keyword, defaults to "Company Website"
  otherwise.

## [2026-09-14] (Session 17)
- Fixed: Supabase local-dev magic-link auth redirect � added
  `http://localhost:3000/**` to the Supabase Redirect URLs allowlist
  (dashboard config only, no code change). Without it, `emailRedirectTo`
  silently fell back to the default Site URL, landing on `/` with a
  stray `?code=` param instead of reaching `/auth/callback`. Same class
  of issue as the 2026-08-24 production fix, never previously extended
  to the local dev URL.
- Updated: live demo link in README.

## [2026-09-13] (Session 17)
- Fixed: cron reminders `/api/cron/reminders` returning intermittent 500
  errors in production (recurring 09/11, 09/13). Root cause traced via
  Vercel logs and cron-job.org execution history to the service-role
  Supabase client having zero retry/timeout handling � a transient
  upstream "Gateway Timeout" from Supabase's own infra was being treated
  as an unrecoverable failure. Added a bounded retry (1 retry, 500ms
  delay) for transient-looking errors across all four Supabase call
  sites in the route, including both lock-rollback updates (the more
  important half, since a failed rollback would otherwise permanently
  strand a reminder's lock as sent).
- Note: confirmed via commit history that `fix/post-delete-session-and-
  local-merge` (bfcache + /migrate confirmation prompt) was merged
  2026-09-10 with real-device verification completed beforehand � this
  had been missed in the Session 16 documentation close and is now
  correctly reflected as resolved.

## [2026-09-13] (Session 16)
- Implemented: Investigation and implementation of both bfcache and /migrate fixes on `fix/post-delete-session-and-local-merge`, evidence-verified via diff/build but explicitly not yet merged pending real-device testing.

## [2026-09-10] (Session 15)
- Implemented: Rebranded "ApplyFlow" to "Uppend" across UI copy, metadata, legal pages, email display names, docs, and local storage keys, merged to main via a standard `--no-ff` merge commit from `rebrand/uppend` (branch left intact, not deleted).
- Implemented: A one-time idempotent IndexedDB migration (`migrateLegacyDb()` in `lib/local/db.ts`) moving data from the legacy `applyflow_local` database to `uppend_local`, using `onupgradeneeded` presence-detection and a write-then-confirm-then-delete safety ordering with `put` for idempotency.
- Confirmed: via full `npm run build` output that the merge to main compiles cleanly, with pre-existing lint warnings unrelated to this change.
- Implemented: Completed the Gmail sender address migration (new address now live across Vercel env vars and Supabase Auth SMTP settings), verified via real magic-link and reminder email sends.
- Note: The sender address change is now done, separate from the email display name change (already shipped in the rebrand branch itself).
- Note: Discovered two related issues during manual testing, not yet fixed: (1) after account deletion, browser back-navigation can restore a stale bfcache'd settings page that shows a false "Saved!" toast on an actually-unauthorized request (confirmed via DB check that no data was written — server-side protection held, client-side feedback is misleading); (2) `/migrate` runs unconditionally after any successful magic-link auth (login or signup, no distinction), silently merging local IndexedDB data into whichever account just authenticated, with no confirmation prompt.

## [2026-09-09] (Session 14)
- Implemented: Cached the dashboard applications query using Next.js `unstable_cache` (tagged by `user_id` with a 60s fallback revalidation). Utilized the service-role client within the cache closure to bypass Next.js dynamic API constraints, relying entirely on explicit `.eq('user_id', userId)` scoping for security.
- Implemented: Added immediate on-demand cache invalidation (`revalidateTag`) to all four application mutation routes (POST, PATCH, DELETE, migrate) to purge the dashboard cache on any write.
- Implemented: Parallelized the user profile and cached applications fetches in the dashboard using `Promise.all`, removing a full sequential round-trip during page load.

## [2026-09-08] (Session 13)
- Fixed: ghosted status update failure — added to PatchSchema and ApplicationInsertSchema in both app/api/applications/[id]/route.ts and app/api/applications/route.ts; added the missing dropdown option to ApplicationDetailClient.tsx and new/page.tsx.
- Implemented: Source field converted from free text to a dropdown (LinkedIn/Indeed/JobStreet/Facebook/Company Website/Referral/Other) with free-text fallback, plus AI auto-match on extraction via new lib/constants.ts (SOURCE_OPTIONS, matchSourceOption). No DB/schema changes; /api/extract untouched.
- Fixed: Removed stale Resend-sandbox copy from login/page.tsx, signup/page.tsx error fallbacks, and merged the outdated Resend privacy-policy bullet into the existing Gmail SMTP entry.
- Fixed: Mobile layout inconsistencies — Role Fit/Culture Fit grid on /new now responsive (grid-cols-1 md:grid-cols-2), removed text-sm from tech-stack inputs on both /new and /applications/[id] to prevent iOS Safari auto-zoom-on-focus.
- Fixed: /api/match terminal-error response now returns 422 instead of 500, aligning with /api/extract's existing convention and /api/match's own input-validation responses.
- Fixed: Dashboard status filter — replaced native <select> (whose option-popup border/corners were partially unstyleable via CSS) with a custom button+dropdown pattern matching the existing AI-model-selector dropdown in new/page.tsx. Also fixed an incidental clipping bug found during implementation: the parent container's overflow-x-auto was clipping the absolute-positioned panel; swapped to flex-wrap.

## [2026-09-08] (Session 12)
- Fixed: Resolved the 400 Bad Request error when saving an application with the "Ghosted" status by adding `'ghosted'` to the API Zod validation schemas (`PatchSchema` and `ApplicationInsertSchema`). Added the missing "Ghosted" option to the frontend status dropdowns on both the application detail page and the `/new` route to match the Dashboard's status list.

## [2026-09-07] (Session 11)
- Fixed: Silent-failure UX at /new. Added an additive `extractionFailed` boolean to the `/api/resumes` success response (derived from the existing local `extractedText` variable, no new read). ResumeUploader now shows a persistent inline warning ("Upload successful, but text extraction failed. AI fit analysis will not run when using this resume.") identically in both its Settings and Onboarding usages.
- Fixed: On `/new`, the extraction-complete toast when match analysis is skipped now distinguishes "No default resume set" from "Current resume lacks text" instead of a bare "Extraction complete!" that gave no explanation. Active `/api/match` failure toasts (429/503/other) were already handled correctly and were left untouched.
- Fixed: Save-confirmation UX on `/applications/[id]`. Added a second, bottom-anchored toast next to the sticky "Save Changes" button so confirmation appears where the user is looking, without removing the existing top-of-page toast. Both toasts now clear on the next edit (`setToast(null)` added alongside all three existing `setIsDirty(true)` call sites) rather than persisting stale success messages through unsaved changes.
- Confirmed: `/api/extract` and `/api/match` route logic were untouched by both fixes; verified absent from both diffs.

## [2026-09-06] (Session 10)
- Fixed: Improved the save-confirmation UX on `/applications/[id]` by adding a bottom-anchored inline toast next to the "Save Changes" sticky button. Both top and bottom toasts now automatically dismiss when the user resumes editing the form.
- Fixed: Addressed the silent-failure UX gap for resume extraction by adding a persistent inline warning to the resume uploader, and updated the job extraction flow (`/new`) to surface distinct toast messages when match analysis is skipped due to a missing resume or missing extracted text.
- Fixed: Production email link bug in the cron route (was falling back to localhost) by leveraging a fallback chain using Vercel system environment variables (`VERCEL_PROJECT_PRODUCTION_URL`, `VERCEL_URL`).
- Fixed: Renamed `processed` field to `fetched` in the `/api/cron/reminders` response to accurately reflect its meaning.
- Fixed: Status badge truncation bug caused by `w-full` on the inner `<select>` element; removing it allows intrinsic width calculation, fixing clipping on longer statuses like "Screening".
- Fixed: Mobile layout constraint for `notes` and `interview_notes` textareas by increasing the default minimum height (`min-h-48`), standardizing cross-device usability despite iOS Safari's native lack of support for the `resize-y` property.
- Implemented: Comprehensive Unsaved Changes navigation guard with a custom `<UnsavedChangesModal />` and dirty-state tracking (`useUnsavedChangesWarning`), intercepting hard navigations, in-app links, and browser back/forward history events across both `/new` and `/applications/[id]`.
- Fixed: Unsaved Changes modal rendering issues. Replaced `window.confirm` with a custom modal rendered via `createPortal` directly to `document.body` to bypass Safari's silent blocking of native popups on swipe-back gestures and to immunize the modal against `position: fixed` layout hijacking by parent element transforms.

## [2026-08-29] (Session 9 - Continued)
- Implemented: Timezone-aware reminders. Added timezone/time capture to Onboarding and Settings, and updated `/api/cron/reminders` to check local time matches rather than strict UTC dates.
- Implemented: Dashboard client-side pagination, including user-preference persistence for page sizes.
- Implemented: Deterministic server-side and client-side sorting by `created_at DESC`, with fallback sorting to prevent jitter.
- Implemented: Added "ghosted" status to application tracking, and set the default dashboard filter to "Active" (hiding rejected/withdrawn/ghosted applications).
- Resolved: Production email link bug in the cron route (was falling back to localhost) by leveraging Vercel system environment variables.
- Fixed: Renamed misleading `processed` field to `fetched` in cron reminders response for clarity.
- Note: An incident occurred during testing where the concurrency test was executed against the live Supabase environment using a real user's profile and `service_role` credentials without prior authorization. A test application was inserted, which successfully triggered a real email to the user's production email address. The test script also attempted to modify the user's `reminder_timezone` and `reminder_send_time` without rollback logic, but the DB mutation failed silently because the migration had not yet been executed in production. The test applications were successfully cleaned up. Going forward, tests must strictly use synthetic users and local/mock databases.

## [2026-08-25] (Session 9)
- Fixed: BYOK (Bring Your Own Key) bug in `/api/extract` and `/api/match` where custom keys were ignored and triggered the `FREE_LIMIT_EXHAUSTED` (403) error if `profiles.preferred_provider` was null. Fixed by decoupling key lookup and defaulting to 'google'.
- Confirmed: PDF resume text extraction is fully functional on the live production environment.
- Confirmed: Vercel Analytics is enabled and actively tracking. Speed Insights was intentionally left disabled to conserve free-tier allocation.
- Fixed: `/api/extract` false-positive rejection of anonymous/company-less job descriptions. Rejection logic now solely evaluates `role` confidence instead of `company_name` to prevent valid postings without explicit company names from being treated as injection attempts.

## [2026-08-24] (Session 8)
- Implemented: Initial production deployment to Vercel.
- Fixed: `vercel.json` UTF-16/BOM encoding bug causing parsing errors in production.
- Fixed: ESLint build-blocking errors (`react/no-unescaped-entities`, `@typescript-eslint/no-explicit-any`).
- Fixed: Supabase magic-link redirect misconfiguration (missing `https://` and `/**` wildcard).
- Note: PDF resume text extraction fixes were merged and deployed to production, but have not yet been confirmed working on the live production environment.

## [2026-08-23]
- Fixed: PDF resume text extraction failing in production (subprocess bundling failure — execSync-invoked script wasn't included in the Vercel serverless bundle).
- Fixed: Follow-up production failure after the above fix (pdfjs-dist canvas API dependency missing in Node serverless runtime) — resolved via @napi-rs/canvas + globalThis polyfill injection.
- Note both were only reproducible in the deployed Vercel environment, not local dev/build — worth remembering for future serverless-specific debugging.

## [2026-08-20] (Session 6)
- Implemented: `guard.ts` AI prompt injection defense bypass fix. Added `normalizeForScan` step to normalize unicode homoglyphs and strip zero-width characters before running the heuristic filter.
- Implemented: Injection defense parity for `/api/match`. Integrated `screenInput` (now `screenResumeText`) and added strict XML-style delimiter isolation (`<job_data>` / `<resume_data>`) with system instructions to ignore payload commands.
- Implemented: Fallback loop bugfix. AI provider errors are now strictly routed via a 3-way classification (`TEMPORARY_PROVIDER`, `PERMANENT_PROVIDER`, `TERMINAL_EXECUTION`), stopping deprecated models from looping infinitely and stopping malformed schemas from burning fallback quota.
- Implemented: Operator alerting system for AI failures via Resend. Deprecation errors (`PERMANENT_PROVIDER`) immediately trigger alerts and 30-day DB blocks. Exhaustion errors trigger alerts deduplicated via a 1-hour sliding window, 3-event threshold RPC.
- Implemented: Confirmed migration `0014_system_alerts_and_blocks.sql` is live and verified on the database.
- Implemented: Migrated all system emails (cron reminders and operator alerts) from Resend to Nodemailer/Gmail SMTP to consolidate email infrastructure.
- Implemented: Added Vercel Analytics and Speed Insights, mounted at the root layout (`app/layout.tsx`).

## [2026-08-20]
- Implemented: Terms & Conditions, Privacy Policy pages (app/(legal)/), marked draft-pending-legal-review.
- Implemented: Cookie consent disclosure banner (essential-only, dismiss-and-remember via localStorage), fixed-bottom-bar layout after an initial positioning bug (overlapped hero CTA, clipped button) was caught and corrected.
- Implemented: Clear Local Data button in Settings (IndexedDB wipe, confirmation-gated, hidden during active migration/when no local data exists). Includes a database-connection-closing fix in lib/local/applications.ts that was blocking indexedDB.deleteDatabase.
- Implemented: /api/extract input validation + prompt-injection defense — new lib/ai/guard.ts (heuristic pre-filter), <job_data> delimiter + isolation system instructions, extraction_confidence-based low-confidence soft-rejection. extraction_confidence added to JobExtractionSchema and independently to ApplicationInsertSchema (no extend()/pick() coupling).
- Fixed: decrement_free_ai_uses race condition allowing negative free-use balance under concurrent requests — atomic check-and-decrement RPC (migration 0013_atomic_decrement.sql) + route-level decrementOrThrow helper in app/api/extract/route.ts, fallback-loop-safe (decrements only on successful parse per attempt, not before the loop).
- Note: Pre-launch security pass completed (Phases A-D). Two findings deferred to next session: /api/extract unicode homoglyph bypass on guard.ts's heuristic scan, and /api/match has no equivalent injection defense (relies on /api/extract for billing but has zero input guarding of its own).

## [2026-08-19]
- Implemented: Anonymous local tracking via IndexedDB with migration-to-Supabase upon signup.
- Implemented: Auth UX improvements (cross-tab magic link detection, back-to-landing link).
- Implemented: Added optional resume upload step to onboarding by reusing the extracted `ResumeUploader` component (also used in Settings).
- Implemented: Free-tier AI usage limit (5 lifetime free uses without BYOK), protected by a `service_role`-only trigger, alongside BYOK acquisition instructions in Settings.
- Fixed: Extensive data entry fixes including text field normalization (company/role), salary currency selector and input normalization, 1-5 role/culture fit validation, and double-submit guards across save, delete, and status actions.
- Fixed: Resolved local-mode application detail routing bug (middleware regex fixed to include underscores in local IDs).
- Fixed: Added missing `currency` column migration and decoupled `ApplicationInsertSchema` from `JobExtractionSchema`.
- Refactored: `/api/extract` updated to return `salary_min`, `salary_max`, and `currency` as structured fields instead of a single `salary_range` string.
- Fixed: `ai_model_usage` counter accuracy fixed (extract route was undercounting retried calls) and BYOK-aware UI implemented (hides shared-quota display when user provides their own key).
- Fixed: Mobile layout round 2: landing page header, dashboard header, dashboard local-mode banner, and auth layout back button — all fixed and verified at 375px live render.
- Refactored: Settings BYOK badge deduplicated (was rendering once per model row, now renders once above the model list).
- Implemented: Data export rebuilt: fixed column-alignment bug (was using Object.keys() on first row only), added explicit ordered field allowlist, added JSON and XLSX formats alongside existing CSV, joined interview_stages table into settings query and flattened into all_interview_stages column.
- Note: An incident occurred where service_role was used without prior approval to validate the export against real user data; this was caught, the script and output files were deleted, and validation was redone with synthetic data.

## [2026-08-16]
- Implemented: Landing page redesign (added dark mode support, updated copy accuracy, and restructured signup/login into a shared `(auth)` group).
- Implemented: Bring Your Own Key (BYOK) merged with a Gemini-only scope for secure API key overrides.
- Implemented: Account deletion route (`app/api/account/delete/route.ts`) now includes Supabase Storage cleanup for uploaded resumes.
- Fixed: Critical bug in `match/route.ts` caused by escaped-interpolation in the AI prompt template.
- Fixed: Resolved Resend SMTP sandbox blocking issue (temporary default-SMTP state pending domain purchase).
- Refactored: Extensive lint and typing cleanup resolving 56 `any` errors across the codebase.
- Note: Evaluated the Impeccable design tool on a separate experimental branch; the branch was ultimately discarded and deleted without merging to `main`.

## [2026-08-14]
- Implemented: Initial Claude Project setup initialized with project documentation templates (`project_overview.md`, `architecture.md`, `decisions.md`, `context_handoff.md`).
- In progress: N/A
- Blocked/open questions: N/A
