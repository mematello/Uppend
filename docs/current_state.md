# Uppend — Current State

*This file is the single source of truth for "what's true right now." It is rewritten in place at the close of every session — not appended to. Resolved items are removed here and folded into changelog.md / decisions.md instead. See architecture.md / decisions.md / schema.md / changelog.md for anything not called out below as recently changed.*

*Last updated: 2026-10-22 (Session 28 close)*

## 1. Confirmed working / shipped (Main branch)
- **Landing Page Redesign (merge 1208c60)**: Marketing landing page rebuilt with an editorial ledger/terminal identity. Includes `LandingHeader`, `LandingHero`, `FlowDemo`, `DemoPanels`, `HowItWorks`, `PrivacyNotice`, `OriginStory`, and `SiteFooter` using paper (`#F6F3EC` / dark `#0E0E0C`), ink (`#121212` / dark `#EDEAE2`), chartreuse accent (`#D4F03C`), and hairline borders. Typography utilizes Google Fonts Fraunces and JetBrains Mono via `lib/fonts.ts`. Hero copy and CTAs explicitly separate Local Mode (offline tracking) from AI features (requires account/BYOK). Merged into `main`. Production smoke test: [SMOKE TEST: PENDING].
- **App-Wide Retheme (merge eb96472)**: Authenticated app surfaces rethemed to match the landing identity without modifying layout, markup, props, or data fetching. Gray and zinc neutral ramps aliased directly to warm stone under `@theme inline` with calibrated oklch lightness values (guaranteeing >= 4.5:1 text contrast). App body font upgraded to Geist (`--font-geist-sans`). Standardized `@layer utilities` classes (`.btn-primary`, `.btn-secondary`, `.link-ink`, `.focus-ink`, `.font-display`, `.font-label`, `.status-*`, `.ai-suggested`). Base border reset configured for hairline borders. Merged into `main`. Production smoke test: [SMOKE TEST: PENDING].
- **Per-Call Provider Timeouts (merge de8f0ce)**: Per-call provider timeouts in `lib/ai/provider.ts` (45s timeout via AbortController + setTimeout) and error classification in `parseProviderError` in `lib/ai/models.ts`. Fallback loop advances on timeout/network error without retrying the same model. Pushed to `origin/main` in Session 27.
- **DB Privilege Lockdown (merge 0752ba9)**: Sensitive RPC functions restricted to `service_role`, `v_reengagement_candidates` view secured from anon/authenticated access. Supabase advisor scan confirmed `auth_users_exposed` resolved.
- **BYOK Stage 1 & 2 Multi-Provider Support**: Fallback chain supports custom keys for Google and Groq; Settings allows managing keys per provider; `/api/models` restricts available models to configured providers; BYOK failures do not exhaust shared pool or trigger operator alerts.
- **Vitest Test Suite**: 81 tests passing (`npm test`), validating provider routing, error classification, and fallback mechanisms with mocks.
- **Privacy Policy**: Discloses Google and Groq as processors, links their terms, and details free-tier data usage for the shared AI pool.
- **Email & Streak Architecture**: Automated streak tracking, at-risk/loss notifications, 14-day inactivity re-engagement flow via action tokens, and Gmail SMTP delivery.

## 2. Open / blocking

- **Deeper full redesign of app pages**: The owner wants a deeper redesign of the core authenticated app pages (dashboard, application detail, settings, new application) scheduled for a later session. The current retheme is class/token-level only with preserved legacy layouts.
- **Remove `seed_and_test.js`**: Legacy root script `seed_and_test.js` needs to be safely removed on its own dedicated branch.
- **Repo-wide lint cleanup**: Several ESLint warnings and non-blocking lint errors remain across the codebase; needs a focused cleanup pass.
- **Dead classes from missing Tailwind plugins**: Classes expecting `@tailwindcss/typography` (`prose`, `prose-stone`, etc.) or `tailwindcss-animate` (`animate-in`, `fade-in`, etc.) exist in components/pages but the packages are not installed in `package.json`.
- **`metadataBase` warning & OG image**: Next.js build logs a warning that `metadataBase` is missing for social graph metadata. Open Graph (OG) image generation/assets need to be created and linked.
- **Donation platform**: Evaluation and setup of a project donation channel (Buy Me a Coffee, GitHub Sponsors, or Ko-fi) deferred to a future session.
- **Unused hero video in `public/videos/`**: `public/videos/uppend-vid-demo.mp4` (~4.65 MB) is unused after the landing redesign replaced the video player with the interactive `FlowDemo` component. Should be removed to reduce repository/bundle weight.
- **Landing tokens duplicated across CSS files**: Color tokens and CSS variables are partially duplicated between `components/landing/landing.module.css` and `app/globals.css`. Should be unified into a single source of truth in `globals.css`.
- **Settings checkbox/radio accent color**: Checkbox and radio input accents in `SettingsClient.tsx` need verification to ensure no default browser blue accents remain.
- **Cookie banner footer padding on mobile**: On small mobile viewports, the fixed cookie consent banner can overlap the site footer or action buttons if bottom padding is insufficient.
- **README documentation still Gemini-only**: `README.md` still describes a Gemini-only AI pipeline and has not been updated for the Groq fallback provider or BYOK multi-provider support.
- **Source-field bug on `/new`**: Owner report: when a JD is pasted and the source is auto-selected, it is overwritten to blank after extraction and analysis; not yet investigated, no root cause established.
- **`search_path` unpinned on public functions**: 8 public functions (`set_updated_at`, `handle_new_user`, `increment_model_usage`, `protect_free_ai_uses`, `decrement_free_ai_uses`, `record_exhaustion_event`, `redeem_reengagement_token`, `block_model`) have mutable search paths flagged by Supabase advisor; needs a dedicated migration cycle.
- **`handle_new_user` trigger drift**: `handle_new_user` and its trigger exist in the live database but are missing from `supabase/migrations/`.
- **`redeem_reengagement_token` validation review**: Executable by `anon` and `authenticated` for `/api/reengagement`; needs review of expiry, single-use, and action validation.
- **Leaked password protection / password signups check**: Check whether password signups are enabled in Supabase Auth settings given that magic link is the intended authentication method.
- **`interview_stages` dormant table**: Read-only in settings export, nothing inserts or updates it; decide whether to drop in a migration.
- **Re-engagement migration apply date**: Exact date migration was run on the live DB is unrecorded.
- **Default-privileges migration**: Decide policy to stop Supabase default grants on future views/functions.
- **Google model deprecation / availability**: gemini-3.5-flash deprecation/redirect notice needs confirmation against Google docs before updating `AI_MODELS`.
- **Timeout test gap**: Shared-pool 30s block and `checkAndRecordExhaustion` on timeout remain untested in route-level integration tests.
- **Provider timeout duration**: 45s timeout is unmeasured; gather real production call durations.
- **Aborted call billing & telemetry**: Aborted Google calls may incur billing and are not recorded in `ai_model_usage`.
- **`zod-to-json-schema` dependency cleanup**: Still in `package.json` with no active imports; removal requires lockfile modification.

## 3. Next steps, priority order

1. **Verify production deployment**: Run smoke tests against production once Session 28 changes are deployed by the owner.
2. **Source-field bug on `/new`**: Investigate and fix the source field being cleared post-extraction.
3. **Open maintenance items**:
   - Remove `seed_and_test.js` on its own branch.
   - Remove unused `public/videos/uppend-vid-demo.mp4`.
   - Add `metadataBase` to root metadata and create default OG image.
   - Clean up dead classes / install missing Tailwind plugins or replace with standard utilities.
   - Unify landing tokens into `globals.css`.
   - Update `README.md` to reflect multi-provider fallback and BYOK.
4. **Database security items**: Pin `search_path` on 8 public functions and document `handle_new_user` trigger in migrations.
5. **Deeper app redesign**: Plan and execute the full layout and UX redesign of authenticated pages.

## 4. Future plans (not yet scoped)

- **JD URL-fetching**: Large feature to fetch job descriptions directly from posting URLs (touches Protected AI Routes).
- **Non-tech job seeker generalization**: Broaden platform scope for non-tech job seekers (touches `applications.tech_stack` schema and AI prompts).
- **Application archiving & snapshotting**: Archive past applications rather than hard-deleting.
- **Application sharing**: Share application details or postings with other users.
