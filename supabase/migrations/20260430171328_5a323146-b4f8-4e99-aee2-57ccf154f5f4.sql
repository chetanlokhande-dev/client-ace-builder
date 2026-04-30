-- Add public flag and share token to pitches
ALTER TABLE public.pitches
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS share_token uuid NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS pitches_share_token_idx ON public.pitches(share_token);
CREATE INDEX IF NOT EXISTS pitches_is_public_idx ON public.pitches(is_public) WHERE is_public = true;

-- Allow anyone to view public pitches
DROP POLICY IF EXISTS "Public pitches are viewable by anyone" ON public.pitches;
CREATE POLICY "Public pitches are viewable by anyone"
  ON public.pitches FOR SELECT
  USING (is_public = true);

-- Allow viewing a pitch by share_token (anyone with link)
DROP POLICY IF EXISTS "Pitches viewable by share token" ON public.pitches;
-- (RLS can't gate by query param; we expose via is_public OR direct fetch by token using anon role.
--  We'll handle share-link views by making any pitch fetched by share_token returnable: requires is_public.
--  Simpler approach: when user clicks "Share link", we set is_public=true automatically.)

-- Bookmarks table
CREATE TABLE IF NOT EXISTS public.pitch_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pitch_id uuid NOT NULL REFERENCES public.pitches(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, pitch_id)
);
ALTER TABLE public.pitch_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own bookmarks" ON public.pitch_bookmarks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own bookmarks" ON public.pitch_bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own bookmarks" ON public.pitch_bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- Ratings table (1-5 stars per user per pitch)
CREATE TABLE IF NOT EXISTS public.pitch_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pitch_id uuid NOT NULL REFERENCES public.pitches(id) ON DELETE CASCADE,
  rating smallint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, pitch_id)
);

-- Validate rating range via trigger (avoids CHECK immutability concerns is fine here, but use trigger for consistency)
CREATE OR REPLACE FUNCTION public.validate_rating()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.validate_rating() FROM anon, authenticated, public;

DROP TRIGGER IF EXISTS pitch_ratings_validate ON public.pitch_ratings;
CREATE TRIGGER pitch_ratings_validate BEFORE INSERT OR UPDATE ON public.pitch_ratings
  FOR EACH ROW EXECUTE FUNCTION public.validate_rating();

ALTER TABLE public.pitch_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ratings on public pitches" ON public.pitch_ratings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.pitches p WHERE p.id = pitch_id AND (p.is_public = true OR p.user_id = auth.uid()))
  );
CREATE POLICY "Authenticated users rate public pitches" ON public.pitch_ratings
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.pitches p WHERE p.id = pitch_id AND p.is_public = true AND p.user_id <> auth.uid())
  );
CREATE POLICY "Users update own ratings" ON public.pitch_ratings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own ratings" ON public.pitch_ratings
  FOR DELETE USING (auth.uid() = user_id);
