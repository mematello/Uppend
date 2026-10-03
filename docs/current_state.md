# Uppend — Current State

*This file is the single source of truth for "what's true right now." It is rewritten in place at the close of every session — not appended to. Resolved items are removed here and folded into changelog.md / decisions.md instead. See architecture.md / decisions.md / schema.md / changelog.md for anything not called out below as recently changed.*

*Last updated: 2026-10-03 (Session 23)*

## 1. Confirmed working / shipped (Main branch, fully pushed)
- **BYOK Stage 1 Multi-Provider Backend**: Fallback chain supports custom keys for multiple providers (Google, Groq) restricted strictly to their respective models. Outages properly return provider details in a 429.
- **Model-Name Exclusion Fix**: Exclusion logic strictly blocks by `modelName` and not the shared `trackingName`, preventing cross-provider routing bleed.
- **Vitest Harness**: The test harness (`vitest@2`) natively tests the AI provider routing and fallback logic natively with mocks. Run via `npm test`.
- **Privacy Policy**: Explicitly names Google and Groq as processors, links their terms, and discloses Google's free-tier data usage (training/human review) for the shared pool.
- **Re-Engagement Email & At-Risk States**: Production rules handle streak at-risk and loss properly; automated email flow enables snooze, found_job, or still_looking status toggling.

## 2. Open / blocking

- **BYOK Multi-Provider (Stage 2)**: Expand the Settings UI to support adding/removing keys per-provider, update the `/new` quota & model-selector logic, correctly display `data.message` for BYOK 429/401, update provider names, and remove stale "Gemini-only" text from UI and documentation (`architecture.md`, `README.md`, `decisions.md`).
- **5xx Shared Bucket Blocking**: Should a 5xx error on `120b` block the shared bucket entirely, or still try `20b`?
- **BYOK Multi-Provider maxDuration Risk**: A two-key BYOK chain can make up to 5 sequential model calls without a `maxDuration` limit on the `/api/extract` or `/api/match` routes. This risks a Vercel function timeout error (504 Gateway Timeout) on long chains before exhaustion completes properly.
- **Client-side 429 Override**: The `/new` route currently overrides any 429 response body with a generic message, hiding new BYOK-specific exhaustion messages (will be resolved by Stage 2).
- **Billing Tier Decision**: Decide between keeping the unpaid tier and disclosing training data usage vs. enabling billing for Google AI Studio.
- **Legal Counsel Review**: Review free-tier data use disclosure (paste/upload notice?), Groq DPA coverage, retention durations, EEA/UK handling (SCCs/cookie banners, and Google's paid-terms exception), and Vercel hosting/analytics disclosure.
- **Corrupted Currency Symbols / Unused Imports Verification**: Schema description strings for `currency` previously suspected of corruption (like "Γé▒", "ΓÇö") in `lib/schemas` and `geminiSchema` are verified intact (₱, $, €) but should be checked for encoding on different machines. A seemingly unused `zodToJsonSchema` import and dependency (`zod-to-json-schema`) exists in `lib/ai/provider.ts` but is actually being exported/used.
- **SaaS Architecture Review**: Review query performance in `/dashboard` (slimming projection instead of `select('*')`), confirm `revalidateTag` usage across mutations, and note future needs for server-side pagination if users exceed hundreds of applications.
- **UI & Flow Backlog**: Timezone dropdown picker; Mobile layout issues (stacked progress rows, left-aligned dashboard header); Source auto-detect missing on application edit page.
- **AGENTS.md Outdated Context**: Project description still claims "solo-developer personal tool".

## 3. Next steps, priority order

**Backlog:**
1. **JD URL-fetching**: Large feature, touches a Protected AI Route, needs its own full plan cycle.
2. **Visual Identity Pass**: A visual-identity pass on the app's uniform rounded-full pill treatment is needed.
3. **Non-tech-job-seeker generalization idea**: An idea to broaden the platform for non-tech job seekers (touches `applications.tech_stack` schema + both Protected AI Route prompts).
4. **Archive as snapshot**: Allow users to archive all/selected applications rather than deleting them when starting fresh.
5. **Application sharing**: First multi-user/social feature — let a user share an application for others to apply.

## 4. Future plans (not yet scoped)

*(No current vague future plans; concrete features moved to Open / blocking)*
