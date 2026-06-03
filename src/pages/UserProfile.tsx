import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "@/components/pitchforge/Navbar";
import { Card } from "@/components/ui/card";
import { Loader2, User } from "lucide-react";
import {
  getPublicProfile,
  listPublicPitchesByUser,
  type PitchRow,
  type PublicProfile,
} from "@/services/community";

const UserProfilePage = () => {
  const { userId = "" } = useParams();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [pitches, setPitches] = useState<PitchRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    Promise.all([getPublicProfile(userId), listPublicPitchesByUser(userId)])
      .then(([p, list]) => {
        setProfile(p);
        setPitches(list);
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
          <div className="flex justify-center p-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !profile ? (
          <p className="rounded-xl border border-dashed border-border/60 p-10 text-center text-muted-foreground">
            This author hasn't made their profile visible.
          </p>
        ) : (
          <>
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
                {pitches.map((p) => (
                  <Link
                    key={p.id}
                    to={`/p/${p.share_token}`}
                    className="group rounded-xl border border-border/60 bg-gradient-card p-5 transition hover:border-primary/40"
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
          </>
        )}
      </main>
    </div>
  );
};

export default UserProfilePage;