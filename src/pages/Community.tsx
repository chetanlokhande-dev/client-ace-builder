import { useEffect, useState, useCallback } from "react";
import Navbar from "@/components/pitchforge/Navbar";
import PitchCard from "@/components/pitchforge/PitchCard";
import { useAuth } from "@/hooks/useAuth";
import { listCommunityPitches, getRatingsFor, ratePitch, toggleBookmark, getMyBookmarkIds, type PitchRow } from "@/services/community";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const Community = () => {
  const { user } = useAuth();
  const [pitches, setPitches] = useState<PitchRow[]>([]);
  const [ratings, setRatings] = useState<Record<string, { avg: number; count: number; mine?: number }>>({});
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const list = await listCommunityPitches();
    setPitches(list);
    const r = await getRatingsFor(list.map((p) => p.id));
    setRatings(r);
    if (user) setBookmarks(await getMyBookmarkIds(user.id));
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh().catch((e) => { toast.error(e.message); setLoading(false); }); }, [refresh]);

  useEffect(() => {
    const channel = supabase
      .channel("community-pitches")
      .on("postgres_changes", { event: "*", schema: "public", table: "pitches" }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refresh]);

  const onRate = async (id: string, value: number) => {
    if (!user) return toast.info("Sign in to rate pitches");
    try { await ratePitch(id, user.id, value); await refresh(); toast.success("Rating saved"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not rate"); }
  };

  const onBookmark = async (id: string, on: boolean) => {
    if (!user) return toast.info("Sign in to save pitches");
    try {
      await toggleBookmark(id, user.id, on);
      setBookmarks((prev) => { const n = new Set(prev); on ? n.add(id) : n.delete(id); return n; });
      toast.success(on ? "Saved to your library" : "Removed from saved");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not update"); }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-10">
        <h1 className="mb-2 font-display text-3xl font-bold">Community pitches</h1>
        <p className="mb-6 text-muted-foreground">Rate, save, and download pitches shared by other creators — updates in real time.</p>
        {loading ? (
          <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : pitches.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/60 p-10 text-center text-muted-foreground">Nothing public yet. Be the first — publish a pitch from your history.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pitches.map((p) => (
              <PitchCard key={p.id} pitch={p} rating={ratings[p.id]} bookmarked={bookmarks.has(p.id)} onRate={onRate} onBookmark={onBookmark} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Community;
