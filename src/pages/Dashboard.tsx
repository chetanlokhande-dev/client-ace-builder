import { useEffect, useRef, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PitchPreview, { type PitchData } from "@/components/pitchforge/PitchPreview";
import PitchAssistant from "@/components/pitchforge/PitchAssistant";
import { Clock, Copy, Download, History as HistoryIcon, Loader2, Save, Share2, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { savePitch } from "@/services/pitches";
import { supabase } from "@/integrations/supabase/client";
import { downloadPitchPdf } from "@/lib/pitchPdf";
import { buildShareUrl, setPitchPublic } from "@/services/community";
import {
  buildTempUrl,
  claimTempPitchesByEmail,
  createTempPitch,
} from "@/services/tempPitches";

const INDUSTRIES = ["SaaS", "E-commerce", "Real Estate", "Startups", "Agencies"];

const DRAFT_KEY = "pitchforge:dashboard-draft";

type PitchVersion = {
  id: string;
  pitch: PitchData;
  personalizedFor: string | null;
  createdAt: number;
  label: string;
};

type Draft = {
  form: {
    title: string;
    description: string;
    details: string;
    links: string;
    industry: string;
    clientUrl: string;
  };
  pitch: PitchData | null;
  personalizedFor: string | null;
  versions?: PitchVersion[];
  activeVersionId?: string | null;
};

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
  const [versions, setVersions] = useState<PitchVersion[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [savedShareToken, setSavedShareToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);
  const [tempBusy, setTempBusy] = useState(false);
  const [tempLink, setTempLink] = useState<string | null>(null);
  const hydrated = useRef(false);

  // Restore draft from localStorage on first mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw) as Draft;
        if (d.form) setForm(d.form);
        if (d.pitch) setPitch(d.pitch);
        if (d.personalizedFor) setPersonalizedFor(d.personalizedFor);
        if (Array.isArray(d.versions)) setVersions(d.versions);
        if (d.activeVersionId) setActiveVersionId(d.activeVersionId);
      }
    } catch {
      /* ignore */
    }
    hydrated.current = true;
  }, []);

  // Autosave draft
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ form, pitch, personalizedFor, versions, activeVersionId } satisfies Draft),
      );
    } catch {
      /* ignore */
    }
  }, [form, pitch, personalizedFor, versions, activeVersionId]);

  // When a user signs in, auto-import any temp pitches they reserved with their email
  useEffect(() => {
    if (!user) return;
    claimTempPitchesByEmail()
      .then((n) => {
        if (n > 0) toast.success(`${n} guest pitch${n > 1 ? "es" : ""} added to your library.`);
      })
      .catch(() => {
        /* silent — non-critical */
      });
  }, [user]);

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
      const personalized = (data as { personalizedFor?: string | null })?.personalizedFor ?? null;
      const version: PitchVersion = {
        id: (globalThis.crypto?.randomUUID?.() ?? `v-${Date.now()}`),
        pitch: generated,
        personalizedFor: personalized,
        createdAt: Date.now(),
        label: (form.title || "Untitled pitch").trim().slice(0, 60),
      };
      setVersions((prev) => [version, ...prev].slice(0, 20));
      setActiveVersionId(version.id);
      setPitch(generated);
      setPersonalizedFor(personalized);
      toast.success(versions.length === 0 ? "Your pitch is ready!" : "New version saved as draft.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not generate pitch";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const selectVersion = (id: string) => {
    const v = versions.find((x) => x.id === id);
    if (!v) return;
    setActiveVersionId(id);
    setPitch(v.pitch);
    setPersonalizedFor(v.personalizedFor);
  };

  const deleteVersion = (id: string) => {
    setVersions((prev) => {
      const next = prev.filter((v) => v.id !== id);
      if (activeVersionId === id) {
        const fallback = next[0] ?? null;
        setActiveVersionId(fallback?.id ?? null);
        setPitch(fallback?.pitch ?? null);
        setPersonalizedFor(fallback?.personalizedFor ?? null);
      }
      return next;
    });
  };

  const formatVersionTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const handleSave = async () => {
    if (!pitch) return;
    if (!user) {
      setGuestOpen(true);
      return;
    }
    setSaving(true);
    try {
      const row = await savePitch(user.id, form, pitch);
      setSavedId((row as { id: string }).id);
      setSavedShareToken((row as { share_token?: string }).share_token ?? null);
      toast.success("Pitch saved to your library.");
      localStorage.removeItem(DRAFT_KEY);
      setVersions([]);
      setActiveVersionId(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not save pitch";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleSignInAndSave = () => {
    // Draft is already in localStorage; Auth redirects back to /dashboard
    setGuestOpen(false);
    navigate("/auth");
  };

  const handleCreateTempLink = async () => {
    if (!pitch) return;
    setTempBusy(true);
    try {
      const row = await createTempPitch({
        title: form.title,
        description: form.description,
        details: form.details,
        links: form.links,
        industry: form.industry,
        content: pitch,
      });
      const url = buildTempUrl(row.share_token);
      setTempLink(url);
      try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
      toast.success("Temporary link created — copied to clipboard. Expires in 5 minutes.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create temporary link");
    } finally {
      setTempBusy(false);
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

      <Dialog open={guestOpen} onOpenChange={(o) => { setGuestOpen(o); if (!o) setTempLink(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save your pitch</DialogTitle>
            <DialogDescription>
              Sign in to keep it in your library forever — or grab a temporary 5-minute link you can open from any browser.
            </DialogDescription>
          </DialogHeader>

          {tempLink ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-secondary/40 p-3 text-xs">
                <Clock className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">{tempLink}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    await navigator.clipboard.writeText(tempLink);
                    toast.success("Copied");
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Open this link in any browser within 5 minutes. From there you can sign in and save it permanently, or leave an email to claim it later.
              </p>
              <DialogFooter>
                <Button variant="glass" onClick={() => { setGuestOpen(false); setTempLink(null); }}>
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-2">
              <Button variant="hero" className="w-full" onClick={handleSignInAndSave}>
                Sign in & save permanently
              </Button>
              <Button
                variant="glass"
                className="w-full"
                disabled={tempBusy}
                onClick={handleCreateTempLink}
              >
                {tempBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
                Create 5-minute temporary link
              </Button>
              <p className="pt-1 text-xs text-muted-foreground">
                Your draft is auto-saved in this browser, so it will still be here when you come back.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;