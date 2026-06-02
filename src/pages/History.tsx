import { useEffect, useState } from "react";
import Navbar from "@/components/pitchforge/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { listMyPitches, setPitchPublic, type PitchRow } from "@/services/community";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ChevronDown, Globe, Lock, Download, Link2, Trash2 } from "lucide-react";
import ExpiryControl from "@/components/pitchforge/ExpiryControl";
import { formatExpiry } from "@/services/pitches";
import { buildShareUrl } from "@/services/community";
import { downloadPitchPdf } from "@/lib/pitchPdf";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const History = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [pitches, setPitches] = useState<PitchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    listMyPitches(user.id).then((p) => { setPitches(p); setLoading(false); }).catch((e) => { toast.error(e.message); setLoading(false); });
  }, [user]);

  const togglePublic = async (id: string, next: boolean) => {
    try {
      const updated = await setPitchPublic(id, next);
      setPitches((prev) => prev.map((p) => (p.id === id ? { ...p, is_public: updated.is_public } : p)));
      toast.success(next ? "Pitch published to community" : "Pitch is now private");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not update"); }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("pitches").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setPitches((p) => p.filter((x) => x.id !== id));
    toast.success("Pitch deleted");
  };

  const groups = pitches.reduce<Record<string, PitchRow[]>>((acc, p) => {
    const k = new Date(p.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" });
    (acc[k] ||= []).push(p);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-3xl py-10">
        <h1 className="mb-1 font-display text-3xl font-bold">Timeline</h1>
        <p className="mb-8 text-muted-foreground">A chronological record of every pitch you've crafted.</p>
        {loading ? (
          <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : pitches.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/60 p-10 text-center text-muted-foreground">No saved pitches yet. Generate one from your dashboard.</p>
        ) : (
          <div className="relative space-y-10 pl-6 before:absolute before:left-2 before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-border">
            {Object.entries(groups).map(([month, items]) => (
              <section key={month}>
                <h2 className="-ml-6 mb-4 flex items-center gap-3 font-display text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-glow" /> {month}
                </h2>
                <ul className="space-y-3">
                  {items.map((p) => {
                    const open = openId === p.id;
                    return (
                      <li key={p.id} className="relative">
                        <span className="absolute -left-[1.35rem] top-4 h-2 w-2 rounded-full bg-muted-foreground/40 ring-4 ring-background" />
                        <div className={cn("group rounded-xl border border-border/60 bg-card/60 transition hover:border-primary/40", open && "border-primary/40 shadow-elegant")}>
                          <button onClick={() => setOpenId(open ? null : p.id)} className="flex w-full items-center justify-between gap-3 p-4 text-left">
                            <div className="min-w-0">
                              <p className="truncate font-display text-sm font-semibold">{p.title}</p>
                              <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{new Date(p.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span>
                                <span>·</span>
                                <span className="truncate">{p.industry}</span>
                                <span>·</span>
                                <span className={cn(p.expires_at && new Date(p.expires_at).getTime() - Date.now() < 3 * 86400000 && "text-destructive")}>{formatExpiry(p.expires_at)}</span>
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="hidden items-center gap-1 rounded-full border border-border/60 px-2 py-0.5 text-[10px] uppercase text-muted-foreground sm:flex">
                                {p.is_public ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />} {p.is_public ? "Public" : "Private"}
                              </span>
                              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition", open && "rotate-180")} />
                            </div>
                          </button>
                          {open && (
                            <div className="space-y-3 border-t border-border/60 p-4 pt-3 animate-fade-in-up">
                              <p className="text-sm leading-relaxed text-foreground/85 line-clamp-4">{p.content?.intro}</p>
                              <div className="flex flex-wrap items-center gap-2">
                                <Button size="sm" variant="glass" onClick={() => downloadPitchPdf(p.content)}><Download className="h-3 w-3" /> PDF</Button>
                                <Button size="sm" variant="glass" onClick={() => { navigator.clipboard.writeText(buildShareUrl(p.share_token)); toast.success("Link copied"); }}><Link2 className="h-3 w-3" /> Copy link</Button>
                                <ExpiryControl pitchId={p.id} expiresAt={p.expires_at ?? null} />
                                <Button size="sm" variant="glass" onClick={() => togglePublic(p.id, !p.is_public)}>
                                  {p.is_public ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                                  {p.is_public ? "Make private" : "Publish"}
                                </Button>
                                <Button size="sm" variant="ghost" className="ml-auto text-destructive" onClick={() => remove(p.id)}><Trash2 className="h-3 w-3" /></Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default History;
