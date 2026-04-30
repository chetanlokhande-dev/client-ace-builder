import { useState } from "react";
import { Sparkles, Wand2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { PitchData } from "./PitchPreview";
import { getPitchByShareToken } from "@/services/community";

type Mode = "improvise" | "simplify" | "from-link" | "from-skills";

interface Props {
  currentPitch: PitchData | null;
  industry?: string;
  onPitch: (p: PitchData) => void;
}

const PitchAssistant = ({ currentPitch, industry, onPitch }: Props) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("improvise");
  const [link, setLink] = useState("");
  const [skills, setSkills] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async (selectedMode: Mode) => {
    setMode(selectedMode);
    setLoading(true);
    try {
      let sourcePitch: PitchData | null = null;
      if (selectedMode === "from-link" && link.trim()) {
        const token = link.trim().split("/p/").pop()?.split(/[?#]/)[0];
        if (token) {
          const row = await getPitchByShareToken(token);
          if (row) sourcePitch = row.content;
        }
      }
      const { data, error } = await supabase.functions.invoke("pitch-assistant", {
        body: {
          mode: selectedMode,
          currentPitch,
          industry: industry || currentPitch?.industry,
          skills: selectedMode === "from-skills" ? skills : undefined,
          sourcePitch,
        },
      });
      if (error) throw error;
      const p = (data as { pitch?: PitchData; error?: string })?.pitch;
      if (!p) throw new Error((data as { error?: string })?.error || "No pitch returned");
      onPitch(p);
      toast.success("Pitch updated by AI assistant");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI assistant failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        aria-label="Open AI assistant"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow transition-transform hover:scale-105"
      >
        {open ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
      </button>

      {open && (
        <Card className="fixed bottom-24 right-6 z-50 w-[min(380px,calc(100vw-2rem))] border-border/60 bg-gradient-card p-5 shadow-elegant animate-fade-in-up">
          <div className="mb-3 flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-primary" />
            <h3 className="font-display text-base font-semibold">AI Pitch Assistant</h3>
          </div>
          <p className="mb-4 text-xs text-muted-foreground">
            Improvise, simplify, build from a shared pitch, or rebuild around your skills.
          </p>

          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="glass" disabled={!currentPitch || loading} onClick={() => run("improvise")}>
              {loading && mode === "improvise" ? <Loader2 className="h-3 w-3 animate-spin" /> : null} Improvise
            </Button>
            <Button size="sm" variant="glass" disabled={!currentPitch || loading} onClick={() => run("simplify")}>
              {loading && mode === "simplify" ? <Loader2 className="h-3 w-3 animate-spin" /> : null} Simplify
            </Button>
          </div>

          <div className="mt-4 space-y-2">
            <Label htmlFor="ai-link" className="text-xs">Paste a shareable pitch link</Label>
            <Input id="ai-link" placeholder="https://…/p/abc" value={link} onChange={(e) => setLink(e.target.value)} />
            <Button size="sm" variant="hero" className="w-full" disabled={!link || loading} onClick={() => run("from-link")}>
              {loading && mode === "from-link" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} Generate from link
            </Button>
          </div>

          <div className="mt-4 space-y-2">
            <Label htmlFor="ai-skills" className="text-xs">Your existing skills (optional)</Label>
            <Textarea id="ai-skills" rows={3} placeholder="e.g. React, conversion copywriting, Figma" value={skills} onChange={(e) => setSkills(e.target.value)} />
            <div className="flex gap-2">
              <Button size="sm" variant="hero" className="flex-1" disabled={!skills.trim() || loading} onClick={() => run("from-skills")}>
                {loading && mode === "from-skills" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} Build from skills
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setSkills(""); setLink(""); }}>Skip</Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
};

export default PitchAssistant;
