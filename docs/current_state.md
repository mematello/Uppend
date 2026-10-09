# Uppend — Current State

*This file is the single source of truth for "what's true right now." It is rewritten in place at the close of every session — not appended to. Resolved items are removed here and folded into changelog.md / decisions.md instead. See architecture.md / decisions.md / schema.md / changelog.md for anything not called out below as recently changed.*

*Last updated: 2026-10-08 (Session 25)*

## 1. Confirmed working / shipped (Main branch, fully pushed)
- **BYOK Stage 1 Multi-Provider Backend**: Fallback chain supports custom keys for multiple providers (Google, Groq) restricted strictly to their respective models. Outages properly return provider details in a 429.
- **Model-Name Exclusion Fix**: Exclusion logic strictly blocks by `modelName` and not the shared `trackingName`, preventing cross-provider routing bleed.
- **Vitest Harness**: The test harness (`vitest@2`) natively tests the AI provider routing and fallback logic natively with mocks. Run via `npm test`.
- **Privacy Policy**: Explicitly names Google and Groq as processors, links their terms, and discloses Google's free-tier data usage (training/human review) for the shared pool.
- **Re-Engagement Email & At-Risk States**: Production rules handle streak at-risk and loss properly; automated email flow enables snooze, found_job, or still_looking status toggling.
- **BYOK Stage 2 UI (merge commit b7a9677)**: Multi-provider key list, try-first selector, `/api/models` gating (BYOK users see only their providers' models), validateKey classification (401/403 rejected; 429/5xx/timeout/network unavailable; 400/404 config error; Google check via models endpoint with x-goog-api-key header), `lib/ai/providers.ts`, `byok.ts` message uses display names, 57 Vitest tests, UI polish (select arrow spacing, single BYOK note, Sparkles replaced by Check in the `/new` model dropdown). Live checks passed (user-reported). main pushed to origin: yes (b7a9677). Production check with a throwaway key: passed.

## 2. Open / blocking

- **default-privileges migration**: Draft a separate migration to alter default privileges for the `public` schema (functions only, not tables) so future objects don't automatically grant `EXECUTE` to `PUBLIC`.
- **search_path unpinned**: All `SECURITY DEFINER` functions currently have unpinned search paths (live `proconfig` is null).
- **handle_new_user drift**: `handle_new_user` and its trigger exist in the live database but are not present in the `supabase/migrations/` directory.
- **v_reengagement_candidates view restructure**: Deferred optional restructure of the view (e.g., joining `public.users` instead of `auth.users` and using `security_invoker = true`) until the Supabase advisor re-scans.
- **maxDuration / provider timeouts (investigated, plan not yet approved)**
   Verified findings:
   - No maxDuration (or any function timeout) is configured anywhere in the repo.
   - Vercel docs list Hobby default and maximum function duration as 300s with Fluid compute (https://vercel.com/docs/functions/limitations). Whether Fluid compute is enabled on this project is NOT confirmed.
   - Neither provider's generateStructured has a timeout or abort signal (lib/ai/provider.ts).
   - parseProviderError (lib/ai/models.ts) classifies AbortError, TimeoutError, "fetch failed" and ECONNRESET as TERMINAL_EXECUTION. In /api/extract that means attempt 2 runs on the same model and the request then fails with a 422 and no fallback to other models.
   - The shared-pool block time on temporary errors is retryAfterSeconds || (quota ? 86400 : 300).
   - Worst-case sequential provider calls: shared pool 5; BYOK one key 3; BYOK two keys 5. /api/extract could go higher in contrived cases (attempt 2 after a schema-parse failure, then a provider error): UNVERIFIED.
   - There is no overall time budget in either route.
   Proposed, NOT approved: per-call timeouts inside lib/ai/provider.ts plus classifying timeout/network errors as TEMPORARY_PROVIDER with a short retryAfterSeconds in parseProviderError; no change to app/api/extract or app/api/match; its own branch.
   Still open: the timeout value (needs real latency data from Vercel logs), which Google SDK mechanism to use (the SDK type evidence is ambiguous), what the routes return when every model times out (UNVERIFIED), and the Vercel dashboard values (Fluid compute, max duration), which I have not provided yet.
- **5xx Shared Bucket Blocking**: Should a 5xx error on `120b` block the shared bucket entirely, or still try `20b`? (unchanged)
- **Billing Tier Decision**: Decide between keeping the unpaid tier and disclosing training data usage vs. enabling billing for Google AI Studio. (unchanged)
- **Legal Counsel Review**: Review free-tier data use disclosure (paste/upload notice?), Groq DPA coverage, retention durations, EEA/UK handling (SCCs/cookie banners, and Google's paid-terms exception), Vercel hosting/analytics disclosure, and the DB privilege exposure window (from when the 20260920212200 migration was applied (apply date: <owner to confirm>) until 2026-10-09). (unchanged except exposure window added)
- **zod-to-json-schema is still in package.json** with no imports in app/ or lib/ (only a comment at lib/ai/provider.ts:121); removal touches the lockfile, so its own task.
- **Corrupted Currency Symbols**: probably a PowerShell display issue (Get-Content without -Encoding UTF8 showed "âœ¨" for "✨"); verify with -Encoding UTF8 or git diff before treating it as a bug.
- **Remaining sparkle icons**: "Analyzing fit..." line and the "✨ Extract Data" button text were left in place; decision pending.
- **Minor follow-ups, non-blocking**: updatePreferredProvider returns "You must save an API key" on any DB error (not only "no row"); `any` types for the `updates` objects in actions.ts; deleteApiKey does a no-op update when preferred_model is already null.
- **UI & Flow Backlog**: Timezone dropdown picker; Mobile layout issues (stacked progress rows, left-aligned dashboard header); Source auto-detect missing on application edit page (decided /new-only on 2026-09-15; confirm whether this is a reversal request).
- **AGENTS.md Outdated Context**: Project description still claims "solo-developer personal tool" (unchanged).
- **SaaS Architecture Review**: Review query performance in `/dashboard` (slimming projection instead of `select('*')`), confirm `revalidateTag` usage across mutations, and note future needs for server-side pagination if users exceed hundreds of applications.

## 3. Next steps, priority order

**Backlog:**
1. **maxDuration cycle**: own branch and plan cycle after Stage 2.
2. **JD URL-fetching**: Large feature, touches a Protected AI Route, needs its own full plan cycle.
3. **Visual Identity Pass**: A visual-identity pass on the app's uniform rounded-full pill treatment is needed.
4. **Non-tech-job-seeker generalization idea**: An idea to broaden the platform for non-tech job seekers (touches `applications.tech_stack` schema + both Protected AI Route prompts).
5. **Archive as snapshot**: Allow users to archive all/selected applications rather than deleting them when starting fresh.
6. **Application sharing**: First multi-user/social feature — let a user share an application for others to apply.

## 4. Future plans (not yet scoped)

*(No current vague future plans; concrete features moved to Open / blocking)*
