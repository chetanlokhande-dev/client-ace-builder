import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-border/40 py-10 text-sm text-muted-foreground">
    <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
      <p>© {new Date().getFullYear()} PitchForge. Crafted for freelancers who win.</p>
      <div className="flex gap-6">
        <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
        <Link to="/terms" className="hover:text-foreground">Terms</Link>
        <Link to="/contact" className="hover:text-foreground">Contact</Link>
      </div>
    </div>
  </footer>
);

export default Footer;