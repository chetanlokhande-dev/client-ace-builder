
# Communities + Pitch Expiry

Two large features. I'll outline scope, schema, and UI before building.

## 1. Communities

A new `/communities` section where users create/join groups to share pitches.

**Features**
- Create community: name, description, visibility (`public`, `private`, `global`)
  - `global` = everyone auto-member, read-only feed (only one, seeded)
  - `public` = discoverable, direct join
  - `private` = discoverable, request-to-join (approval required)
- Membership roles: `owner`, `leader` (elder/acting), `member`, `banned`
- Role actions (permission-gated):
  - Owner: transfer ownership, promote leaders, demote, remove, ban, delete community
  - Leader: approve join requests, promote member→leader (if owner allows), remove, ban members
  - Member: leave, post pitches to community
- Join flow: public = instant; private = request → pending → approved/rejected
- Block/ban: banned users can't rejoin or view private communities
- Pitch sharing: members can attach an owned pitch to a community feed

**Pages**
- `/communities` — browse, search, create
- `/communities/:id` — feed, members tab, settings tab (role-gated)

## 2. Pitch Expiry / Decay

Every saved pitch now has an `expires_at` (default = `created_at + 30 days`).

**Behavior**
- On save: toast "Pitch saved — expires in 30 days. Change anytime."
- Per-pitch dropdown on History/Saved card: `Never`, `5 days`, `15 days`, `30 days`, `90 days`, `Custom date`
- Daily-ish cleanup via `pg_cron` removes expired pitches (skip `expires_at IS NULL` = never)
- Throttle: cap "Never" pitches per user to a soft limit (free tier 25) to manage traffic; over limit → forced to pick a timer
- Banner on expiring-soon pitches (<3 days) with one-click "Extend 30d"

## Technical

### New tables
```
communities(id, name, slug, description, visibility, owner_id, created_at)
community_members(community_id, user_id, role, status, created_at)  -- status: active|pending|banned
community_pitches(community_id, pitch_id, posted_by, created_at)
```
+ `app_role` enum extension or per-community role column.
+ `has_community_role(uid, community_id, role)` SECURITY DEFINER.
+ RLS: visibility/role-gated.

### Pitches table
- Add `expires_at timestamptz NULL` (NULL = never)
- Add `never_expires_count` check via trigger for soft cap
- `cleanup_expired_pitches()` SECURITY DEFINER + pg_cron daily job

### Client
- `src/services/communities.ts` — CRUD + membership ops
- `src/pages/Communities.tsx`, `src/pages/CommunityDetail.tsx`
- `src/services/pitches.ts` — add `setPitchExpiry`, `extendPitch`
- `src/components/pitchforge/ExpiryControl.tsx` — dropdown
- Update `PitchCard` to show expiry + control
- Update Dashboard save toast

## Build order
1. Migration: pitches.expires_at + cleanup cron + communities schema + RLS
2. Services + types
3. Expiry UI on cards + save toast
4. Communities pages + routing + navbar link

Ship it?
