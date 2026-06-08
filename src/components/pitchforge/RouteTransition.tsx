import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

/**
 * Route transition wrapper.
 * - Fades + slides the outgoing route out, then the incoming route in.
 * - Shows a thin top progress bar during the swap for a premium feel.
 * - Resets scroll position on navigation.
 */
export const RouteTransition = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [displayed, setDisplayed] = useState(children);
  const [stage, setStage] = useState<"in" | "out">("in");
  const [progress, setProgress] = useState(0);
  const prevKey = useRef(location.pathname);

  useEffect(() => {
    if (location.pathname === prevKey.current) {
      setDisplayed(children);
      return;
    }
    prevKey.current = location.pathname;

    // start exit + progress
    setStage("out");
    setProgress(15);
    const p1 = window.setTimeout(() => setProgress(60), 90);
    const swap = window.setTimeout(() => {
      setDisplayed(children);
      setStage("in");
      setProgress(100);
      window.scrollTo({ top: 0, behavior: "auto" });
    }, 180);
    const reset = window.setTimeout(() => setProgress(0), 520);

    return () => {
      window.clearTimeout(p1);
      window.clearTimeout(swap);
      window.clearTimeout(reset);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, children]);

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[100] h-0.5 bg-gradient-to-r from-primary/60 via-primary to-primary/60 shadow-[0_0_12px_hsl(var(--primary)/0.6)] transition-[width,opacity] duration-300 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress === 0 || progress === 100 ? 0 : 1,
        }}
      />
      <div
        key={prevKey.current}
        className={
          stage === "in"
            ? "animate-route-in motion-reduce:animate-none"
            : "animate-route-out motion-reduce:animate-none"
        }
      >
        {displayed}
      </div>
    </>
  );
};

export default RouteTransition;