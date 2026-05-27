
-- 1. Drop overly broad policies on temp_pitches
DROP POLICY IF EXISTS "Anyone can view non-expired temp pitches" ON public.temp_pitches;
DROP POLICY IF EXISTS "Anyone can update non-expired temp pitches" ON public.temp_pitches;

-- 2. Revoke direct table SELECT/UPDATE from public roles (INSERT still allowed for guest create)
REVOKE SELECT, UPDATE ON public.temp_pitches FROM anon, authenticated;

-- 3. Safe read RPC: returns row without claim_email
CREATE OR REPLACE FUNCTION public.get_temp_pitch(_token uuid)
RETURNS TABLE (
  id uuid,
  share_token uuid,
  title text,
  industry text,
  description text,
  details text,
  links text,
  content jsonb,
  created_at timestamptz,
  expires_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, share_token, title, industry, description, details, links, content, created_at, expires_at
  FROM public.temp_pitches
  WHERE share_token = _token AND expires_at > now()
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.get_temp_pitch(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_temp_pitch(uuid) TO anon, authenticated;

-- 4. Safe email-reservation RPC
CREATE OR REPLACE FUNCTION public.set_temp_pitch_email(_token uuid, _email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _email IS NULL OR position('@' in _email) = 0 OR length(_email) > 254 THEN
    RAISE EXCEPTION 'invalid email';
  END IF;

  UPDATE public.temp_pitches
  SET claim_email = lower(trim(_email))
  WHERE share_token = _token AND expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'temp pitch not found or expired';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_temp_pitch_email(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.set_temp_pitch_email(uuid, text) TO anon, authenticated;

-- 5. Restrict claim functions to signed-in users only
REVOKE EXECUTE ON FUNCTION public.claim_temp_pitch(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_temp_pitch(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.claim_temp_pitches_by_email() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_temp_pitches_by_email() TO authenticated;

-- 6. Cleanup helper should not be public-callable
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_temp_pitches() FROM public, anon, authenticated;
