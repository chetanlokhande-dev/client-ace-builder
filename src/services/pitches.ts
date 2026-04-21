import { createRecord, deleteRecord, getAll, updateRecord } from "./db";
import type { PitchData } from "@/components/pitchforge/PitchPreview";
import type { Json } from "@/integrations/supabase/types";

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