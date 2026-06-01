import { supabase } from "@/integrations/supabase/client";
import type { PitchData } from "@/components/pitchforge/PitchPreview";

export interface PitchRow {
  id: string;
  user_id: string;
  title: string;
  industry: string;
  description: string | null;
  details: string | null;
  links: string | null;
  content: PitchData;
  is_public: boolean;
  share_token: string;
  created_at: string;
  updated_at: string;
  expires_at?: string | null;
}

export const setPitchPublic = async (id: string, isPublic: boolean) => {
  const { data, error } = await supabase
    .from("pitches")
    .update({ is_public: isPublic })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const listMyPitches = async (userId: string) => {
  const { data, error } = await supabase
    .from("pitches")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as PitchRow[];
};

export const listCommunityPitches = async () => {
  const { data, error } = await supabase
    .from("pitches")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw error;
  return (data ?? []) as unknown as PitchRow[];
};

export const getPitchByShareToken = async (token: string) => {
  const { data, error } = await supabase
    .from("pitches")
    .select("*")
    .eq("share_token", token)
    .eq("is_public", true)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as PitchRow | null;
};

export const ratePitch = async (pitchId: string, userId: string, rating: number) => {
  const { error } = await supabase
    .from("pitch_ratings")
    .upsert({ pitch_id: pitchId, user_id: userId, rating }, { onConflict: "user_id,pitch_id" });
  if (error) throw error;
};

export const getRatingsFor = async (pitchIds: string[]) => {
  if (!pitchIds.length) return {} as Record<string, { avg: number; count: number; mine?: number }>;
  const { data, error } = await supabase
    .from("pitch_ratings")
    .select("pitch_id, rating, user_id")
    .in("pitch_id", pitchIds);
  if (error) throw error;
  const { data: { user } } = await supabase.auth.getUser();
  const me = user?.id;
  const map: Record<string, { sum: number; count: number; mine?: number }> = {};
  (data ?? []).forEach((r) => {
    const m = (map[r.pitch_id] ||= { sum: 0, count: 0 });
    m.sum += r.rating;
    m.count += 1;
    if (me && r.user_id === me) m.mine = r.rating;
  });
  const out: Record<string, { avg: number; count: number; mine?: number }> = {};
  Object.entries(map).forEach(([k, v]) => {
    out[k] = { avg: v.count ? v.sum / v.count : 0, count: v.count, mine: v.mine };
  });
  return out;
};

export const toggleBookmark = async (pitchId: string, userId: string, on: boolean) => {
  if (on) {
    const { error } = await supabase
      .from("pitch_bookmarks")
      .insert({ pitch_id: pitchId, user_id: userId });
    if (error && !String(error.message).includes("duplicate")) throw error;
  } else {
    const { error } = await supabase
      .from("pitch_bookmarks")
      .delete()
      .eq("pitch_id", pitchId)
      .eq("user_id", userId);
    if (error) throw error;
  }
};

export const listMyBookmarks = async (userId: string) => {
  const { data, error } = await supabase
    .from("pitch_bookmarks")
    .select("pitch_id, pitches:pitch_id(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as Array<{ pitches: unknown }>)
    .map((b) => b.pitches as PitchRow | null)
    .filter((p): p is PitchRow => Boolean(p));
};

export const getMyBookmarkIds = async (userId: string) => {
  const { data, error } = await supabase
    .from("pitch_bookmarks")
    .select("pitch_id")
    .eq("user_id", userId);
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.pitch_id));
};

export const buildShareUrl = (token: string) =>
  `${window.location.origin}/p/${token}`;
