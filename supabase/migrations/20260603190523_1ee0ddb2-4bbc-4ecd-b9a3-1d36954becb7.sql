
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS show_author_default boolean NOT NULL DEFAULT false;

ALTER TABLE public.pitches
  ADD COLUMN IF NOT EXISTS show_author boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.get_public_profile(_user_id uuid)
RETURNS TABLE(id uuid, full_name text, bio text, avatar_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.bio, p.avatar_url
  FROM public.profiles p
  WHERE p.id = _user_id
    AND (
      p.show_author_default = true
      OR EXISTS (
        SELECT 1 FROM public.pitches pi
        WHERE pi.user_id = _user_id
          AND pi.is_public = true
          AND pi.show_author = true
          AND (pi.expires_at IS NULL OR pi.expires_at > now())
      )
    );
$$;

CREATE OR REPLACE FUNCTION public.list_public_pitches_by_user(_user_id uuid)
RETURNS SETOF public.pitches
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT * FROM public.pitches
  WHERE user_id = _user_id
    AND is_public = true
    AND show_author = true
    AND (expires_at IS NULL OR expires_at > now())
  ORDER BY created_at DESC
  LIMIT 60;
$$;

REVOKE ALL ON FUNCTION public.get_public_profile(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_public_pitches_by_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_public_pitches_by_user(uuid) TO anon, authenticated;
