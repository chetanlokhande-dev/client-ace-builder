import { createRecord, deleteRecord, getAll, updateRecord } from "./db";
import type { PitchData } from "@/components/pitchforge/PitchPreview";
import type { Json } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

export interface PitchFormInput {
  title: string;
  description: string;
  details: string;
  links: string;
  industry: string;
}

export const savePitch = (userId: string, form: PitchFormInput, content: PitchData) =>
  createRecord("pitches", {
    user_id: userId,
    title: form.title || "Untitled pitch",
    industry: form.industry,
    description: form.description,
    details: form.details,
    links: form.links,
    content: content as unknown as Json,
  });

export const listPitches = (userId: string) =>
  getAll("pitches", {
    filters: { user_id: userId },
    orderBy: { column: "created_at", ascending: false },
  });

export const renamePitch = (id: string, title: string) => updateRecord("pitches", id, { title });

export const removePitch = (id: string) => deleteRecord("pitches", id);

export type ExpiryPreset = "never" | "5d" | "15d" | "30d" | "90d";

export const presetToDate = (preset: ExpiryPreset): Date | null => {
  if (preset === "never") return null;
  const days = { "5d": 5, "15d": 15, "30d": 30, "90d": 90 }[preset];
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

export const setPitchExpiry = async (pitchId: string, expiresAt: Date | null) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).rpc("set_pitch_expiry", {
    _pitch_id: pitchId,
    _expires_at: expiresAt ? expiresAt.toISOString() : null,
  });
  if (error) throw error;
};

export const extendPitch30Days = (pitchId: string) =>
  setPitchExpiry(pitchId, presetToDate("30d")!);

export const formatExpiry = (iso: string | null | undefined): string => {
  if (!iso) return "Never expires";
  const target = new Date(iso).getTime();
  const diff = target - Date.now();
  if (diff <= 0) return "Expired";
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days <= 1) return "Expires in <1 day";
  return `Expires in ${days} days`;
};