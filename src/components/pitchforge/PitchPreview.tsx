import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export interface PitchData {
  title: string;
  industry: string;
  intro: string;
  about: string;
  projects: string;
  skills: string[];
  value: string;
  closing: string;
}

const Slide = ({ label, title, children }: { label: string; title: string; children: React.ReactNode }) => (
  <Card className="relative overflow-hidden border-border/60 bg-gradient-card p-6 shadow-elegant">
    <div className="absolute right-4 top-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</div>
    <h3 className="mb-3 bg-gradient-primary bg-clip-text font-display text-xl font-semibold text-transparent">{title}</h3>
    <div className="text-sm leading-relaxed text-foreground/90">{children}</div>
  </Card>
);

const PitchPreview = ({ pitch }: { pitch: PitchData | null }) => {
  if (!pitch) {
    return (
      <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/40 p-10 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
          <Sparkles className="h-6 w-6 text-primary-foreground" />
        </div>
        <h3 className="font-display text-lg font-semibold">Your pitch will appear here</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Fill out your portfolio details and pick a target industry. We'll generate a tailored pitch deck instantly.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 animate-fade-in-up">
      <Slide label="Slide 01 · Intro" title={pitch.title || "Hello, I'm thrilled to connect"}>
        {pitch.intro}
      </Slide>
      <Slide label="Slide 02 · About" title="About Me">
        {pitch.about}
      </Slide>
      <Slide label="Slide 03 · Projects" title={`Relevant work for ${pitch.industry}`}>
        {pitch.projects}
      </Slide>
      <Slide label="Slide 04 · Skills" title="Skills & Tools">
        <div className="flex flex-wrap gap-2">
          {pitch.skills.map((s) => (
            <span key={s} className="rounded-full border border-border/60 bg-secondary px-3 py-1 text-xs text-secondary-foreground">{s}</span>
          ))}
        </div>
      </Slide>
      <Slide label="Slide 05 · Value" title="Why this matters for you">
        {pitch.value}
      </Slide>
      <Slide label="Slide 06 · Closing" title="Let's build something great">
        {pitch.closing}
      </Slide>
    </div>
  );
};

export default PitchPreview;