CREATE TYPE reengagement_status AS ENUM ('active', 'paused_found_job', 'snoozed');

ALTER TABLE profiles
ADD COLUMN reengagement_status reengagement_status NOT NULL DEFAULT 'active',
ADD COLUMN reengagement_snoozed_until TIMESTAMPTZ,
ADD COLUMN reengagement_last_sent_date DATE;

CREATE TABLE action_tokens (
    token UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ
);

-- Enable RLS but create no policies, establishing a Deny-All posture
ALTER TABLE action_tokens ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE VIEW v_reengagement_candidates AS
SELECT
    p.id AS user_id,
    p.full_name,
    u.email,
    p.reminder_timezone,
    p.reengagement_last_sent_date,
    p.reengagement_status,
    p.reengagement_snoozed_until,
    MAX(a.created_at) AS last_application_at
FROM profiles p
JOIN auth.users u ON u.id = p.id
JOIN applications a ON a.user_id = p.id
WHERE (p.reengagement_status = 'active') 
   OR (p.reengagement_status = 'snoozed' AND p.reengagement_snoozed_until < NOW())
GROUP BY p.id, p.full_name, u.email, p.reminder_timezone, p.reengagement_last_sent_date, p.reengagement_status, p.reengagement_snoozed_until
HAVING MAX(a.created_at) < NOW() - INTERVAL '14 days'
   AND (
       p.reengagement_status = 'snoozed' OR
       p.reengagement_last_sent_date IS NULL OR
       MAX(a.created_at)::date > p.reengagement_last_sent_date
   );

CREATE OR REPLACE FUNCTION redeem_reengagement_token(p_token UUID, p_action TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_action_type TEXT;
    v_expires_at TIMESTAMPTZ;
    v_consumed_at TIMESTAMPTZ;
BEGIN
    -- Look up the token
    SELECT user_id, action_type, expires_at, consumed_at 
    INTO v_user_id, v_action_type, v_expires_at, v_consumed_at
    FROM action_tokens
    WHERE token = p_token
    FOR UPDATE; -- Lock the row to prevent race conditions on redemption

    IF NOT FOUND THEN
        RETURN 'expired'; -- Or invalid, but we treat it simply as expired/invalid in the UI
    END IF;

    IF v_consumed_at IS NOT NULL THEN
        RETURN 'already_used';
    END IF;

    IF v_expires_at < NOW() THEN
        RETURN 'expired';
    END IF;

    -- Token matches the expected action string? 
    -- (Safety check: p_action must match the token's original action_type)
    IF p_action != v_action_type THEN
        RETURN 'expired'; -- Treat tampering as invalid
    END IF;

    -- Mark consumed
    UPDATE action_tokens
    SET consumed_at = NOW()
    WHERE token = p_token;

    -- Apply the appropriate profile update
    IF p_action = 'found_job' THEN
        UPDATE profiles
        SET reengagement_status = 'paused_found_job'
        WHERE id = v_user_id;
    ELSIF p_action = 'snooze' THEN
        UPDATE profiles
        SET reengagement_status = 'snoozed',
            reengagement_snoozed_until = NOW() + INTERVAL '30 days'
        WHERE id = v_user_id;
    ELSIF p_action = 'still_looking' THEN
        -- No state change to profiles, just mark token consumed
        NULL;
    ELSE
        -- Unknown action type in the token, should not happen, but return expired to fail safe
        RETURN 'expired';
    END IF;

    RETURN 'success';
END;
$$;
