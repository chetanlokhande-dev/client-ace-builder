import Navbar from "@/components/pitchforge/Navbar";
import Footer from "@/components/pitchforge/Footer";

const Terms = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main className="container max-w-3xl py-16">
      <h1 className="font-display text-4xl font-bold">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

      <section className="prose prose-invert mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <p>
          By using PitchForge you agree to these terms. If you do not agree, please do not use the service.
        </p>

        <h2 className="font-display text-lg font-semibold text-foreground">Use of the service</h2>
        <p>
          PitchForge generates pitch decks from the information you provide. You are responsible for
          reviewing all generated content for accuracy before sharing it with clients.
        </p>

        <h2 className="font-display text-lg font-semibold text-foreground">Accounts</h2>
        <p>
          You are responsible for safeguarding your account credentials and for all activity that occurs
          under your account.
        </p>

        <h2 className="font-display text-lg font-semibold text-foreground">Acceptable use</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>No illegal, deceptive, or infringing content.</li>
          <li>No attempts to abuse, reverse-engineer, or overload the service.</li>
          <li>No scraping of websites you don't have the right to access.</li>
        </ul>

        <h2 className="font-display text-lg font-semibold text-foreground">Beta features</h2>
        <p>
          Paid plans and certain features are still under active development and are provided "as is"
          without warranty. Free-tier usage is offered while we finalize billing.
        </p>

        <h2 className="font-display text-lg font-semibold text-foreground">Termination</h2>
        <p>
          We may suspend or terminate access for violations of these terms. You may stop using the service
          and delete your account at any time.
        </p>
      </section>
    </main>
    <Footer />
  </div>
);

export default Terms;