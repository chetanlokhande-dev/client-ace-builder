import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/pitchforge/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PitchPreview, { type PitchData } from "@/components/pitchforge/PitchPreview";
import PitchAssistant from "@/components/pitchforge/PitchAssistant";
import { Download, Loader2, Save, Share2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { savePitch } from "@/services/pitches";
import { supabase } from "@/integrations/supabase/client";
import { downloadPitchPdf } from "@/lib/pitchPdf";
import { buildShareUrl, setPitchPublic } from "@/services/community";

const INDUSTRIES = ["SaaS", "E-commerce", "Real Estate", "Startups", "Agencies"];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    details: "",
    links: "",
    industry: "SaaS",
    clientUrl: "",
  });
  const [pitch, setPitch] = useState<PitchData | null>(null);
  const [personalizedFor, setPersonalizedFor] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [savedShareToken, setSavedShareToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const handleGenerate = async () => {
    if (!form.title && !form.description && !form.details) {
      toast.error("Add a title, description, or project details so we know what to pitch.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-pitch", {
        body: form,
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      const generated = (data as { pitch?: PitchData })?.pitch;
      if (!generated) throw new Error("No pitch returned");
      setPitch(generated);
      setPersonalizedFor((data as { personalizedFor?: string | null })?.personalizedFor ?? null);
      toast.success("Your pitch is ready!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not generate pitch";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!pitch) return;
    if (!user) {
      toast.info("Sign in to save your pitch.");
      navigate("/auth");
      return;
    }
    setSaving(true);
    try {
      const row = await savePitch(user.id, form, pitch);
      setSavedId((row as { id: string }).id);
      setSavedShareToken((row as { share_token?: string }).share_token ?? null);
      toast.success("Pitch saved to your library.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not save pitch";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    if (pitch) downloadPitchPdf(pitch);
  };

  const handleShare = async () => {
    if (!pitch) return;
    if (!user) { toast.info("Sign in to share your pitch."); navigate("/auth"); return; }
    try {
      let token = savedShareToken;
      let id = savedId;
      if (!id) {
        const row = await savePitch(user.id, form, pitch);
        id = (row as { id: string }).id;
        token = (row as { share_token: string }).share_token;
        setSavedId(id);
        setSavedShareToken(token);
      }
      if (id) await setPitchPublic(id, true);
      if (token) {
        await navigator.clipboard.writeText(buildShareUrl(token));
        toast.success("Public share link copied");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create share link");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Your pitch studio</h1>
            <p className="mt-1 text-muted-foreground">Describe your portfolio, pick an industry, and generate.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="hero" disabled={!pitch || saving} onClick={handleSave}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {user ? "Save pitch" : "Sign in to save"}
            </Button>
            <Button variant="glass" disabled={!pitch} onClick={handleDownload}> <Download className="h-4 w-4" /> Download PDF</Button>
            <Button variant="glass" disabled={!pitch} onClick={handleShare}> <Share2 className="h-4 w-4" /> Share link</Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          {/* Form */}
          <Card className="h-fit border-border/60 bg-gradient-card p-6">
            <h2 className="mb-4 font-display text-lg font-semibold">Portfolio details</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Portfolio title</Label>
                <Input id="title" placeholder="Senior product designer" value={form.title} onChange={update("title")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Short description</Label>
                <Input id="description" placeholder="I help teams design and ship beautiful products." value={form.description} onChange={update("description")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="details">Project details</Label>
                <Textarea id="details" rows={5} placeholder="Briefly describe 2–3 relevant projects, outcomes and your role." value={form.details} onChange={update("details")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="links">Links (optional)</Label>
                <Input id="links" placeholder="https://yourportfolio.com" value={form.links} onChange={update("links")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientUrl">Client website (optional)</Label>
                <Input
                  id="clientUrl"
                  type="url"
                  placeholder="https://acme.com"
                  value={form.clientUrl}
                  onChange={update("clientUrl")}
                />
                <p className="text-xs text-muted-foreground">
                  We'll scan the site and tailor the pitch to their business.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Client industry</Label>
                <Select value={form.industry} onValueChange={(v) => setForm({ ...form, industry: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((i) => (
                      <SelectItem key={i} value={i}>{i}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleGenerate} variant="hero" size="lg" className="w-full" disabled={loading}>
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Crafting your pitch…</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Generate AI pitch</>
                )}
              </Button>
            </div>
          </Card>

          {/* Preview */}
          <div>
            {personalizedFor && pitch && (
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-3 w-3" />
                Personalized for {personalizedFor}
              </div>
            )}
            <PitchPreview pitch={pitch} />
          </div>
        </div>
      </main>
      <PitchAssistant currentPitch={pitch} industry={form.industry} onPitch={setPitch} />
    </div>
  );
};

export default Dashboard;