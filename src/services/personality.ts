import { supabase } from "@/integrations/supabase/client";

export type Personality = {
  tone?: string;            // e.g. "warm", "direct", "playful"
  voice?: string;           // e.g. "confident expert", "friendly partner"
  strengths?: string;       // freeform list
  values?: string;          // what you care about
  workingStyle?: string;    // async, collaborative, fast-shipping
  communication?: string;   // how you communicate w/ clients
  signaturePhrases?: string;// phrases you like to use
  avoid?: string;           // things never to say / clichés to skip
};

const KEY = "pitchforge:personality-cache";

export const EMPTY_PERSONALITY: Personality = {};

export const hasPersonality = (p?: Personality | null) =>
  !!p && Object.values(p).some((v) => typeof v === "string" && v.trim().length > 0);

export const cachePersonality = (p: Personality | null) => {
  try {
    if (p) localStorage.setItem(KEY, JSON.stringify(p));
    else localStorage.removeItem(KEY);
  } catch { /* ignore */ }
};

export const readCachedPersonality = (): Personality | null => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Personality) : null;
  } catch {
    return null;
  }
};

export const loadPersonality = async (userId: string): Promise<Personality> => {
  const { data } = await supabase
    .from("profiles")
    .select("personality")
    .eq("id", userId)
    .maybeSingle();
  const p = ((data as { personality?: Personality } | null)?.personality ?? {}) as Personality;
  cachePersonality(p);
  return p;
};

export const savePersonality = async (userId: string, p: Personality) => {
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: userId, personality: p as unknown as never });
  if (error) throw error;
  cachePersonality(p);
};