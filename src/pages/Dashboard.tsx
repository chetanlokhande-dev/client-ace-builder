import { useState } from "react";
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
import { generatePitch } from "@/lib/generatePitch";
import { Download, Loader2, Share2, Sparkles } from "lucide-react";
import { toast } from "sonner";

const INDUSTRIES = ["SaaS", "E-commerce", "Real Estate", "Startups", "Agencies"];

const Dashboard = () => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    details: "",
    links: "",
    industry: "SaaS",
  });
  const [pitch, setPitch] = useState<PitchData | null>(null);
  const [loading, setLoading] = useState(false);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const handleGenerate = () => {
    if (!form.title && !form.description) {
      toast.error("Add a title or description so we know what to pitch.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setPitch(generatePitch(form));
      setLoading(false);
      toast.success("Your pitch is ready!");
    }, 900);
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
            <Button variant="glass" disabled={!pitch} onClick={() => toast("Export coming soon")}> <Download className="h-4 w-4" /> Download PDF</Button>
            <Button variant="glass" disabled={!pitch} onClick={() => toast("Share link coming soon")}> <Share2 className="h-4 w-4" /> Share link</Button>
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
                  <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Generate pitch</>
                )}
              </Button>
            </div>
          </Card>

          {/* Preview */}
          <div>
            <PitchPreview pitch={pitch} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;