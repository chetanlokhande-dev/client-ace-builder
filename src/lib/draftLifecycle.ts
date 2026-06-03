// Smart draft lifecycle for the pitch studio.
//
// We can't truly know if a tab close was intentional or accidental, but we can
// infer it from a few signals captured while the user is on the page:
//   • savedAt        — the draft was already committed to their library
//   • lastEdit       — when the form was last modified
//   • lastGenerate   — when the AI returned the latest pitch
//   • leftVia        — "nav" if they clicked an internal link/back/save,
//                       "close" if the tab was simply hidden or unloaded
//   • leftAt         — timestamp of the last "leave" event
//
// On the next mount we evaluate those signals and decide whether to keep,
// surface (with a banner) or drop the draft. This avoids the dashboard
// reopening with a stale pitch the user already finished with.

const META_KEY = "pitchforge:dashboard-draft:meta";
const DRAFT_KEY = "pitchforge:dashboard-draft";

export type LeaveReason = "nav" | "close" | "save";

export interface DraftMeta {
  createdAt?: number;
  lastEdit?: number;
  lastGenerate?: number;
  savedAt?: number;
  leftVia?: LeaveReason;
  leftAt?: number;
}

const read = (): DraftMeta => {
  try {
    const raw = localStorage.getItem(META_KEY);
    return raw ? (JSON.parse(raw) as DraftMeta) : {};
  } catch {
    return {};
  }
};

const write = (m: DraftMeta) => {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(m));
  } catch {
    /* ignore */
  }
};

export const draftMeta = {
  read,
  patch(patch: Partial<DraftMeta>) {
    write({ ...read(), ...patch });
  },
  reset() {
    try {
      localStorage.removeItem(META_KEY);
    } catch {
      /* ignore */
    }
  },
};

export const clearDraft = () => {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
  draftMeta.reset();
};

export type Verdict =
  | { action: "clear"; reason: string }
  | { action: "offer"; reason: string }
  | { action: "keep" };

const HOUR = 60 * 60 * 1000;

// Decide what to do with the stored draft when the studio mounts.
export const evaluateDraft = (hasDraft: boolean): Verdict => {
  if (!hasDraft) return { action: "keep" };
  const meta = read();
  const now = Date.now();

  // Saved successfully → no reason to revive.
  if (meta.savedAt) return { action: "clear", reason: "Already saved last time." };

  // Very old draft, regardless of intent.
  if (meta.lastEdit && now - meta.lastEdit > 7 * 24 * HOUR)
    return { action: "clear", reason: "Draft is older than a week." };

  // User left via an in-app navigation OR explicit save click recently and
  // nothing else changed since → treat as intentional, drop quietly after 2h.
  if (meta.leftVia === "nav" && meta.leftAt && now - meta.leftAt > 2 * HOUR)
    return { action: "clear", reason: "You navigated away and didn't come back." };

  // The tab was closed (likely accidental) → keep but surface a banner so the
  // user can decide.
  if (meta.leftVia === "close" && meta.leftAt && now - meta.leftAt < 48 * HOUR)
    return { action: "offer", reason: "We recovered your unsaved pitch from last session." };

  // Generated but never touched again for >1h and the tab closed → clear.
  if (
    meta.lastGenerate &&
    now - meta.lastGenerate > 1 * HOUR &&
    (!meta.lastEdit || meta.lastEdit < meta.lastGenerate)
  )
    return { action: "offer", reason: "Picked up where you left off." };

  return { action: "keep" };
};

// Wire up tab-leave detection. Returns a teardown callback.
export const installLeaveTracker = () => {
  let leftVia: LeaveReason = "close";

  const markNav = () => {
    leftVia = "nav";
  };

  const onHide = () => {
    if (document.visibilityState === "hidden") {
      draftMeta.patch({ leftVia, leftAt: Date.now() });
      leftVia = "close"; // reset for any subsequent close
    }
  };

  // Internal navigation (link clicks, back button).
  document.addEventListener("click", (e) => {
    const t = e.target as HTMLElement | null;
    if (t?.closest("a[href^='/'],a[href^='#'],button[data-nav='true']")) markNav();
  });
  window.addEventListener("popstate", markNav);
  document.addEventListener("visibilitychange", onHide);
  window.addEventListener("pagehide", onHide);

  return () => {
    window.removeEventListener("popstate", markNav);
    document.removeEventListener("visibilitychange", onHide);
    window.removeEventListener("pagehide", onHide);
  };
};