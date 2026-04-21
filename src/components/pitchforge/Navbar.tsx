import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

const Navbar = () => {
  const { pathname } = useLocation();
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </span>
          PitchForge
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="/#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="/#how" className="hover:text-foreground transition-colors">How it works</a>
          <a href="/#pricing" className="hover:text-foreground transition-colors">Pricing</a>
        </nav>
        <div className="flex items-center gap-2">
          {pathname !== "/auth" && (
            <>
              <Link to="/auth"><Button variant="ghost" size="sm">Sign in</Button></Link>
              <Link to="/dashboard"><Button variant="hero" size="sm">Open app</Button></Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;