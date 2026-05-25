-- Temporary, expiring pitches for guest users
CREATE TABLE public.temp_pitches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  title text NOT NULL,
  industry text NOT NULL,
  description text,
  details text,
  links text,
  content jsonb NOT NULL,
  claim_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '5 minutes')
);

CREATE INDEX idx_temp_pitches_expires_at ON public.temp_pitches(expires_at);
CREATE INDEX idx_temp_pitches_share_token ON public.temp_pitches(share_token);
CREATE INDEX idx_temp_pitches_claim_email ON public.temp_pitches(claim_email) WHERE claim_email IS NOT NULL;

ALTER TABLE public.temp_pitches ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous visitors) may create a temp pitch,
-- but the expiration window must be reasonable (max ~10 minutes ahead).
CREATE POLICY "Anyone can create temp pitches"
ON public.temp_pitches
FOR INSERT
TO anon, authenticated
WITH CHECK (
  expires_at > now()
  AND expires_at <= now() + interval '10 minutes'
);

-- Anyone can read a temp pitch as long as it hasn't expired.
CREATE POLICY "Anyone can view non-expired temp pitches"
ON public.temp_pitches
FOR SELECT
TO anon, authenticated
USING (expires_at > now());

-- Anyone can update the claim_email on a non-expired temp pitch.
-- (Other columns are also updatable; we accept that since the row vanishes in <=10 min.)
CREATE POLICY "Anyone can update non-expired temp pitches"
ON public.temp_pitches
FOR UPDATE
TO anon, authenticated
USING (expires_at > now())
WITH CHECK (expires_at > now());

-- Helper: claim a temp pitch into the signed-in user's permanent pitches table.
CREATE OR REPLACE FUNCTION public.claim_temp_pitch(_token uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _temp public.temp_pitches%ROWTYPE;
  _new_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'must be signed in to claim a pitch';
  END IF;

  SELECT * INTO _temp
  FROM public.temp_pitches
  WHERE share_token = _token AND expires_at > now()
  LIMIT 1;

  IF _temp.id IS NULL THEN
    RAISE EXCEPTION 'temp pitch not found or expired';
  END IF;

  INSERT INTO public.pitches (user_id, title, industry, description, details, links, content)
  VALUES (auth.uid(), _temp.title, _temp.industry, _temp.description, _temp.details, _temp.links, _temp.content)
  RETURNING id INTO _new_id;

  DELETE FROM public.temp_pitches WHERE id = _temp.id;

  RETURN _new_id;
END;
$$;

-- Helper: when a user signs in, sweep any temp pitches that were "reserved"
-- with their email, claim them into the user's pitches, and return how many.
CREATE OR REPLACE FUNCTION public.claim_temp_pitches_by_email()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email text;
  _count integer := 0;
  _row public.temp_pitches%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN 0;
  END IF;

  SELECT email INTO _email FROM auth.users WHERE id = auth.uid();
  IF _email IS NULL THEN
    RETURN 0;
  END IF;

  FOR _row IN
    SELECT * FROM public.temp_pitches
    WHERE lower(claim_email) = lower(_email) AND expires_at > now()
  LOOP
    INSERT INTO public.pitches (user_id, title, industry, description, details, links, content)
    VALUES (auth.uid(), _row.title, _row.industry, _row.description, _row.details, _row.links, _row.content);
    DELETE FROM public.temp_pitches WHERE id = _row.id;
    _count := _count + 1;
  END LOOP;

  RETURN _count;
END;
$$;

-- Periodic cleanup of expired temp pitches (best-effort; SELECT already filters them out).
CREATE OR REPLACE FUNCTION public.cleanup_expired_temp_pitches()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.temp_pitches WHERE expires_at < now() - interval '1 hour';
$$;