const Footer = () => (
  <footer className="border-t border-border/40 py-10 text-sm text-muted-foreground">
    <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
      <p>© {new Date().getFullYear()} PitchForge. Crafted for freelancers who win.</p>
      <div className="flex gap-6">
        <a href="#" className="hover:text-foreground">Privacy</a>
        <a href="#" className="hover:text-foreground">Terms</a>
        <a href="#" className="hover:text-foreground">Contact</a>
      </div>
    </div>
  </footer>
);

export default Footer;