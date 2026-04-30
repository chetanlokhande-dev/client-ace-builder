import { useEffect, useState } from "react";
import Navbar from "@/components/pitchforge/Navbar";
import PitchCard from "@/components/pitchforge/PitchCard";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { listMyPitches, setPitchPublic, type PitchRow } from "@/services/community";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const History = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [pitches, setPitches] = useState<PitchRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    listMyPitches(user.id).then((p) => { setPitches(p); setLoading(false); }).catch((e) => { toast.error(e.message); setLoading(false); });
  }, [user]);

  const togglePublic = async (id: string, next: boolean) => {
    try {
      const updated = await setPitchPublic(id, next);
      setPitches((prev) => prev.map((p) => (p.id === id ? { ...p, is_public: updated.is_public } : p)));
      toast.success(next ? "Pitch published to community" : "Pitch is now private");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not update"); }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("pitches").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setPitches((p) => p.filter((x) => x.id !== id));
    toast.success("Pitch deleted");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-10">
        <h1 className="mb-2 font-display text-3xl font-bold">Your pitch history</h1>
        <p className="mb-6 text-muted-foreground">All pitches you've generated and saved.</p>
        {loading ? (
          <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : pitches.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/60 p-10 text-center text-muted-foreground">No saved pitches yet. Generate one from your dashboard.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pitches.map((p) => (
              <PitchCard key={p.id} pitch={p} ownerView onTogglePublic={togglePublic} onDelete={remove} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default History;
