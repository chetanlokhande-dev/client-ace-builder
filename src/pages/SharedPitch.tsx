import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "@/components/pitchforge/Navbar";
import PitchPreview from "@/components/pitchforge/PitchPreview";
import { Button } from "@/components/ui/button";
import { Download, Loader2, User } from "lucide-react";
import { getPitchByShareToken, getPublicProfile, type PitchRow, type PublicProfile } from "@/services/community";
import { downloadPitchPdf } from "@/lib/pitchPdf";

const SharedPitch = () => {
  const { token } = useParams();
  const [pitch, setPitch] = useState<PitchRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [author, setAuthor] = useState<PublicProfile | null>(null);

  useEffect(() => {
    if (!token) return;
    getPitchByShareToken(token).then((row) => {
      if (!row) setNotFound(true); else setPitch(row);
    }).finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!pitch?.show_author || !pitch.user_id) return;
    getPublicProfile(pitch.user_id).then(setAuthor).catch(() => { /* ignore */ });
  }, [pitch]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-3xl py-10">
        {loading ? (
          <div className="flex justify-center p-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : notFound || !pitch ? (
          <p className="rounded-xl border border-dashed border-border/60 p-10 text-center text-muted-foreground">This pitch link is no longer available.</p>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="font-display text-3xl font-bold">{pitch.title}</h1>
                <p className="text-sm text-muted-foreground">Shared pitch · {pitch.industry}</p>
              </div>
              <Button variant="hero" onClick={() => downloadPitchPdf(pitch.content)}><Download className="h-4 w-4" /> Download PDF</Button>
            </div>
            {author && (
              <Link
                to={`/u/${author.id}`}
                className="mb-6 flex items-center gap-3 rounded-xl border border-border/60 bg-gradient-card p-4 transition hover:border-primary/40"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                  {author.avatar_url ? (
                    <img src={author.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    (author.full_name || "PF").split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase() || <User className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">By {author.full_name || "Author"}</p>
                  {author.bio && <p className="line-clamp-1 text-xs text-muted-foreground">{author.bio}</p>}
                </div>
                <span className="shrink-0 text-xs text-primary">View profile →</span>
              </Link>
            )}
            <PitchPreview pitch={pitch.content} />
          </>
        )}
      </main>
    </div>
  );
};

export default SharedPitch;
