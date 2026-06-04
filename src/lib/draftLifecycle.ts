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
  // Rough signals used to grade intent on the next mount.
  editCount?: number;       // # of distinct edit ticks
  focusSeconds?: number;    // total time the tab spent focused on the studio
  hadPitch?: boolean;       // a generated pitch was present when leaving
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
  | { action: "offer"; reason: string; severity: "soft" | "strong"; tip?: string }
  | { action: "keep" };

const HOUR = 60 * 60 * 1000;
const MIN = 60 * 1000;

// Decide what to do with the stored draft when the studio mounts.
export const evaluateDraft = (hasDraft: boolean): Verdict => {
  if (!hasDraft) return { action: "keep" };
  const meta = read();
  const now = Date.now();
  const sinceLeave = meta.leftAt ? now - meta.leftAt : Infinity;
  const edits = meta.editCount ?? 0;
  const focus = meta.focusSeconds ?? 0;

  // Saved successfully → no reason to revive.
  if (meta.savedAt) return { action: "clear", reason: "Already saved last time." };

  // Very old draft, regardless of intent.
  if (meta.lastEdit && now - meta.lastEdit > 7 * 24 * HOUR)
    return { action: "clear", reason: "Draft is older than a week." };

  // Drafts that never went anywhere — barely typed, no generated pitch — are
  // almost certainly noise. Drop them silently on any return.
  if (edits <= 2 && focus < 20 && !meta.hadPitch && !meta.lastGenerate)
    return { action: "clear", reason: "Empty scratch draft." };

  // In-app navigation = intentional. Short hop back (<10 min) → keep silently;
  // longer absence → ask, because they may have moved on.
  if (meta.leftVia === "nav") {
    if (sinceLeave < 10 * MIN) return { action: "keep" };
    if (sinceLeave > 2 * HOUR)
      return { action: "clear", reason: "You navigated away and didn't come back." };
    return {
      action: "offer",
      severity: "soft",
      reason: "Picking up where you left off.",
      tip: "You stepped away inside the app — your draft is still here.",
    };
  }

  // Tab close = ambiguous. We grade it by how invested the user was.
  if (meta.leftVia === "close") {
    if (sinceLeave > 48 * HOUR) return { action: "clear", reason: "Old recovery window expired." };
    const invested =
      meta.hadPitch || edits >= 5 || focus >= 60 || (meta.lastGenerate ?? 0) > 0;
    if (!invested) return { action: "clear", reason: "Looked like a quick close, nothing was generated." };
    return {
      action: "offer",
      severity: meta.hadPitch ? "strong" : "soft",
      reason: meta.hadPitch
        ? "We saved your unsent pitch in case the tab closed by accident."
        : "We recovered your unsaved draft from last session.",
      tip:
        sinceLeave < 30 * MIN
          ? "Looks like the tab just closed — restore it?"
          : `From ${new Date(meta.leftAt!).toLocaleString()}`,
    };
  }

  return { action: "keep" };
};

// Wire up tab-leave detection. Returns a teardown callback.
export const installLeaveTracker = () => {
  let leftVia: LeaveReason = "close";
  let focusStart = Date.now();

  const flushFocus = () => {
    const delta = Math.max(0, Math.round((Date.now() - focusStart) / 1000));
    if (delta > 0) {
      const prev = read().focusSeconds ?? 0;
      draftMeta.patch({ focusSeconds: prev + delta });
    }
    focusStart = Date.now();
  };

  const markNav = () => {
    leftVia = "nav";
  };

  const onHide = () => {
    if (document.visibilityState === "hidden") {
      flushFocus();
      draftMeta.patch({ leftVia, leftAt: Date.now() });
      leftVia = "close"; // reset for any subsequent close
    } else {
      focusStart = Date.now();
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
    flushFocus();
    window.removeEventListener("popstate", markNav);
    document.removeEventListener("visibilitychange", onHide);
    window.removeEventListener("pagehide", onHide);
  };
};