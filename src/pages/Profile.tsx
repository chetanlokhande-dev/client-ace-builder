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

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [emailPwd, setEmailPwd] = useState("");
  const [changingEmail, setChangingEmail] = useState(false);

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [changingPwd, setChangingPwd] = useState(false);

  useEffect(() => { if (!authLoading && !user) navigate("/auth"); }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle()
      .then(({ data }) => setFullName(data?.full_name ?? ""));
  }, [user]);

  const saveName = async () => {
    if (!user) return;
    setSavingName(true);
    const { error } = await supabase.from("profiles").upsert({ id: user.id, full_name: fullName });
    setSavingName(false);
    error ? toast.error(error.message) : toast.success("Profile updated");
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
        <h1 className="font-display text-3xl font-bold">Profile</h1>

        <Card className="border-border/60 bg-gradient-card p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold">Display name</h2>
          <div className="space-y-2">
            <Label htmlFor="fn">Full name</Label>
            <Input id="fn" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <Button variant="hero" disabled={savingName} onClick={saveName}>
            {savingName && <Loader2 className="h-4 w-4 animate-spin" />} Save
          </Button>
        </Card>

        <Card className="border-border/60 bg-gradient-card p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold">Change email</h2>
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
          <h2 className="font-display text-lg font-semibold">Change password</h2>
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
      </main>
    </div>
  );
};

export default Profile;
