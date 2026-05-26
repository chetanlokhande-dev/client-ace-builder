import Navbar from "@/components/pitchforge/Navbar";
import Footer from "@/components/pitchforge/Footer";

const Privacy = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main className="container max-w-3xl py-16">
      <h1 className="font-display text-4xl font-bold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

      <section className="prose prose-invert mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <p>
          PitchForge ("we", "us") respects your privacy. This policy explains what data we collect when you
          use our pitch generation tools, why we collect it, and the choices you have.
        </p>

        <h2 className="font-display text-lg font-semibold text-foreground">What we collect</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Account data: email address and authentication identifiers.</li>
          <li>Pitch content you create, including portfolio details and client websites you submit.</li>
          <li>Basic analytics: pages visited, errors, and performance metrics.</li>
        </ul>

        <h2 className="font-display text-lg font-semibold text-foreground">How we use it</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>To generate and store pitches you ask us to create.</li>
          <li>To improve the product and troubleshoot issues.</li>
          <li>To send essential service notifications.</li>
        </ul>

        <h2 className="font-display text-lg font-semibold text-foreground">Third-party services</h2>
        <p>
          We use Lovable Cloud for hosting and database, AI providers for pitch generation, and Firecrawl for
          optional client-website summarization. Data is sent to these services only as needed to fulfil
          your requests.
        </p>

        <h2 className="font-display text-lg font-semibold text-foreground">Your rights</h2>
        <p>
          You can delete your pitches at any time from the History page. Contact us to request full account
          deletion or a copy of your data.
        </p>

        <h2 className="font-display text-lg font-semibold text-foreground">Contact</h2>
        <p>Questions? Reach us via the Contact page.</p>
      </section>
    </main>
    <Footer />
  </div>
);

export default Privacy;