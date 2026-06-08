import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "@/components/pitchforge/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, User, AlertTriangle, ArrowLeft } from "lucide-react";
import {
  getPublicProfile,
  listPublicPitchesByUser,
  type PitchRow,
  type PublicProfile,
} from "@/services/community";

const SkeletonCard = () => (
  <div className="mb-8 animate-pulse rounded-xl border border-border/60 bg-gradient-card p-6">
    <div className="flex items-center gap-5">
      <div className="h-16 w-16 rounded-full bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-5 w-40 rounded bg-muted" />
        <div className="h-3 w-56 rounded bg-muted" />
        <div className="h-3 w-24 rounded bg-muted" />
      </div>
    </div>
  </div>
);

const SkeletonGrid = () => (
  <div className="grid gap-4 sm:grid-cols-2">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="animate-pulse rounded-xl border border-border/60 bg-gradient-card p-5">
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="mt-2 h-3 w-1/2 rounded bg-muted" />
        <div className="mt-3 space-y-1">
          <div className="h-3 w-full rounded bg-muted" />
          <div className="h-3 w-5/6 rounded bg-muted" />
        </div>
      </div>
    ))}
  </div>
);

const UserProfilePage = () => {
  const { userId = "" } = useParams();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [pitches, setPitches] = useState<PitchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setError("No user ID provided.");
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all([getPublicProfile(userId), listPublicPitchesByUser(userId)])
      .then(([p, list]) => {
        setProfile(p);
        setPitches(list);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Could not load profile.");
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const initials = (profile?.full_name || "PF")
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-4xl py-10">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonGrid />
          </>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-destructive/40 bg-destructive/5 p-10 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <div>
              <p className="text-sm font-medium text-destructive">{error}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Something went wrong while loading this profile.
              </p>
            </div>
            <Button size="sm" variant="outline" asChild>
              <Link to="/community">
                <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to community
              </Link>
            </Button>
          </div>
        ) : !profile ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/60 p-10 text-center">
            <User className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                This author hasn't made their profile visible.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                They may have chosen to keep their profile private or haven't published any public pitches yet.
              </p>
            </div>
            <Button size="sm" variant="outline" asChild>
              <Link to="/community">
                <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to community
              </Link>
            </Button>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Card className="mb-8 flex items-center gap-5 border-border/60 bg-gradient-card p-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-lg font-semibold text-primary">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  initials || <User className="h-6 w-6" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="font-display text-2xl font-bold">
                  {profile.full_name || "Anonymous author"}
                </h1>
                {profile.bio && (
                  <p className="mt-1 text-sm text-muted-foreground">{profile.bio}</p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  {pitches.length} public {pitches.length === 1 ? "pitch" : "pitches"}
                </p>
              </div>
            </Card>

            {pitches.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
                Nothing public yet.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {pitches.map((p, idx) => (
                  <Link
                    key={p.id}
                    to={`/p/${p.share_token}`}
                    className="group rounded-xl border border-border/60 bg-gradient-card p-5 transition hover:border-primary/40"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <h3 className="font-display text-base font-semibold group-hover:text-primary">
                      {p.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {p.industry} · {new Date(p.created_at).toLocaleDateString()}
                    </p>
                    <p className="mt-3 line-clamp-3 text-sm text-foreground/80">
                      {p.content?.intro}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default UserProfilePage;
