# Uppend — Current State

*This file is the single source of truth for "what's true right now." It is rewritten in place at the close of every session — not appended to. Resolved items are removed here and folded into changelog.md / decisions.md instead. See architecture.md / decisions.md / schema.md / changelog.md for anything not called out below as recently changed.*

*Last updated: 2026-10-25 (Session 30 close)*

## 1. Confirmed working / shipped (Main branch)
- **`/new` Application Creation Redesign (merge 0aeb78c, pushed `e5a9773..0aeb78c`)**: Two-column split-intake layout (`lg:grid-cols-[340px_1fr]`), Local Mode (`max-w-4xl`), mobile 50/50 action row, Field primitive migration (`variant="textarea"`, `aiSuggested` prop), Alert primitive with tokenized tones, full-width model fallback badge, reserved `min-h-5` analyzing status slot, full-bleed sticky save bar outside the container (`sticky bottom-0 z-10 bg-card border-t border-hairline`), plain-text save bar toasts, L1 `resolveExtractedSource` contract (preserves existing source and tags on empty extraction, fixing the source-field bug on `/new`; owner verification per OWNER FACTS: real-device pass not yet run, production smoke test for /new pending), and L2 history-aware back button (`resolveBackNavigation`). Vitest test suite 117/117 passed. Owner real-device pass (iOS Safari, both themes): not yet run. Production smoke test for `/new`: pending.
- **Dashboard redesign (merge b508cf2, pushed)**: ledger-sheet dashboard with components/ui primitives, tokens --scrim/--field-border/--on-accent/--radius-ledger, mobile nav, stats strip, Fit/Applied columns, sortable Fit, heatmap, logout modal, loading skeleton, scripts/ui-checks.
- **Landing Page Redesign (merge 1208c60)**: Marketing landing page rebuilt with an editorial ledger/terminal identity. Includes `LandingHeader`, `LandingHero`, `FlowDemo`, `DemoPanels`, `HowItWorks`, `PrivacyNotice`, `OriginStory`, and `SiteFooter` using paper (`#F6F3EC` / dark `#0E0E0C`), ink (`#121212` / dark `#EDEAE2`), chartreuse accent (`#D4F03C`), and hairline borders. Typography utilizes Google Fonts Fraunces and JetBrains Mono via `lib/fonts.ts`. Hero copy and CTAs explicitly separate Local Mode (offline tracking) from AI features (requires account/BYOK). Merged into `main`. Production smoke test: pending.
- **App-Wide Retheme (merge eb96472)**: Authenticated app surfaces rethemed to match the landing identity without modifying layout, markup, props, or data fetching. Gray and zinc neutral ramps aliased directly to warm stone under `@theme inline` with calibrated oklch lightness values (guaranteeing >= 4.5:1 text contrast). App body font upgraded to Geist (`--font-geist-sans`). Standardized `@layer utilities` classes (`.btn-primary`, `.btn-secondary`, `.link-ink`, `.focus-ink`, `.font-display`, `.font-label`, `.chip-*`, `.ai-suggested`). Base border reset configured for hairline borders. Merged into `main`. Production smoke test: pending.
- **Per-Call Provider Timeouts (merge de8f0ce)**: Per-call provider timeouts in `lib/ai/provider.ts` (45s timeout via AbortController + setTimeout) and error classification in `parseProviderError` in `lib/ai/models.ts`. Fallback loop advances on timeout/network error without retrying the same model. Pushed to `origin/main` in Session 27.
- **DB Privilege Lockdown (merge 0752ba9)**: Sensitive RPC functions restricted to `service_role`, `v_reengagement_candidates` view secured from anon/authenticated access. Supabase advisor scan confirmed `auth_users_exposed` resolved.
- **BYOK Stage 1 & 2 Multi-Provider Support**: Fallback chain supports custom keys for Google and Groq; Settings allows managing keys per provider; `/api/models` restricts available models to configured providers; BYOK failures do not exhaust shared pool or trigger operator alerts.
- **Vitest Test Suite**: 117 tests passing (`npm test`), validating provider routing, error classification, fallback mechanisms with mocks, ledger formatting/sort helpers, `resolveExtractedSource`, and `resolveBackNavigation`.
- **Privacy Policy**: Discloses Google and Groq as processors, links their terms, and details free-tier data usage for the shared AI pool.
- **Email & Streak Architecture**: Automated streak tracking, at-risk/loss notifications, 14-day inactivity re-engagement flow via action tokens, and Gmail SMTP delivery.

## 2. Open / blocking
- **Remaining page redesigns, in order: application detail, settings, auth+onboarding+migrate, terms+privacy, modals+cookie banner+empty/loading/error states**
- **Production smoke test for `/new`**: Status: pending. Owner real-device pass (iOS Safari, both themes): not yet run.
- **`model_used` returns quota tracking key**: `/api/extract` and `/api/match` return `modelConfig.trackingName` (e.g. `groq:shared-bucket`) as `model_used`; fallback badge and toast display this tracking key.
- **No model display-name helper**: No client-safe helper exists to map tracking keys to human-readable names; addressing this requires a protected-route cycle.
- **Old modals pending redesign**: `UnsavedChangesModal` and `ResumePreviewModal` retain legacy styling with dead `animate-in` classes; scheduled for the modals/shared states group.
- **Alert success tone currently unused**: Neutral ink tint implemented in `Alert.tsx` is currently unreferenced in application markup (save bar toasts use plain text).
- **Dead-class-scan scanner blind spot**: `scripts/ui-checks/dead-class-scan.mjs` cannot resolve dynamic or object-literal class maps (such as the tone map in `Alert.tsx`); requires build inspection or grep compile proof.
- **History-aware back navigation `history.length` caveat**: `resolveBackNavigation` navigates back when clean and `window.history.length > 1`, which may navigate externally if `/new` was opened directly in an existing browser tab.
- **Pre-existing dead plugin classes outside the dashboard (login/signup/migrate/UnsavedChangesModal animate-in/fade-in/zoom-in; privacy/terms prose) are deleted per page branch, not installed**
- **Heatmap month nav buttons show faded (not hidden) at the first/last month**
- **Dashboard is no longer purely presentational: sortable Fit is an owner-approved logic exception, see decisions.md**
- **Session 28/29 production smoke tests not itemised: owner to run the checklist (both themes, mobile, footer links, sign-up/log-in, Local Mode, account mode) and record the result**
- **AGENTS.md output-discipline rule added**
- **Remove `seed_and_test.js`**: Legacy root script needs to be safely removed on its own dedicated branch.
- **Repo-wide lint cleanup**: Several ESLint warnings and non-blocking lint errors remain across the codebase; needs a focused cleanup pass.
- **`metadataBase` warning & OG image**: Next.js build logs a warning that `metadataBase` is missing for social graph metadata. Open Graph (OG) image generation/assets need to be created and linked.
- **Donation platform**: Evaluation and setup of a project donation channel deferred to a future session.
- **Unused hero video in `public/videos/`**: `public/videos/uppend-vid-demo.mp4` (~4.65 MB) is unused after the landing redesign. Should be removed.
- **Settings checkbox/radio accent color**: Checkbox and radio input accents in `SettingsClient.tsx` need verification to ensure no default browser blue accents remain.
- **Cookie banner footer padding on mobile**: On small mobile viewports, the fixed cookie consent banner can overlap the site footer or action buttons.
- **README documentation still Gemini-only**: `README.md` still describes a Gemini-only AI pipeline; not updated for Groq fallback or BYOK multi-provider.
- **`search_path` unpinned on public functions**: 8 public functions flagged by Supabase advisor; needs a dedicated migration cycle.
- **`handle_new_user` trigger drift**: Trigger exists in live DB but is missing from `supabase/migrations/`.
- **`redeem_reengagement_token` validation review**: Needs review of expiry, single-use, and action validation.
- **Leaked password protection / password signups check**: Check whether password signups are enabled in Supabase Auth settings.
- **`interview_stages` dormant table**: Decide whether to drop in a migration.
- **Re-engagement migration apply date**: Exact date migration was run on the live DB is unrecorded.
- **Default-privileges migration**: Decide policy to stop Supabase default grants on future views/functions.
- **Google model deprecation / availability**: gemini-3.5-flash deprecation notice needs confirmation against current Google docs.
- **Timeout test gap**: Shared-pool 30s block and `checkAndRecordExhaustion` on timeout remain untested in route-level integration tests.
- **Provider timeout duration**: 45s timeout is unmeasured; gather real production call durations.
- **Aborted call billing & telemetry**: Aborted Google calls may incur billing and are not recorded in `ai_model_usage`.
- **`zod-to-json-schema` dependency cleanup**: Still in `package.json` with no active imports.

## 3. Next steps, priority order

1. **/new + Session 28/29/30 smoke checklist (owner)**: Owner to run the checklist (both themes, mobile, footer links, sign-up/log-in, Local Mode, account mode, `/new` create/extract flows) and record the result.
2. **Redesign application detail**: Step 0 -> two static previews -> plan -> implement by groups -> verify -> device review -> merge gate.
3. **Maintenance list unchanged**:
   - Remove `seed_and_test.js` on its own branch.
   - Remove unused `public/videos/uppend-vid-demo.mp4`.
   - Add `metadataBase` to root metadata and create default OG image.
   - Database security items: Pin `search_path` on 8 public functions and document `handle_new_user` trigger in migrations.

## 4. Future plans (not yet scoped)

- **JD URL-fetching**: Large feature to fetch job descriptions directly from posting URLs (touches Protected AI Routes).
- **Non-tech job seeker generalization**: Broaden platform scope for non-tech job seekers (touches `applications.tech_stack` schema and AI prompts).
- **Application archiving & snapshotting**: Archive past applications rather than hard-deleting.
- **Application sharing**: Share application details or postings with other users.
