
-- 1) Communities: restrict UPDATE to non-global rows in USING too
DROP POLICY IF EXISTS "Owner updates community" ON public.communities;
CREATE POLICY "Owner updates community" ON public.communities
  FOR UPDATE
  USING (auth.uid() = owner_id AND visibility <> 'global')
  WITH CHECK (auth.uid() = owner_id AND visibility <> 'global');

-- 2) community_pitches: only expose rows whose referenced pitch is public or owned by viewer
DROP POLICY IF EXISTS "View community pitches" ON public.community_pitches;
CREATE POLICY "View community pitches" ON public.community_pitches
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = community_pitches.community_id
        AND (c.visibility IN ('public','global') OR public.is_community_member(c.id, auth.uid()))
    )
    AND EXISTS (
      SELECT 1 FROM public.pitches p
      WHERE p.id = community_pitches.pitch_id
        AND (p.is_public = true OR p.user_id = auth.uid())
    )
  );

-- 3) pitches.share_token: rotate when a pitch transitions from public to private,
-- so any token observed while public cannot later access the (now private) pitch.
CREATE OR REPLACE FUNCTION public.rotate_share_token_on_unpublish()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND COALESCE(OLD.is_public, false) = true
     AND COALESCE(NEW.is_public, false) = false
     AND NEW.share_token = OLD.share_token THEN
    NEW.share_token := gen_random_uuid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rotate_share_token_on_unpublish ON public.pitches;
CREATE TRIGGER trg_rotate_share_token_on_unpublish
  BEFORE UPDATE OF is_public ON public.pitches
  FOR EACH ROW
  EXECUTE FUNCTION public.rotate_share_token_on_unpublish();

REVOKE EXECUTE ON FUNCTION public.rotate_share_token_on_unpublish() FROM PUBLIC, anon, authenticated;
