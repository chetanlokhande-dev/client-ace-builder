import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "@/components/pitchforge/Navbar";
import PitchPreview from "@/components/pitchforge/PitchPreview";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { getPitchByShareToken, type PitchRow } from "@/services/community";
import { downloadPitchPdf } from "@/lib/pitchPdf";

const SharedPitch = () => {
  const { token } = useParams();
  const [pitch, setPitch] = useState<PitchRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!token) return;
    getPitchByShareToken(token).then((row) => {
      if (!row) setNotFound(true); else setPitch(row);
    }).finally(() => setLoading(false));
  }, [token]);

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
            <PitchPreview pitch={pitch.content} />
          </>
        )}
      </main>
    </div>
  );
};

export default SharedPitch;
