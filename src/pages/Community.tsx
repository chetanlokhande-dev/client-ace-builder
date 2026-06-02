import { useEffect, useState, useCallback } from "react";
import Navbar from "@/components/pitchforge/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { listCommunityPitches, getRatingsFor, ratePitch, toggleBookmark, getMyBookmarkIds, buildShareUrl, type PitchRow } from "@/services/community";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Star, Bookmark, BookmarkCheck, Download, Link2, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadPitchPdf } from "@/lib/pitchPdf";
import { cn } from "@/lib/utils";

const StarRow = ({ value, mine, onRate }: { value: number; mine?: number; onRate: (n: number) => void }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-0.5" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = hover ? hover >= n : (mine ?? value) >= n - 0.25;
        return (
          <button key={n} onMouseEnter={() => setHover(n)} onClick={() => onRate(n)} className="p-0.5 transition hover:scale-110">
            <Star className={cn("h-4 w-4", filled ? "fill-primary text-primary" : "text-muted-foreground")} />
          </button>
        );
      })}
    </div>
  );
};

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

  const copyLink = (token: string) => { navigator.clipboard.writeText(buildShareUrl(token)); toast.success("Link copied"); };

  const [featured, ...rest] = pitches;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight">The Feed</h1>
            <p className="mt-1 text-muted-foreground">Pitches in the wild — fresh from the community.</p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1 text-xs text-muted-foreground">
            <span className="relative flex h-2 w-2"><span className="absolute h-2 w-2 animate-ping rounded-full bg-primary opacity-75" /><span className="relative h-2 w-2 rounded-full bg-primary" /></span>
            <Radio className="h-3 w-3" /> Live
          </span>
        </div>
        {loading ? (
          <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : pitches.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/60 p-10 text-center text-muted-foreground">Nothing public yet. Be the first — publish a pitch from your history.</p>
        ) : (
          <div className="space-y-6">
            {featured && (
              <article className="group relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-card p-8 shadow-elegant">
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-primary opacity-20 blur-3xl" />
                <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-primary">Featured · {featured.industry}</p>
                    <h2 className="font-display text-2xl font-bold leading-tight md:text-3xl">{featured.title}</h2>
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground/80 line-clamp-3">{featured.content?.intro}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <StarRow value={ratings[featured.id]?.avg ?? 0} mine={ratings[featured.id]?.mine} onRate={(n) => onRate(featured.id, n)} />
                      <span className="text-xs text-muted-foreground">{ratings[featured.id]?.count ?? 0} ratings</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="hero" onClick={() => downloadPitchPdf(featured.content)}><Download className="h-3 w-3" /> PDF</Button>
                    <Button size="sm" variant="glass" onClick={() => copyLink(featured.share_token)}><Link2 className="h-3 w-3" /> Share</Button>
                    <Button size="sm" variant="glass" onClick={() => onBookmark(featured.id, !bookmarks.has(featured.id))}>
                      {bookmarks.has(featured.id) ? <BookmarkCheck className="h-3 w-3" /> : <Bookmark className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </article>
            )}

            <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4 [&>*]:break-inside-avoid">
              {rest.map((p, i) => {
                const r = ratings[p.id];
                const tall = i % 5 === 0 || i % 5 === 3;
                return (
                  <article key={p.id} className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elegant">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{p.industry}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</span>
                    </div>
                    <h3 className="font-display text-base font-semibold leading-snug">{p.title}</h3>
                    <p className={cn("mt-2 text-sm text-foreground/75", tall ? "line-clamp-6" : "line-clamp-3")}>{p.content?.intro}</p>
                    <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/40 pt-3">
                      <StarRow value={r?.avg ?? 0} mine={r?.mine} onRate={(n) => onRate(p.id, n)} />
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => downloadPitchPdf(p.content)} className="h-7 w-7 p-0"><Download className="h-3 w-3" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => copyLink(p.share_token)} className="h-7 w-7 p-0"><Link2 className="h-3 w-3" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => onBookmark(p.id, !bookmarks.has(p.id))} className="h-7 w-7 p-0">
                          {bookmarks.has(p.id) ? <BookmarkCheck className="h-3 w-3 text-primary" /> : <Bookmark className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Community;
