import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "@/components/pitchforge/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Globe, Lock, Loader2, Trash2, UserPlus, ShieldCheck, Ban, UserMinus, Crown, ArrowUp, ArrowDown, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getCommunity, listMembers, myMembership, joinCommunity, leaveCommunity,
  setMemberRole, setMemberStatus, removeMember, deleteCommunity,
  listCommunityPitches, postPitchToCommunity, removeCommunityPitch,
  type Community, type CommunityMember, type CommunityPitchRow,
} from "@/services/communities";
import { listMyPitches, type PitchRow } from "@/services/community";
import { toast } from "sonner";

const roleRank: Record<string, number> = { owner: 3, leader: 2, member: 1 };

const CommunityDetail = () => {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [mine, setMine] = useState<CommunityMember | null>(null);
  const [pitches, setPitches] = useState<CommunityPitchRow[]>([]);
  const [myPitches, setMyPitches] = useState<PitchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [postOpen, setPostOpen] = useState(false);
  const [selectedPitch, setSelectedPitch] = useState<string>("");

  const refresh = useCallback(async () => {
    try {
      const [c, ms, mm, ps] = await Promise.all([
        getCommunity(id), listMembers(id), myMembership(id), listCommunityPitches(id),
      ]);
      setCommunity(c); setMembers(ms); setMine(mm); setPitches(ps);
      if (user) setMyPitches(await listMyPitches(user.id));
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to load"); }
    finally { setLoading(false); }
  }, [id, user]);

  useEffect(() => { refresh(); }, [refresh]);

  if (loading) return <div className="min-h-screen bg-background"><Navbar /><div className="flex justify-center p-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div></div>;
  if (!community) return <div className="min-h-screen bg-background"><Navbar /><p className="container py-10 text-muted-foreground">Community not found.</p></div>;

  const isOwner = mine?.role === "owner";
  const isStaff = isOwner || mine?.role === "leader";
  const isActiveMember = mine?.status === "active";
  const isBanned = mine?.status === "banned";
  const isPending = mine?.status === "pending";

  const handleJoin = async () => {
    if (!user) { navigate("/auth"); return; }
    try {
      const status = await joinCommunity(id);
      toast.success(status === "pending" ? "Request sent — awaiting approval" : "You're in!");
      refresh();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not join"); }
  };

  const handleLeave = async () => {
    if (!user) return;
    try { await leaveCommunity(id, user.id); toast.success("Left community"); refresh(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not leave"); }
  };

  const memberAction = async (fn: () => Promise<void>, success: string) => {
    try { await fn(); toast.success(success); refresh(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  const handlePost = async () => {
    if (!selectedPitch) return;
    try {
      await postPitchToCommunity(id, selectedPitch);
      toast.success("Pitch posted");
      setPostOpen(false); setSelectedPitch(""); refresh();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not post"); }
  };

  const handleDeleteCommunity = async () => {
    if (!confirm("Delete this community? This cannot be undone.")) return;
    try { await deleteCommunity(id); toast.success("Deleted"); navigate("/communities"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not delete"); }
  };

  const sortedMembers = [...members].sort((a, b) => (roleRank[b.role] ?? 0) - (roleRank[a.role] ?? 0));
  const activeMembers = sortedMembers.filter((m) => m.status === "active");
  const pendingMembers = sortedMembers.filter((m) => m.status === "pending");
  const bannedMembers = sortedMembers.filter((m) => m.status === "banned");

  const availableToPost = myPitches.filter((p) => !pitches.some((cp) => cp.pitch_id === p.id));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-10 space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-3xl font-bold">{community.name}</h1>
              <Badge variant="outline" className="text-xs uppercase">
                {community.visibility === "private" ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />} {community.visibility}
              </Badge>
            </div>
            <p className="mt-1 max-w-2xl text-muted-foreground">{community.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!mine && community.visibility !== "global" && (
              <Button variant="hero" onClick={handleJoin} disabled={isBanned}>
                <UserPlus className="h-4 w-4" /> {community.visibility === "private" ? "Request to join" : "Join"}
              </Button>
            )}
            {community.visibility === "global" && !mine && user && (
              <Button variant="hero" onClick={handleJoin}><UserPlus className="h-4 w-4" /> Join</Button>
            )}
            {isPending && <Badge variant="secondary">Request pending</Badge>}
            {isBanned && <Badge variant="destructive">You are banned</Badge>}
            {isActiveMember && !isOwner && <Button variant="ghost" onClick={handleLeave}>Leave</Button>}
            {isActiveMember && <Button variant="glass" onClick={() => setPostOpen(true)}><Plus className="h-4 w-4" /> Post pitch</Button>}
          </div>
        </div>

        <Tabs defaultValue="feed">
          <TabsList>
            <TabsTrigger value="feed">Feed ({pitches.length})</TabsTrigger>
            <TabsTrigger value="members">Members ({activeMembers.length})</TabsTrigger>
            {isStaff && <TabsTrigger value="manage">Manage</TabsTrigger>}
          </TabsList>

          <TabsContent value="feed" className="mt-4">
            {pitches.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border/60 p-10 text-center text-muted-foreground">No pitches shared yet.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {pitches.map((cp) => (
                  <Card key={cp.id} className="flex flex-col gap-2 border-border/60 bg-gradient-card p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-display text-sm font-semibold">{cp.pitches?.title ?? "Untitled"}</h3>
                        <p className="text-xs text-muted-foreground">{cp.pitches?.industry}</p>
                      </div>
                      {(isStaff || cp.posted_by === user?.id) && (
                        <Button size="sm" variant="ghost" onClick={() => memberAction(() => removeCommunityPitch(cp.id), "Removed")}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    {cp.pitches?.share_token && (
                      <Link to={`/p/${cp.pitches.share_token}`} className="text-xs text-primary hover:underline">Open shared view →</Link>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="members" className="mt-4 space-y-2">
            {activeMembers.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-card p-3 text-sm">
                <div className="flex items-center gap-2">
                  {m.role === "owner" && <Crown className="h-4 w-4 text-primary" />}
                  {m.role === "leader" && <ShieldCheck className="h-4 w-4 text-primary" />}
                  <span className="font-mono text-xs text-muted-foreground">{m.user_id.slice(0, 8)}…</span>
                  <Badge variant="outline" className="text-[10px]">{m.role}</Badge>
                </div>
              </div>
            ))}
          </TabsContent>

          {isStaff && (
            <TabsContent value="manage" className="mt-4 space-y-6">
              {community.visibility === "private" && (
                <section>
                  <h3 className="mb-2 font-display text-sm font-semibold">Join requests ({pendingMembers.length})</h3>
                  {pendingMembers.length === 0 ? <p className="text-xs text-muted-foreground">No pending requests.</p> : pendingMembers.map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-lg border border-border/60 p-2 text-sm">
                      <span className="font-mono text-xs text-muted-foreground">{m.user_id.slice(0, 12)}…</span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="hero" onClick={() => memberAction(() => setMemberStatus(id, m.user_id, "active"), "Approved")}>Approve</Button>
                        <Button size="sm" variant="ghost" onClick={() => memberAction(() => removeMember(id, m.user_id), "Rejected")}>Reject</Button>
                      </div>
                    </div>
                  ))}
                </section>
              )}

              <section>
                <h3 className="mb-2 font-display text-sm font-semibold">Active members</h3>
                {activeMembers.filter((m) => m.role !== "owner" || isOwner).map((m) => (
                  <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 p-2 text-sm">
                    <div className="flex items-center gap-2">
                      {m.role === "owner" && <Crown className="h-4 w-4 text-primary" />}
                      <span className="font-mono text-xs text-muted-foreground">{m.user_id.slice(0, 12)}…</span>
                      <Badge variant="outline" className="text-[10px]">{m.role}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {isOwner && m.role === "member" && (
                        <Button size="sm" variant="ghost" onClick={() => memberAction(() => setMemberRole(id, m.user_id, "leader"), "Promoted to leader")}><ArrowUp className="h-3 w-3" /> Promote</Button>
                      )}
                      {isOwner && m.role === "leader" && (
                        <Button size="sm" variant="ghost" onClick={() => memberAction(() => setMemberRole(id, m.user_id, "member"), "Demoted")}><ArrowDown className="h-3 w-3" /> Demote</Button>
                      )}
                      {isOwner && m.role === "leader" && (
                        <Button size="sm" variant="ghost" onClick={() => { if (confirm("Transfer ownership? You will become a leader.")) memberAction(() => setMemberRole(id, m.user_id, "owner"), "Ownership transferred"); }}><Crown className="h-3 w-3" /> Transfer</Button>
                      )}
                      {m.role !== "owner" && (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => memberAction(() => removeMember(id, m.user_id), "Removed")}><UserMinus className="h-3 w-3" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => memberAction(() => setMemberStatus(id, m.user_id, "banned"), "Banned")}><Ban className="h-3 w-3" /></Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </section>

              {bannedMembers.length > 0 && (
                <section>
                  <h3 className="mb-2 font-display text-sm font-semibold">Banned ({bannedMembers.length})</h3>
                  {bannedMembers.map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-lg border border-border/60 p-2 text-sm">
                      <span className="font-mono text-xs text-muted-foreground">{m.user_id.slice(0, 12)}…</span>
                      <Button size="sm" variant="ghost" onClick={() => memberAction(() => setMemberStatus(id, m.user_id, "active"), "Unbanned")}>Unban</Button>
                    </div>
                  ))}
                </section>
              )}

              {isOwner && community.visibility !== "global" && (
                <section>
                  <h3 className="mb-2 font-display text-sm font-semibold text-destructive">Danger zone</h3>
                  <Button variant="ghost" className="text-destructive" onClick={handleDeleteCommunity}>
                    <Trash2 className="h-3 w-3" /> Delete community
                  </Button>
                </section>
              )}
            </TabsContent>
          )}
        </Tabs>

        <Dialog open={postOpen} onOpenChange={setPostOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Post a pitch to {community.name}</DialogTitle></DialogHeader>
            {availableToPost.length === 0 ? (
              <p className="text-sm text-muted-foreground">You don't have any unposted pitches. Save one from the Studio first.</p>
            ) : (
              <Select value={selectedPitch} onValueChange={setSelectedPitch}>
                <SelectTrigger><SelectValue placeholder="Pick a pitch…" /></SelectTrigger>
                <SelectContent>
                  {availableToPost.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setPostOpen(false)}>Cancel</Button>
              <Button variant="hero" onClick={handlePost} disabled={!selectedPitch}>Post</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default CommunityDetail;