# Uppend Database Schema

This document is a snapshot of the actual PostgreSQL database schema as generated from the `supabase/migrations/` files.

## Tables

### `users`
Synced directly from `auth.users` via a foreign key with cascade deletion.
- `id` (UUID, Primary Key, Default `gen_random_uuid()`, References `auth.users(id)` ON DELETE CASCADE)
- `email` (TEXT, UNIQUE, NOT NULL)
- `created_at` (TIMESTAMPTZ, NOT NULL, Default `NOW()`)

### `profiles`
User profile data, linked to authentication.
- `id` (UUID, Primary Key, References `auth.users(id)` ON DELETE CASCADE)
- `full_name` (TEXT, NOT NULL)
- `created_at` (TIMESTAMPTZ, NOT NULL, Default `NOW()`)
- `preferred_model` (TEXT, nullable)
- `preferred_provider` (TEXT, nullable)
- `free_ai_uses_remaining` (INT, NOT NULL, Default `5`, protected by trigger)
- `reminder_timezone` (TEXT, nullable)
- `reminder_send_time` (TIME, nullable, Default `'09:00:00'`)
- `daily_goal` (INT, NOT NULL, Default `5`, CHECK `daily_goal > 0`)
- `daily_summary_enabled` (BOOLEAN, NOT NULL, Default `FALSE`)
- `daily_summary_last_sent_date` (DATE, nullable)

### `applications`
Core entity for tracking job applications.
- `id` (UUID, Primary Key, Default `gen_random_uuid()`)
- `user_id` (UUID, NOT NULL, References `users(id)` ON DELETE CASCADE)
- `company_name` (TEXT, NOT NULL)
- `role` (TEXT, NOT NULL)
- `tech_stack` (TEXT[], array of strings)
- `date_applied` (DATE)
- `status` (`application_status` enum, NOT NULL, Default `'draft'`)
- `job_link` (TEXT, nullable)
- `location` (TEXT, nullable)
- `salary_range` (TEXT, nullable)
- `currency` (TEXT, Default `'PHP'`)
- `source` (TEXT, nullable)
- `recruiter_name` (TEXT, nullable)
- `contact_info` (TEXT, nullable)
- `next_action` (TEXT, nullable)
- `next_action_date` (DATE, nullable)
- `priority` (`application_priority` enum, nullable)
- `resume_version` (TEXT, nullable)
- `cover_letter_sent` (BOOLEAN, Default `FALSE`)
- `role_fit` (SMALLINT, nullable)
- `culture_fit` (SMALLINT, nullable)
- `rejection_reason` (TEXT, nullable)
- `notes` (TEXT, nullable)
- `raw_jd` (TEXT, nullable)
- `extraction_confidence` (JSONB, nullable)
- `created_at` (TIMESTAMPTZ, NOT NULL, Default `NOW()`)
- `updated_at` (TIMESTAMPTZ, NOT NULL, Default `NOW()`, auto-updates via trigger)
- `interview_stage` (TEXT, nullable)
- `interview_notes` (TEXT, nullable)
- `reminder_enabled` (BOOLEAN, Default `FALSE`)
- `next_action_reminder_sent` (BOOLEAN, Default `FALSE`)

### `interview_stages`
Tracks specific rounds of interviews for an application.
- `id` (UUID, Primary Key, Default `gen_random_uuid()`)
- `application_id` (UUID, NOT NULL, References `applications(id)` ON DELETE CASCADE)
- `stage_name` (TEXT, NOT NULL)
- `stage_date` (TIMESTAMPTZ, nullable)
- `notes` (TEXT, nullable)
- **Note**: Read-only by the settings export; no writer found in app/ or lib/, row count UNVERIFIED.

### `resumes`
Stores references to physical PDF/DOCX resumes uploaded by the user.
- `id` (UUID, Primary Key, Default `gen_random_uuid()`)
- `user_id` (UUID, NOT NULL, References `auth.users(id)` ON DELETE CASCADE)
- `version_label` (TEXT, NOT NULL)
- `storage_path` (TEXT, NOT NULL)
- `extracted_text` (TEXT, nullable)
- `is_current` (BOOLEAN, Default `false`)
- `created_at` (TIMESTAMPTZ, Default `NOW()`)

### `ai_model_usage`
Internal tracking for Gemini API rate limits and fallbacks.
- `model_name` (TEXT, NOT NULL)
- `date` (DATE, NOT NULL)
- `request_count` (INT, NOT NULL, Default `0`)
- `blocked_until` (TIMESTAMPTZ, nullable)
- **Primary Key**: `(model_name, date)`

### `user_api_keys`
Stores encrypted API keys for users utilizing the BYOK (Bring Your Own Key) feature.
- `id` (UUID, Primary Key, Default `gen_random_uuid()`)
- `user_id` (UUID, NOT NULL, References `auth.users(id)` ON DELETE CASCADE)
- `provider` (TEXT, NOT NULL)
- `encrypted_key` (TEXT, NOT NULL)
- `iv` (TEXT, NOT NULL)
- `auth_tag` (TEXT, NOT NULL)
- `created_at` (TIMESTAMPTZ, NOT NULL, Default `NOW()`)
- **Constraints**: UNIQUE `(user_id, provider)`

### `system_events`
Stores ephemeral log records for system alerts. Features an automated 48-hour cleanup in the corresponding RPC.
- `id` (UUID, Primary Key, Default `gen_random_uuid()`)
- `event_type` (TEXT, NOT NULL)
- `created_at` (TIMESTAMPTZ, NOT NULL, Default `NOW()`)

### `system_alerts_state`
State tracker for atomic locking and deduplication suppression of operator alerts. 
- `alert_type` (TEXT, Primary Key)
- `last_alert_sent_at` (TIMESTAMPTZ, nullable)

### `action_tokens`
Tokens for re-engagement email actions (e.g., snooze, found_job).
- `token` (UUID, `PRIMARY KEY DEFAULT gen_random_uuid()`, verified via `20260920212200_reengagement_feature.sql:9`)
- `user_id` (UUID, `NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`, verified via `20260920212200_reengagement_feature.sql:10`)
- `action_type` (TEXT, `NOT NULL`, verified via `20260920212200_reengagement_feature.sql:11`)
- `expires_at` (TIMESTAMPTZ, `NOT NULL`, verified via `20260920212200_reengagement_feature.sql:12`)
- `consumed_at` (TIMESTAMPTZ, verified via `20260920212200_reengagement_feature.sql:13`)

### `v_reengagement_candidates` (View)
Identifies users eligible for a re-engagement email based on inactivity.
- Columns: `user_id`, `full_name`, `email`, `reminder_timezone`, `reengagement_last_sent_date`, `reengagement_status`, `reengagement_snoozed_until`, `last_application_at`.
- **Note**: This view joins `auth.users`. It does NOT use `security_invoker = true`.
- **Privileges (Live DB)**: `SELECT` revoked from `anon` and `authenticated`. Accessible only by `service_role` (and superusers).

---

## Enums
- **`application_status`**: `'draft', 'applied', 'screening', 'interview', 'offer', 'rejected', 'withdrawn', 'ghosted'`
- **`application_priority`**: `'low', 'medium', 'high'`

---

## Row Level Security (RLS) Policies

All application tables have RLS enabled to isolate tenant data.

- **`applications`**:
  - Full CRUD access ("Users can manage their own applications") where `user_id = auth.uid()`
- **`profiles`**:
  - SELECT: `id = auth.uid()`
  - INSERT/UPDATE: `id = auth.uid()`
- **`resumes`**:
  - Full CRUD access where `user_id = auth.uid()`
- **`user_api_keys`**:
  - Full CRUD access where `user_id = auth.uid()`
- **`storage.objects` (Bucket: 'resumes')**:
  - View/Upload/Update/Delete files where the first segment of the storage folder path exactly matches `auth.uid()`.
- **`ai_model_usage`**:
  - SELECT access granted to all authenticated users (so the frontend can render which models are available). Inserts/Updates are isolated server-side via Security Definer RPC functions.
- **`system_events` & `system_alerts_state` & `action_tokens`**:
  - Full Deny-All access; explicitly isolated to server-side/service-role access via RPCs.

---

## Postgres Functions & Triggers

- **`set_updated_at()` & `set_applications_updated_at` (Trigger)**
  Automatically sets `updated_at = NOW()` on the `applications` table before any `UPDATE` operation.
- **`increment_model_usage(p_model_name)` (RPC)**
  Runs with elevated privileges (SECURITY DEFINER) to upsert and increment the `request_count` for a specific AI model for the current date, avoiding race conditions.
  - **Privileges (Live DB)**: `EXECUTE` revoked from `PUBLIC`, `anon`, `authenticated`. Granted to `service_role`.
- **`block_model(p_model_name, p_blocked_until)` (RPC)**
  Runs with elevated privileges (SECURITY DEFINER) to upsert and update the `blocked_until` timestamp when a model hits a 429 Quota Exceeded error or is deprecated. Now returns a `boolean` indicating if the block was successfully/newly applied.
  - **Privileges (Live DB)**: `EXECUTE` revoked from `PUBLIC`, `anon`, `authenticated`. Granted to `service_role`.
- **`decrement_free_ai_uses(p_user_id)` (RPC)**
  Runs with elevated privileges (SECURITY DEFINER) to atomically decrement `free_ai_uses_remaining` in the `profiles` table. Raises a `FREE_LIMIT_EXHAUSTED` exception if the user has 0 uses remaining to prevent negative balance race conditions.
  - **Privileges (Live DB)**: `EXECUTE` revoked from `PUBLIC`, `anon`, `authenticated`. Granted to `service_role`.
- **`protect_free_ai_uses` (Trigger)**
  Reverts any updates to `free_ai_uses_remaining` on the `profiles` table unless performed by the `service_role`.
- **`record_exhaustion_event()` (RPC)**
  Runs with elevated privileges (SECURITY DEFINER) to record an exhaustion event, purge events older than 48 hours, and utilize a `FOR UPDATE` lock on `system_alerts_state` to prevent concurrent alerts. Returns a `boolean` if the alert should fire (>= 3 events in a 1-hour rolling window).
  - **Privileges (Live DB)**: `EXECUTE` revoked from `PUBLIC`, `anon`, `authenticated`. Granted to `service_role`.
- **`redeem_reengagement_token(p_token, p_action)` (RPC)**
  Runs with elevated privileges (SECURITY DEFINER) to consume a single-use action token and update the user's `reengagement_status`.
  - **Privileges (Live DB)**: `EXECUTE` is available to `anon` and `authenticated` (verified live) so the unauthenticated `/api/reengagement` route can call it.
- **`handle_new_user()` (Trigger)**
  *(Note: This function exists ONLY in the live database and is missing from `supabase/migrations/`. The trigger attaching it to `auth.users` is UNVERIFIED and not in migrations.)*
  `INSERT INTO public.users (id, email) VALUES (new.id, new.email); RETURN new;`
  - **Privileges (Live DB)**: `EXECUTE` available to `anon`, `authenticated`, `service_role` (live check 2026-10-09).
  - **Properties**: SECURITY DEFINER, LANGUAGE plpgsql, search_path unpinned.
