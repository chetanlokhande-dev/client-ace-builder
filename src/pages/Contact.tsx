import { useState } from "react";
import Navbar from "@/components/pitchforge/Navbar";
import Footer from "@/components/pitchforge/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageSquare, Twitter } from "lucide-react";
import { toast } from "sonner";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.message) {
      toast.error("Please add your email and a short message.");
      return;
    }
    setSending(true);
    const subject = encodeURIComponent(`PitchForge — message from ${form.name || form.email}`);
    const body = encodeURIComponent(`${form.message}\n\n— ${form.name} <${form.email}>`);
    window.location.href = `mailto:hello@pitchforge.app?subject=${subject}&body=${body}`;
    setTimeout(() => {
      setSending(false);
      toast.success("Opening your email client…");
    }, 600);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-4xl py-16">
        <h1 className="font-display text-4xl font-bold">Contact us</h1>
        <p className="mt-2 text-muted-foreground">
          Questions, feedback, or partnership ideas? We'd love to hear from you.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-[1fr_320px]">
          <Card className="border-border/60 bg-gradient-card p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your name</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" rows={6} required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="How can we help?" />
              </div>
              <Button type="submit" variant="hero" className="w-full" disabled={sending}>
                Send message
              </Button>
            </form>
          </Card>

          <Card className="h-fit border-border/60 bg-gradient-card p-6">
            <h2 className="font-display text-lg font-semibold">Other ways to reach us</h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-primary" />
                <a href="mailto:hello@pitchforge.app" className="hover:text-foreground">hello@pitchforge.app</a>
              </li>
              <li className="flex items-center gap-3">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Replies within 1–2 business days</span>
              </li>
              <li className="flex items-center gap-3">
                <Twitter className="h-4 w-4 text-primary" />
                <a href="#" className="hover:text-foreground">@pitchforge</a>
              </li>
            </ul>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;