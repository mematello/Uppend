-- Fixes applied manually on 2026-10-09 to secure v_reengagement_candidates and 4 SECURITY DEFINER functions.

-- (a) Revoke access to view from anon and authenticated
REVOKE ALL ON public.v_reengagement_candidates FROM anon, authenticated;

-- (b) Revoke EXECUTE on functions from public, anon, and authenticated and explicitly grant to service_role
REVOKE EXECUTE ON FUNCTION public.decrement_free_ai_uses(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_free_ai_uses(uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.increment_model_usage(text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_model_usage(text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.block_model(text, timestamptz) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.block_model(text, timestamptz) TO service_role;

REVOKE EXECUTE ON FUNCTION public.record_exhaustion_event() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_exhaustion_event() TO service_role;
