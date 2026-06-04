
-- 1. Tighten community UPDATE policy to forbid escalating to 'global'
DROP POLICY IF EXISTS "Owner updates community" ON public.communities;
CREATE POLICY "Owner updates community" ON public.communities
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id AND visibility <> 'global'::public.community_visibility);

-- 2. Restrict self-join inserts to role='member'
DROP POLICY IF EXISTS "Self join" ON public.community_members;
CREATE POLICY "Self join" ON public.community_members
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND role = 'member'::public.community_role
    AND status IN ('pending'::public.community_member_status, 'active'::public.community_member_status)
    AND NOT public.is_community_banned(community_id, auth.uid())
    AND EXISTS (SELECT 1 FROM public.communities c WHERE c.id = community_id)
  );

-- 3. Re-lock internal SECURITY DEFINER helpers (not meant to be called directly from the client)
REVOKE EXECUTE ON FUNCTION public.is_community_member(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.community_role_of(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_community_staff(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_community_banned(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.add_owner_as_member() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_rating() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_pitches() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_temp_pitches() FROM PUBLIC, anon, authenticated;
