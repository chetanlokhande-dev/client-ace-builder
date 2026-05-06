## PitchForge — Presentation Speech (~2 minutes)

---

**Hello everyone — let me walk you through PitchForge, an AI-powered pitch deck generator I built.**

### What it does
PitchForge turns a freelancer's messy portfolio notes into a polished, 6-slide pitch tailored to a specific client industry. Users can save pitches, export them as PDFs, share them via public links, browse a community feed, and refine pitches using a built-in AI assistant.

### The frontend
The app is built on **React 18** with **Vite** as the build tool and **TypeScript** for type safety. I used **Tailwind CSS** with a semantic design-token system — every color and spacing value lives in one place, so the theme stays consistent across light and dark modes. UI components come from **shadcn/ui**, which gives me accessible Radix primitives I can fully customize. Routing is handled by **React Router**, and server state by **TanStack Query**.

### The backend — Lovable Cloud
For the backend I used **Lovable Cloud**, which provisions a managed Postgres database, authentication, and serverless edge functions with zero setup.

- **Authentication** — email + password signup with email verification. Sensitive actions like changing email or password require re-entering the current password.
- **Database tables** — `profiles`, `pitches`, `pitch_bookmarks`, and `pitch_ratings`.

### Security — Row-Level Security (RLS)
This is the most important piece. Instead of writing access checks in app code (which can be bypassed), I enforce them in the database itself using **RLS policies**.

For example:
- A user can only `SELECT`, `UPDATE`, or `DELETE` their own pitches — unless `is_public = true`, in which case anyone can read them.
- Bookmarks are strictly private — only the owner can see them.
- Ratings can be read by anyone for public pitches, but a user can only rate a pitch once and cannot rate their own.
- A **validation trigger** enforces that ratings stay between 1 and 5.

This means even if someone bypassed the UI and hit the database directly, they still couldn't access data that isn't theirs.

### AI integration
Two edge functions power the AI features, both calling **Gemini 2.5 Flash** through the Lovable AI Gateway — no API keys to manage:

- `generate-pitch` — turns raw input into a structured 6-slide pitch using **function calling** so the model always returns valid JSON.
- `pitch-assistant` — supports four modes: **Improvise**, **Simplify**, **Generate from a shared link**, and **Generate from skills**.

### User-facing features
- **History** — every saved pitch with PDF export (via **jsPDF**, client-side) and shareable public links.
- **Community feed** — opt-in publishing, with bookmarks and 5-star ratings, updating in **real time** via Supabase Realtime.
- **Saved** section for personal + bookmarked pitches.
- **Profile** for managing email and password securely.
- A floating **AI assistant** button on the dashboard for one-click rewrites.

### In summary
PitchForge combines a modern React frontend, a fully managed backend with database-level security through RLS, and AI that's tightly integrated without exposing any API keys to the client. The result is a product that's fast to use, secure by default, and genuinely useful.

**Thank you.**

---

*Delivery tip: ~2 minutes at a natural pace. Pause briefly between sections. Emphasize "RLS" and "function calling" — those are the two technical highlights worth landing.*
