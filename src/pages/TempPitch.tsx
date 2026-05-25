import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "@/components/pitchforge/Navbar";
import PitchPreview, { type PitchData } from "@/components/pitchforge/PitchPreview";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, Loader2, LogIn, Mail, Save } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  claimTempPitch,
  getTempPitch,
  setClaimEmail,
  type TempPitchRow,
} from "@/services/tempPitches";

const formatRemaining = (ms: number) => {
  if (ms <= 0) return "00:00";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
};

const TempPitch = () => {
  const { token } = useParams<{ token: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [row, setRow] = useState<TempPitchRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [claiming, setClaiming] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailSaved, setEmailSaved] = useState(false);

  useEffect(() => {
    if (!token) return;
    getTempPitch(token)
      .then((r) => setRow(r))
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  const expiresAt = row ? new Date(row.expires_at).getTime() : 0;
  const remaining = expiresAt - now;
  const expired = !!row && remaining <= 0;

  const handleClaim = async () => {
    if (!token) return;
    if (!user) {
      // Stash the token so we can redirect back after auth
      sessionStorage.setItem("pitchforge:pending-claim", token);
      navigate("/auth");
      return;
    }
    setClaiming(true);
    try {
      await claimTempPitch(token);
      toast.success("Pitch saved to your library.");
      navigate("/history");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save pitch");
    } finally {
      setClaiming(false);
    }
  };

  const handleReserveEmail = async () => {
    if (!token) return;
    if (!email.includes("@")) {
      toast.error("Enter a valid email");
      return;
    }
    setEmailSaving(true);
    try {
      await setClaimEmail(token, email);
      setEmailSaved(true);
      toast.success("Reserved! Sign up with this email and it will be added to your library.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not reserve");
    } finally {
      setEmailSaving(false);
    }
  };

  // If user just signed in and there is a pending claim, auto-claim once
  useEffect(() => {
    const pending = sessionStorage.getItem("pitchforge:pending-claim");
    if (user && pending && pending === token && row && !expired) {
      sessionStorage.removeItem("pitchforge:pending-claim");
      handleClaim();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, row]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-10">
        {loading ? (
          <div className="flex justify-center p-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !row ? (
          <div className="rounded-xl border border-dashed border-border/60 p-10 text-center text-muted-foreground">
            This temporary pitch has expired or doesn't exist.
            <div className="mt-4">
              <Link to="/"><Button variant="hero">Back home</Button></Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Clock className="h-3 w-3" />
                {expired ? "Expired" : `Expires in ${formatRemaining(remaining)}`}
              </div>
              <PitchPreview pitch={row.content as PitchData} />
            </div>

            <Card className="h-fit border-border/60 bg-gradient-card p-6">
              <h2 className="font-display text-lg font-semibold">Save this pitch</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                This is a temporary preview. Save it permanently before it expires.
              </p>

              <div className="mt-5 space-y-3">
                <Button
                  variant="hero"
                  className="w-full"
                  disabled={expired || claiming}
                  onClick={handleClaim}
                >
                  {claiming ? <Loader2 className="h-4 w-4 animate-spin" /> : user ? <Save className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
                  {user ? "Save to my library" : "Sign in & save"}
                </Button>

                {!user && (
                  <div className="space-y-2 rounded-lg border border-border/60 bg-secondary/40 p-3">
                    <Label htmlFor="claim-email" className="text-xs">
                      Or reserve with your email
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="claim-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={expired || emailSaved}
                      />
                      <Button
                        variant="glass"
                        size="icon"
                        onClick={handleReserveEmail}
                        disabled={expired || emailSaving || emailSaved}
                      >
                        {emailSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {emailSaved
                        ? "Reserved. Sign up with this email and we'll add it to your library automatically."
                        : "We'll attach this pitch to the account you create with this email."}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default TempPitch;