
-- =========================================================
-- PITCH EXPIRY
-- =========================================================
ALTER TABLE public.pitches
  ADD COLUMN IF NOT EXISTS expires_at timestamptz DEFAULT (now() + interval '30 days');

CREATE INDEX IF NOT EXISTS idx_pitches_expires_at ON public.pitches(expires_at) WHERE expires_at IS NOT NULL;

CREATE OR REPLACE FUNCTION public.set_pitch_expiry(_pitch_id uuid, _expires_at timestamptz)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _never_count int;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'must be signed in';
  END IF;

  IF _expires_at IS NULL THEN
    SELECT count(*) INTO _never_count FROM public.pitches
      WHERE user_id = auth.uid() AND expires_at IS NULL AND id <> _pitch_id;
    IF _never_count >= 25 THEN
      RAISE EXCEPTION 'You have reached the limit of 25 pitches kept forever. Pick a timer for older pitches first.';
    END IF;
  ELSIF _expires_at <= now() THEN
    RAISE EXCEPTION 'expiry must be in the future';
  ELSIF _expires_at > now() + interval '5 years' THEN
    RAISE EXCEPTION 'expiry too far in the future';
  END IF;

  UPDATE public.pitches
    SET expires_at = _expires_at, updated_at = now()
    WHERE id = _pitch_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'pitch not found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.set_pitch_expiry(uuid, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_pitch_expiry(uuid, timestamptz) TO authenticated;

CREATE OR REPLACE FUNCTION public.cleanup_expired_pitches()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.pitches WHERE expires_at IS NOT NULL AND expires_at < now();
$$;
REVOKE ALL ON FUNCTION public.cleanup_expired_pitches() FROM PUBLIC, anon, authenticated;

-- Schedule daily cleanup (extensions assumed available)
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  PERFORM cron.unschedule('cleanup-expired-pitches');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'cleanup-expired-pitches',
  '0 3 * * *',
  $$ SELECT public.cleanup_expired_pitches(); SELECT public.cleanup_expired_temp_pitches(); $$
);

-- =========================================================
-- COMMUNITIES
-- =========================================================
DO $$ BEGIN
  CREATE TYPE public.community_visibility AS ENUM ('public','private','global');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.community_role AS ENUM ('owner','leader','member');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.community_member_status AS ENUM ('active','pending','banned');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  visibility public.community_visibility NOT NULL DEFAULT 'public',
  owner_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role public.community_role NOT NULL DEFAULT 'member',
  status public.community_member_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(community_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_cm_user ON public.community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_cm_community ON public.community_members(community_id);

CREATE TABLE IF NOT EXISTS public.community_pitches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  pitch_id uuid NOT NULL REFERENCES public.pitches(id) ON DELETE CASCADE,
  posted_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(community_id, pitch_id)
);
CREATE INDEX IF NOT EXISTS idx_cp_community ON public.community_pitches(community_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.communities TO authenticated;
GRANT ALL ON public.communities TO service_role;
GRANT SELECT ON public.communities TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_members TO authenticated;
GRANT ALL ON public.community_members TO service_role;

GRANT SELECT, INSERT, DELETE ON public.community_pitches TO authenticated;
GRANT ALL ON public.community_pitches TO service_role;

ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_pitches ENABLE ROW LEVEL SECURITY;

-- helper: is member (active)?
CREATE OR REPLACE FUNCTION public.is_community_member(_community uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_id = _community AND user_id = _user AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.community_role_of(_community uuid, _user uuid)
RETURNS public.community_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.community_members
  WHERE community_id = _community AND user_id = _user AND status = 'active' LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_community_staff(_community uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_id = _community AND user_id = _user
      AND status = 'active' AND role IN ('owner','leader')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_community_banned(_community uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_id = _community AND user_id = _user AND status = 'banned'
  );
$$;

-- POLICIES: communities
CREATE POLICY "View communities" ON public.communities FOR SELECT
USING (
  visibility IN ('public','global')
  OR (auth.uid() IS NOT NULL AND public.is_community_member(id, auth.uid()))
);

CREATE POLICY "Create community" ON public.communities FOR INSERT
WITH CHECK (auth.uid() = owner_id AND visibility <> 'global');

CREATE POLICY "Owner updates community" ON public.communities FOR UPDATE
USING (auth.uid() = owner_id);

CREATE POLICY "Owner deletes community" ON public.communities FOR DELETE
USING (auth.uid() = owner_id AND visibility <> 'global');

-- POLICIES: community_members
CREATE POLICY "View members of accessible communities" ON public.community_members FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.communities c WHERE c.id = community_id
    AND (c.visibility IN ('public','global') OR public.is_community_member(c.id, auth.uid()))
  )
);

-- Self-join (public/global only & not banned). Private joins also use this to create pending row.
CREATE POLICY "Self join" ON public.community_members FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND NOT public.is_community_banned(community_id, auth.uid())
  AND EXISTS (SELECT 1 FROM public.communities c WHERE c.id = community_id)
);

-- Staff manages members; user can update own row to leave (no role change)
CREATE POLICY "Staff update members" ON public.community_members FOR UPDATE
USING (public.is_community_staff(community_id, auth.uid()));

CREATE POLICY "Self or staff delete member" ON public.community_members FOR DELETE
USING (user_id = auth.uid() OR public.is_community_staff(community_id, auth.uid()));

-- POLICIES: community_pitches
CREATE POLICY "View community pitches" ON public.community_pitches FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.communities c WHERE c.id = community_id
    AND (c.visibility IN ('public','global') OR public.is_community_member(c.id, auth.uid()))
  )
);

CREATE POLICY "Member posts own pitch" ON public.community_pitches FOR INSERT
WITH CHECK (
  posted_by = auth.uid()
  AND public.is_community_member(community_id, auth.uid())
  AND EXISTS (SELECT 1 FROM public.pitches p WHERE p.id = pitch_id AND p.user_id = auth.uid())
);

CREATE POLICY "Poster or staff deletes post" ON public.community_pitches FOR DELETE
USING (posted_by = auth.uid() OR public.is_community_staff(community_id, auth.uid()));

-- Auto-add owner as member on community create
CREATE OR REPLACE FUNCTION public.add_owner_as_member()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.community_members(community_id, user_id, role, status)
  VALUES (NEW.id, NEW.owner_id, 'owner', 'active')
  ON CONFLICT (community_id, user_id) DO UPDATE SET role='owner', status='active';
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_add_owner_as_member ON public.communities;
CREATE TRIGGER trg_add_owner_as_member
AFTER INSERT ON public.communities
FOR EACH ROW EXECUTE FUNCTION public.add_owner_as_member();

-- Updated_at trigger
DROP TRIGGER IF EXISTS trg_communities_updated_at ON public.communities;
CREATE TRIGGER trg_communities_updated_at
BEFORE UPDATE ON public.communities
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Membership management RPCs (extra validation)
CREATE OR REPLACE FUNCTION public.join_community(_community uuid)
RETURNS public.community_member_status
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _vis public.community_visibility; _status public.community_member_status;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in required'; END IF;
  IF public.is_community_banned(_community, auth.uid()) THEN RAISE EXCEPTION 'banned'; END IF;
  SELECT visibility INTO _vis FROM public.communities WHERE id = _community;
  IF _vis IS NULL THEN RAISE EXCEPTION 'community not found'; END IF;
  _status := CASE WHEN _vis = 'private' THEN 'pending'::public.community_member_status ELSE 'active'::public.community_member_status END;
  INSERT INTO public.community_members(community_id, user_id, role, status)
  VALUES (_community, auth.uid(), 'member', _status)
  ON CONFLICT (community_id, user_id) DO UPDATE
    SET status = EXCLUDED.status WHERE public.community_members.status <> 'banned';
  RETURN _status;
END $$;
GRANT EXECUTE ON FUNCTION public.join_community(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_member_role(_community uuid, _user uuid, _role public.community_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _caller_role public.community_role;
BEGIN
  _caller_role := public.community_role_of(_community, auth.uid());
  IF _caller_role <> 'owner' THEN RAISE EXCEPTION 'only owner can change roles'; END IF;
  IF _role = 'owner' THEN
    -- transfer ownership
    UPDATE public.communities SET owner_id = _user WHERE id = _community AND owner_id = auth.uid();
    UPDATE public.community_members SET role = 'leader' WHERE community_id = _community AND user_id = auth.uid();
    UPDATE public.community_members SET role = 'owner', status='active' WHERE community_id = _community AND user_id = _user;
  ELSE
    UPDATE public.community_members SET role = _role WHERE community_id = _community AND user_id = _user AND role <> 'owner';
  END IF;
END $$;
GRANT EXECUTE ON FUNCTION public.set_member_role(uuid, uuid, public.community_role) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_member_status(_community uuid, _user uuid, _status public.community_member_status)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_community_staff(_community, auth.uid()) THEN RAISE EXCEPTION 'forbidden'; END IF;
  -- cannot affect owner
  IF EXISTS (SELECT 1 FROM public.community_members WHERE community_id=_community AND user_id=_user AND role='owner') THEN
    RAISE EXCEPTION 'cannot modify owner';
  END IF;
  UPDATE public.community_members SET status = _status WHERE community_id=_community AND user_id=_user;
END $$;
GRANT EXECUTE ON FUNCTION public.set_member_status(uuid, uuid, public.community_member_status) TO authenticated;

CREATE OR REPLACE FUNCTION public.remove_member(_community uuid, _user uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_community_staff(_community, auth.uid()) AND auth.uid() <> _user THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF EXISTS (SELECT 1 FROM public.community_members WHERE community_id=_community AND user_id=_user AND role='owner') THEN
    RAISE EXCEPTION 'owner cannot leave; transfer ownership first';
  END IF;
  DELETE FROM public.community_members WHERE community_id=_community AND user_id=_user;
END $$;
GRANT EXECUTE ON FUNCTION public.remove_member(uuid, uuid) TO authenticated;

-- Seed a default global community
INSERT INTO public.communities (name, slug, description, visibility, owner_id)
SELECT 'Global Lounge', 'global-lounge', 'Public, read-only space where every member of the platform can drop in.', 'global', (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.communities WHERE visibility='global')
  AND EXISTS (SELECT 1 FROM auth.users);
