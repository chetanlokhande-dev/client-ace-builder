import { useEffect, useState } from "react";
import Navbar from "@/components/pitchforge/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { listMyBookmarks, listMyPitches, toggleBookmark, type PitchRow } from "@/services/community";
import { toast } from "sonner";
import { Loader2, BookmarkX, Download, ExternalLink, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { downloadPitchPdf } from "@/lib/pitchPdf";
import { buildShareUrl } from "@/services/community";
import { cn } from "@/lib/utils";

const Tile = ({ p, actions, accent }: { p: PitchRow; actions?: React.ReactNode; accent: string }) => (
  <div className="group relative aspect-square overflow-hidden rounded-2xl border border-border/60 bg-card transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elegant">
    <div className={cn("absolute inset-x-0 top-0 h-1.5", accent)} />
    <div className="flex h-full flex-col justify-between p-4">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{p.industry}</p>
        <h3 className="mt-1 line-clamp-2 font-display text-sm font-semibold leading-snug">{p.title}</h3>
      </div>
      <p className="line-clamp-4 text-xs text-foreground/70">{p.content?.intro}</p>
      <p className="text-[10px] text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</p>
    </div>
    <div className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-background/95 via-background/40 to-transparent p-3 opacity-0 transition group-hover:pointer-events-auto group-hover:opacity-100">
      <div className="flex flex-wrap items-center justify-center gap-1.5">{actions}</div>
    </div>
  </div>
);

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

  const copyLink = (token: string) => { navigator.clipboard.writeText(buildShareUrl(token)); toast.success("Link copied"); };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-10">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Library</h1>
            <p className="text-muted-foreground">Your shelf — pitches you've crafted and ones you've collected from peers.</p>
          </div>
          <div className="hidden text-right text-xs text-muted-foreground md:block">
            <p><span className="font-mono text-lg text-foreground">{mine.length}</span> mine</p>
            <p><span className="font-mono text-lg text-foreground">{bookmarked.length}</span> saved</p>
          </div>
        </div>

        <Tabs defaultValue="mine">
          <TabsList>
            <TabsTrigger value="mine">Mine ({mine.length})</TabsTrigger>
            <TabsTrigger value="bookmarks">Bookmarked ({bookmarked.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="mine" className="mt-6">
            {mine.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">Nothing saved yet — generate a pitch from your dashboard.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {mine.map((p) => (
                  <Tile key={p.id} p={p} accent="bg-gradient-primary" actions={
                    <>
                      <Button size="sm" variant="glass" onClick={() => downloadPitchPdf(p.content)}><Download className="h-3 w-3" /></Button>
                      <Button size="sm" variant="glass" onClick={() => copyLink(p.share_token)}><ExternalLink className="h-3 w-3" /></Button>
                    </>
                  } />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="bookmarks" className="mt-6">
            {bookmarked.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
                <Sparkles className="mx-auto mb-2 h-5 w-5 text-primary" />
                Bookmark pitches from the <Link to="/community" className="text-primary underline">community feed</Link> to keep them here.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {bookmarked.map((p) => (
                  <Tile key={p.id} p={p} accent="bg-accent" actions={
                    <>
                      <Button size="sm" variant="glass" onClick={() => downloadPitchPdf(p.content)}><Download className="h-3 w-3" /></Button>
                      <Button size="sm" variant="glass" onClick={() => copyLink(p.share_token)}><ExternalLink className="h-3 w-3" /></Button>
                      <Button size="sm" variant="glass" onClick={() => removeBookmark(p.id)}><BookmarkX className="h-3 w-3" /></Button>
                    </>
                  } />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Saved;
