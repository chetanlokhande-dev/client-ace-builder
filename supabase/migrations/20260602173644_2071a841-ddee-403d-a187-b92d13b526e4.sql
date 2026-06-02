
-- 1. Install missing trigger so owners are auto-added as members of their new community
DROP TRIGGER IF EXISTS communities_add_owner_member ON public.communities;
CREATE TRIGGER communities_add_owner_member
AFTER INSERT ON public.communities
FOR EACH ROW EXECUTE FUNCTION public.add_owner_as_member();

-- 2. Make sure the owner can always see their community even before the membership row is visible
DROP POLICY IF EXISTS "View communities" ON public.communities;
CREATE POLICY "View communities" ON public.communities
FOR SELECT
USING (
  visibility = ANY (ARRAY['public'::community_visibility, 'global'::community_visibility])
  OR auth.uid() = owner_id
  OR (auth.uid() IS NOT NULL AND public.is_community_member(id, auth.uid()))
);

-- 3. Install timestamp + new-user triggers if missing (these functions exist but have no triggers)
DROP TRIGGER IF EXISTS communities_set_updated_at ON public.communities;
CREATE TRIGGER communities_set_updated_at BEFORE UPDATE ON public.communities
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS pitches_set_updated_at ON public.pitches;
CREATE TRIGGER pitches_set_updated_at BEFORE UPDATE ON public.pitches
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS pitch_ratings_validate ON public.pitch_ratings;
CREATE TRIGGER pitch_ratings_validate BEFORE INSERT OR UPDATE ON public.pitch_ratings
FOR EACH ROW EXECUTE FUNCTION public.validate_rating();

-- 4. Lock down SECURITY DEFINER functions that should NOT be callable from the Data API.
-- These are trigger/cron-only helpers — clients have no reason to invoke them directly.
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_pitches() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_temp_pitches() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.add_owner_as_member() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_rating() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
