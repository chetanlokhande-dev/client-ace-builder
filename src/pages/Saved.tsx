import { useEffect, useState } from "react";
import Navbar from "@/components/pitchforge/Navbar";
import PitchCard from "@/components/pitchforge/PitchCard";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { listMyBookmarks, listMyPitches, toggleBookmark, type PitchRow } from "@/services/community";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const Saved = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [mine, setMine] = useState<PitchRow[]>([]);
  const [bookmarked, setBookmarked] = useState<PitchRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!authLoading && !user) navigate("/auth"); }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    Promise.all([listMyPitches(user.id), listMyBookmarks(user.id)])
      .then(([m, b]) => { setMine(m); setBookmarked(b); setLoading(false); })
      .catch((e) => { toast.error(e.message); setLoading(false); });
  }, [user]);

  const removeBookmark = async (id: string) => {
    if (!user) return;
    await toggleBookmark(id, user.id, false);
    setBookmarked((b) => b.filter((p) => p.id !== id));
    toast.success("Removed from saved");
  };

  if (loading) return <div className="min-h-screen bg-background"><Navbar /><div className="flex justify-center p-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div></div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-10 space-y-12">
        <section>
          <h1 className="mb-2 font-display text-3xl font-bold">Saved</h1>
          <p className="mb-6 text-muted-foreground">Your own saved pitches and the ones you've bookmarked from the community.</p>
          <h2 className="mb-3 font-display text-lg font-semibold">My saved pitches</h2>
          {mine.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">Nothing saved yet.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {mine.map((p) => <PitchCard key={p.id} pitch={p} ownerView />)}
            </div>
          )}
        </section>
        <section>
          <h2 className="mb-3 font-display text-lg font-semibold">From the community</h2>
          {bookmarked.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">Bookmark community pitches to keep them here.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {bookmarked.map((p) => <PitchCard key={p.id} pitch={p} bookmarked onBookmark={() => removeBookmark(p.id)} />)}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Saved;
