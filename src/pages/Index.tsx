import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/pitchforge/Navbar";
import Footer from "@/components/pitchforge/Footer";
import heroImg from "@/assets/hero-pitch.png";
import { Check, FileText, Sparkles, Wand2, Zap, Target, Share2 } from "lucide-react";

const features = [
  { icon: Wand2, title: "AI-tailored decks", desc: "Turn one portfolio into infinite client-specific pitches in seconds." },
  { icon: Target, title: "Industry targeting", desc: "Pick your client's industry — copy and angle adapt automatically." },
  { icon: FileText, title: "Slide-ready output", desc: "Clean, structured slides you can present, export or send as a link." },
  { icon: Zap, title: "Built for speed", desc: "Stop rewriting proposals. Ship a polished pitch before your coffee cools." },
];

const steps = [
  { n: "01", title: "Drop in your portfolio", desc: "Paste links, upload files or describe your work in a few sentences." },
  { n: "02", title: "Pick the client industry", desc: "We adapt tone, examples and value props to match their world." },
  { n: "03", title: "Send the winning pitch", desc: "Preview, export to PDF or share a link. Close more deals." },
];

const plans = [
  { name: "Free", price: "$0", desc: "Try it out", features: ["3 pitches / month", "All industries", "Web preview"], cta: "Start free", highlight: false },
  { name: "Pro", price: "$19", desc: "For active freelancers", features: ["Unlimited pitches", "PDF export", "Custom branding", "Share links"], cta: "Go Pro", highlight: true },
  { name: "Premium", price: "$49", desc: "For small agencies", features: ["Everything in Pro", "Team workspace", "Client analytics", "Priority support"], cta: "Get Premium", highlight: false },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="container relative grid gap-12 py-20 lg:grid-cols-2 lg:py-28">
          <div className="flex flex-col justify-center animate-fade-in-up">
            <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> AI pitch generator for freelancers
            </span>
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              Create <span className="bg-gradient-primary bg-clip-text text-transparent">client-winning</span> pitch decks in seconds
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              PitchForge transforms your portfolio into personalized, industry-specific pitches — so you spend time delivering work, not writing proposals.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/dashboard"><Button variant="hero" size="lg">Generate your first pitch</Button></Link>
              <a href="#how"><Button variant="glass" size="lg">See how it works</Button></a>
            </div>
            <div className="mt-8 flex items-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> No credit card</div>
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> 3 free pitches</div>
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Cancel anytime</div>
            </div>
          </div>
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-primary opacity-20 blur-3xl" />
            <img
              src={heroImg}
              alt="PitchForge dashboard transforming a portfolio into a polished pitch deck"
              width={1536}
              height={1024}
              className="w-full max-w-xl rounded-2xl border border-border/60 shadow-elegant animate-float"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container py-20">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Everything you need to pitch like a pro</h2>
          <p className="mt-3 text-muted-foreground">Tools designed for freelancers, designers and small agencies who win on quality — not on writing proposals all day.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="group border-border/60 bg-gradient-card p-6 transition-all hover:-translate-y-1 hover:shadow-glow">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
                <Icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="font-display text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-border/40 bg-card/30 py-20">
        <div className="container">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">How it works</h2>
            <p className="mt-3 text-muted-foreground">From portfolio to polished pitch in three steps.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((s) => (
              <Card key={s.n} className="relative border-border/60 bg-gradient-card p-7">
                <div className="mb-4 font-display text-3xl font-bold text-transparent bg-gradient-primary bg-clip-text">{s.n}</div>
                <h3 className="font-display text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container py-20">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Simple pricing, instant ROI</h2>
          <p className="mt-3 text-muted-foreground">Land one extra client and PitchForge pays for itself.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <Card
              key={p.name}
              className={`relative border-border/60 bg-gradient-card p-7 ${p.highlight ? "ring-2 ring-primary shadow-glow" : ""}`}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-primary px-3 py-1 text-xs font-medium text-primary-foreground">Most popular</span>
              )}
              <h3 className="font-display text-xl font-semibold">{p.name}</h3>
              <p className="text-sm text-muted-foreground">{p.desc}</p>
              <div className="mt-4 flex items-end gap-1">
                <span className="font-display text-4xl font-bold">{p.price}</span>
                <span className="mb-1 text-sm text-muted-foreground">/mo</span>
              </div>
              <ul className="my-6 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> {f}</li>
                ))}
              </ul>
              <Link to="/auth"><Button variant={p.highlight ? "hero" : "glass"} className="w-full">{p.cta}</Button></Link>
            </Card>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="container pb-24">
        <Card className="relative overflow-hidden border-border/60 bg-gradient-card p-10 text-center md:p-14">
          <div className="absolute inset-0 -z-10 bg-gradient-primary opacity-10" />
          <Share2 className="mx-auto mb-4 h-8 w-8 text-primary" />
          <h2 className="font-display text-3xl font-bold md:text-4xl">Ready to win your next client?</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Generate your first tailored pitch deck — free, in under a minute.</p>
          <div className="mt-7 flex justify-center">
            <Link to="/dashboard"><Button variant="hero" size="lg">Generate your first pitch</Button></Link>
          </div>
        </Card>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
