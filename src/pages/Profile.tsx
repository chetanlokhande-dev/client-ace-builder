import { useEffect, useState } from "react";
import Navbar from "@/components/pitchforge/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Link } from "react-router-dom";
import { Contact2, KeyRound, SlidersHorizontal } from "lucide-react";
import {
  loadPersonality,
  savePersonality,
  type Personality,
} from "@/services/personality";

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [bio, setBio] = useState("");
  const [showAuthorDefault, setShowAuthorDefault] = useState(false);
  const [savingPublic, setSavingPublic] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [emailPwd, setEmailPwd] = useState("");
  const [changingEmail, setChangingEmail] = useState(false);

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [changingPwd, setChangingPwd] = useState(false);

  const [personality, setPersonality] = useState<Personality>({});
  const [savingPersonality, setSavingPersonality] = useState(false);

  useEffect(() => { if (!authLoading && !user) navigate("/auth"); }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("profiles")
      .select("full_name, bio, show_author_default")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }: { data: { full_name?: string; bio?: string; show_author_default?: boolean } | null }) => {
        setFullName(data?.full_name ?? "");
        setBio(data?.bio ?? "");
        setShowAuthorDefault(Boolean(data?.show_author_default));
      });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadPersonality(user.id).then(setPersonality).catch(() => { /* ignore */ });
  }, [user]);

  const updateP = (k: keyof Personality) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setPersonality((prev) => ({ ...prev, [k]: e.target.value }));

  const handleSavePersonality = async () => {
    if (!user) return;
    setSavingPersonality(true);
    try {
      await savePersonality(user.id, personality);
      toast.success("Personality saved. New pitches will use your voice.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save personality");
    } finally {
      setSavingPersonality(false);
    }
  };

  const saveName = async () => {
    if (!user) return;
    setSavingName(true);
    const { error } = await supabase.from("profiles").upsert({ id: user.id, full_name: fullName });
    setSavingName(false);
    error ? toast.error(error.message) : toast.success("Profile updated");
  };

  const savePublic = async () => {
    if (!user) return;
    setSavingPublic(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("profiles")
      .upsert({ id: user.id, bio, show_author_default: showAuthorDefault });
    setSavingPublic(false);
    error ? toast.error(error.message) : toast.success("Public profile updated");
  };

  const changeEmail = async () => {
    if (!user?.email) return;
    setChangingEmail(true);
    try {
      const { error: verifyErr } = await supabase.auth.signInWithPassword({ email: user.email, password: emailPwd });
      if (verifyErr) throw new Error("Current password is incorrect");
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      toast.success("Verification email sent to your new address");
      setNewEmail(""); setEmailPwd("");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not change email"); }
    finally { setChangingEmail(false); }
  };

  const changePwd = async () => {
    if (!user?.email) return;
    setChangingPwd(true);
    try {
      const { error: verifyErr } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPwd });
      if (verifyErr) throw new Error("Current password is incorrect");
      const { error } = await supabase.auth.updateUser({ password: newPwd });
      if (error) throw error;
      toast.success("Password updated");
      setCurrentPwd(""); setNewPwd("");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not change password"); }
    finally { setChangingPwd(false); }
  };

  if (authLoading || !user) return <div className="min-h-screen bg-background"><Navbar /><div className="flex justify-center p-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div></div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-2xl py-10 space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage who you are, how the AI sounds like you, and how others find your work.
          </p>
        </div>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info"><Contact2 className="mr-1.5 h-3.5 w-3.5" /> Information</TabsTrigger>
            <TabsTrigger value="security"><KeyRound className="mr-1.5 h-3.5 w-3.5" /> Security</TabsTrigger>
            <TabsTrigger value="setup"><SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" /> Setup</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-6 space-y-6">
            <Card className="border-border/60 bg-gradient-card p-6 space-y-4">
              <h2 className="font-display text-lg font-semibold">Who you are</h2>
              <p className="text-sm text-muted-foreground">The name shown to teammates and on pitches when you opt in.</p>
              <div className="space-y-2">
                <Label htmlFor="fn">Full name</Label>
                <Input id="fn" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <Button variant="hero" disabled={savingName} onClick={saveName}>
                {savingName && <Loader2 className="h-4 w-4 animate-spin" />} Save
              </Button>
            </Card>

            <Card className="border-border/60 bg-gradient-card p-6 space-y-4">
              <div>
                <h2 className="font-display text-lg font-semibold">Public card</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  When enabled on a pitch, viewers will see your name and bio, and can open a tiny page with your other public pitches.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Short bio</Label>
                <Textarea id="bio" rows={3} placeholder="One line about what you do and who you help." value={bio} onChange={(e) => setBio(e.target.value)} maxLength={280} />
                <p className="text-[11px] text-muted-foreground">{bio.length}/280</p>
              </div>
              <div className="flex items-start justify-between gap-3 rounded-lg border border-border/60 bg-secondary/30 p-3">
                <div>
                  <div className="text-sm font-medium">Show me on every new public pitch</div>
                  <p className="text-xs text-muted-foreground">You can still flip it off per pitch from History.</p>
                </div>
                <Switch checked={showAuthorDefault} onCheckedChange={setShowAuthorDefault} />
              </div>
              <div className="flex items-center justify-between">
                <Button variant="hero" disabled={savingPublic} onClick={savePublic}>
                  {savingPublic && <Loader2 className="h-4 w-4 animate-spin" />} Save card
                </Button>
                <Link to={`/u/${user.id}`} className="text-xs text-primary hover:underline">
                  Preview public page →
                </Link>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-6 space-y-6">
            <Card className="border-border/60 bg-gradient-card p-6 space-y-4">
              <h2 className="font-display text-lg font-semibold">Email</h2>
              <p className="text-sm text-muted-foreground">Current: {user.email}. We verify your current password first, then send a confirmation link to your new email.</p>
              <div className="space-y-2">
                <Label htmlFor="ne">New email</Label>
                <Input id="ne" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ep">Current password</Label>
                <Input id="ep" type="password" value={emailPwd} onChange={(e) => setEmailPwd(e.target.value)} />
              </div>
              <Button variant="hero" disabled={!newEmail || !emailPwd || changingEmail} onClick={changeEmail}>
                {changingEmail && <Loader2 className="h-4 w-4 animate-spin" />} Send verification
              </Button>
            </Card>

            <Card className="border-border/60 bg-gradient-card p-6 space-y-4">
              <h2 className="font-display text-lg font-semibold">Password</h2>
              <div className="space-y-2">
                <Label htmlFor="cp">Current password</Label>
                <Input id="cp" type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="np">New password</Label>
                <Input id="np" type="password" minLength={6} value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
              </div>
              <Button variant="hero" disabled={!currentPwd || newPwd.length < 6 || changingPwd} onClick={changePwd}>
                {changingPwd && <Loader2 className="h-4 w-4 animate-spin" />} Update password
              </Button>
            </Card>
          </TabsContent>

          <TabsContent value="setup" className="mt-6">
            <Card className="border-border/60 bg-gradient-card p-6 space-y-4">
              <div>
                <h2 className="font-display text-lg font-semibold">Pitch personality</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Teach the AI how you sound. These hints are blended into every new pitch generation (and the "Redesign in my voice" action on the studio).
                </p>
              </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="p-tone">Tone</Label>
              <Input id="p-tone" placeholder="warm, direct, dry-witty" value={personality.tone ?? ""} onChange={updateP("tone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-voice">Voice / persona</Label>
              <Input id="p-voice" placeholder="confident expert, friendly partner" value={personality.voice ?? ""} onChange={updateP("voice")} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="p-strengths">Strengths you want highlighted</Label>
              <Textarea id="p-strengths" rows={2} placeholder="systems thinking, conversion copy, shipping fast under ambiguity" value={personality.strengths ?? ""} onChange={updateP("strengths")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-values">Values</Label>
              <Textarea id="p-values" rows={2} placeholder="craft, candor, long-term thinking" value={personality.values ?? ""} onChange={updateP("values")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-style">Working style</Label>
              <Textarea id="p-style" rows={2} placeholder="async-first, weekly demos, small focused sprints" value={personality.workingStyle ?? ""} onChange={updateP("workingStyle")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-comm">Communication style</Label>
              <Textarea id="p-comm" rows={2} placeholder="short Loom updates, plain English, no jargon" value={personality.communication ?? ""} onChange={updateP("communication")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-sign">Signature phrases (optional)</Label>
              <Textarea id="p-sign" rows={2} placeholder="'ship to learn', 'taste is the unfair advantage'" value={personality.signaturePhrases ?? ""} onChange={updateP("signaturePhrases")} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="p-avoid">Things to avoid</Label>
              <Textarea id="p-avoid" rows={2} placeholder="corporate clichés, emojis, the word 'synergy'" value={personality.avoid ?? ""} onChange={updateP("avoid")} />
            </div>
          </div>
              <Button variant="hero" disabled={savingPersonality} onClick={handleSavePersonality}>
                {savingPersonality && <Loader2 className="h-4 w-4 animate-spin" />} Save personality
              </Button>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Profile;
