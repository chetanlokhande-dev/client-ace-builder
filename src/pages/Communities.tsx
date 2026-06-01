import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/pitchforge/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, Lock, Plus, Users, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { createCommunity, listCommunities, type Community, type CommunityVisibility } from "@/services/communities";
import { toast } from "sonner";

const VisIcon = ({ v }: { v: CommunityVisibility }) =>
  v === "private" ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />;

const Communities = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [list, setList] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({ name: "", description: "", visibility: "public" as Exclude<CommunityVisibility, "global"> });
  const [submitting, setSubmitting] = useState(false);

  const refresh = () => {
    setLoading(true);
    listCommunities().then((d) => setList(d)).catch((e) => toast.error(e.message)).finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  const handleCreate = async () => {
    if (!user) { navigate("/auth"); return; }
    if (form.name.trim().length < 3) return toast.error("Name must be at least 3 characters");
    setSubmitting(true);
    try {
      const c = await createCommunity(form);
      toast.success("Community created");
      setOpen(false);
      setForm({ name: "", description: "", visibility: "public" });
      navigate(`/communities/${c.id}`);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not create"); }
    finally { setSubmitting(false); }
  };

  const filtered = list.filter((c) =>
    !q || c.name.toLowerCase().includes(q.toLowerCase()) || (c.description ?? "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-10">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Communities</h1>
            <p className="text-muted-foreground">Public, private, and global spaces to share pitches with peers.</p>
          </div>
          <div className="flex gap-2">
            <Input placeholder="Search communities…" value={q} onChange={(e) => setQ(e.target.value)} className="md:w-64" />
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="hero"><Plus className="h-4 w-4" /> New community</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create a community</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Name</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={60} />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
                  </div>
                  <div>
                    <Label>Visibility</Label>
                    <Select value={form.visibility} onValueChange={(v) => setForm({ ...form, visibility: v as "public" | "private" })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public — anyone can join instantly</SelectItem>
                        <SelectItem value="private">Private — join by request</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button variant="hero" onClick={handleCreate} disabled={submitting}>
                    {submitting && <Loader2 className="h-3 w-3 animate-spin" />} Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/60 p-10 text-center text-muted-foreground">
            No communities yet. Be the first to start one.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((c) => (
              <Link key={c.id} to={`/communities/${c.id}`}>
                <Card className="flex h-full flex-col gap-3 border-border/60 bg-gradient-card p-5 transition hover:border-primary/40">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-base font-semibold">{c.name}</h3>
                    <span className="flex items-center gap-1 rounded-full border border-border/60 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      <VisIcon v={c.visibility} /> {c.visibility}
                    </span>
                  </div>
                  <p className="line-clamp-3 text-sm text-foreground/80">{c.description || "No description yet."}</p>
                  <div className="mt-auto flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" /> View community →
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Communities;