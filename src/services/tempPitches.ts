import { supabase } from "@/integrations/supabase/client";
import type { PitchData } from "@/components/pitchforge/PitchPreview";
import type { Json } from "@/integrations/supabase/types";

export interface TempPitchInput {
  title: string;
  description: string;
  details: string;
  links: string;
  industry: string;
  content: PitchData;
}

export interface TempPitchRow {
  id: string;
  share_token: string;
  title: string;
  industry: string;
  description: string | null;
  details: string | null;
  links: string | null;
  content: PitchData;
  claim_email: string | null;
  created_at: string;
  expires_at: string;
}

export async function createTempPitch(input: TempPitchInput): Promise<TempPitchRow> {
  const { data, error } = await supabase
    .from("temp_pitches")
    .insert({
      title: input.title || "Untitled pitch",
      industry: input.industry,
      description: input.description,
      details: input.details,
      links: input.links,
      content: input.content as unknown as Json,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as TempPitchRow;
}

export async function getTempPitch(token: string): Promise<TempPitchRow | null> {
  const { data, error } = await supabase.rpc(
    "get_temp_pitch" as never,
    { _token: token } as never,
  );
  if (error) throw error;
  const rows = (data as unknown as TempPitchRow[]) ?? [];
  return rows[0] ?? null;
}

export async function setClaimEmail(token: string, email: string) {
  const { error } = await supabase.rpc(
    "set_temp_pitch_email" as never,
    { _token: token, _email: email } as never,
  );
  if (error) throw error;
}

export async function claimTempPitch(token: string): Promise<string> {
  const { data, error } = await supabase.rpc("claim_temp_pitch", { _token: token });
  if (error) throw error;
  return data as unknown as string;
}

export async function claimTempPitchesByEmail(): Promise<number> {
  const { data, error } = await supabase.rpc("claim_temp_pitches_by_email");
  if (error) throw error;
  return (data as unknown as number) ?? 0;
}

export const buildTempUrl = (token: string) =>
  `${window.location.origin}/t/${token}`;