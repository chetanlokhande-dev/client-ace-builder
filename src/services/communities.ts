import { supabase } from "@/integrations/supabase/client";

export type CommunityVisibility = "public" | "private" | "global";
export type CommunityRole = "owner" | "leader" | "member";
export type CommunityMemberStatus = "active" | "pending" | "banned";

export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  visibility: CommunityVisibility;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface CommunityMember {
  id: string;
  community_id: string;
  user_id: string;
  role: CommunityRole;
  status: CommunityMemberStatus;
  created_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || `c-${Date.now()}`;

export const listCommunities = async (): Promise<Community[]> => {
  const { data, error } = await sb.from("communities").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
};

export const getCommunity = async (id: string): Promise<Community | null> => {
  const { data, error } = await sb.from("communities").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
};

export const createCommunity = async (input: {
  name: string;
  description: string;
  visibility: Exclude<CommunityVisibility, "global">;
}) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in required");
  const payload = {
    name: input.name.trim(),
    description: input.description.trim() || null,
    visibility: input.visibility,
    slug: `${slugify(input.name)}-${Math.random().toString(36).slice(2, 6)}`,
    owner_id: user.id,
  };
  const { data, error } = await sb.from("communities").insert(payload).select().single();
  if (error) throw error;
  return data as Community;
};

export const updateCommunity = async (id: string, patch: Partial<Pick<Community, "name" | "description" | "visibility">>) => {
  const { error } = await sb.from("communities").update(patch).eq("id", id);
  if (error) throw error;
};

export const deleteCommunity = async (id: string) => {
  const { error } = await sb.from("communities").delete().eq("id", id);
  if (error) throw error;
};

export const listMembers = async (communityId: string): Promise<CommunityMember[]> => {
  const { data, error } = await sb.from("community_members").select("*").eq("community_id", communityId).order("created_at");
  if (error) throw error;
  return data ?? [];
};

export const myMembership = async (communityId: string): Promise<CommunityMember | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await sb.from("community_members").select("*").eq("community_id", communityId).eq("user_id", user.id).maybeSingle();
  return data ?? null;
};

export const joinCommunity = async (communityId: string) => {
  const { data, error } = await sb.rpc("join_community", { _community: communityId });
  if (error) throw error;
  return data as CommunityMemberStatus;
};

export const leaveCommunity = async (communityId: string, userId: string) => {
  const { error } = await sb.rpc("remove_member", { _community: communityId, _user: userId });
  if (error) throw error;
};

export const setMemberRole = async (communityId: string, userId: string, role: CommunityRole) => {
  const { error } = await sb.rpc("set_member_role", { _community: communityId, _user: userId, _role: role });
  if (error) throw error;
};

export const setMemberStatus = async (communityId: string, userId: string, status: CommunityMemberStatus) => {
  const { error } = await sb.rpc("set_member_status", { _community: communityId, _user: userId, _status: status });
  if (error) throw error;
};

export const removeMember = async (communityId: string, userId: string) => {
  const { error } = await sb.rpc("remove_member", { _community: communityId, _user: userId });
  if (error) throw error;
};

export interface CommunityPitchRow {
  id: string;
  community_id: string;
  pitch_id: string;
  posted_by: string;
  created_at: string;
  pitches: {
    id: string;
    title: string;
    industry: string;
    content: unknown;
    share_token: string;
    user_id: string;
  } | null;
}

export const listCommunityPitches = async (communityId: string): Promise<CommunityPitchRow[]> => {
  const { data, error } = await sb
    .from("community_pitches")
    .select("*, pitches:pitch_id(id,title,industry,content,share_token,user_id)")
    .eq("community_id", communityId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
};

export const postPitchToCommunity = async (communityId: string, pitchId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in required");
  const { error } = await sb.from("community_pitches").insert({
    community_id: communityId, pitch_id: pitchId, posted_by: user.id,
  });
  if (error) throw error;
};

export const removeCommunityPitch = async (id: string) => {
  const { error } = await sb.from("community_pitches").delete().eq("id", id);
  if (error) throw error;
};