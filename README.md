# SheSafe Travel

> AI-powered travel safety companion for women — real-time briefings, check-in tracking, and emergency coordination via a single shareable link.

**Live demo:** https://shesafe-travel.vercel.app

**Pre-loaded demo trip:** https://shesafe-travel.vercel.app/trip/marrakech-demo

**Built for:** Women Build AI Build-A-Thon 2026

---

## Tech stack

- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **Database:** Supabase (PostgreSQL + Realtime subscriptions)
- **AI:** Claude API (`claude-sonnet-4-20250514`) via Vercel serverless functions
- **Live data:** Firecrawl (scrapes US State Department travel advisories, with fallback to Claude-only when unavailable)
- **PDF generation:** jsPDF (client-side, lazy-loaded)
- **Hosting:** Vercel (frontend + serverless functions)

---

## Features

There are exactly four. Everything in the app exists to serve one of these.

### 1. Shareable Trip Safety Page

Every trip lives at a unique URL like `/trip/abc12345`. Anyone with the link sees the full live page — no login, no install, no code to enter. A traveler taps **↗ Send to contacts** in the page header and her share sheet (iMessage, WhatsApp, etc.) sends the URL to mom. Mom taps it and the page opens with a live countdown, status badge, AI briefing, and emergency call buttons that auto-update via Supabase Realtime.

### 2. AI Safety Briefing

For each destination, a Claude-powered briefing covers ten sections specific to women travelers: safety overview, cultural norms, harassment & scam patterns, transport, safe areas, local emergency contacts, health & medical, communication, what to wear, and solo dining/nightlife. Plus a top-3-tips callout, a 4-phrase local-language sheet, and a color-coded risk badge (Low / Moderate / Elevated / High).

The briefing engine tries Firecrawl first to scrape the current State Department travel advisory; if that fails (timeout, page missing, etc.), the function falls back to Claude's training data. The page shows a green "Live advisory data" badge or a gold "AI knowledge" badge so viewers know the source.

Briefings are generated server-side by a Vercel function and delivered via Realtime — the create-trip page redirects immediately and the briefing appears in place ~30 seconds later without a page refresh.

### 3. Check-In Timer with Escalation

The traveler picks a duration — 1h / 2h / 4h / 8h, custom hours, or **30s / 1m demo presets** for showing the cascade quickly. Every viewer of the shared page watches the same live countdown tick down second-by-second. The status escalates through four colors:

- 🟢 **Green** — on track (most of the timer remaining)
- 🟡 **Yellow** — check in soon (last 20% of the timer; full-screen overlay + vibration on the traveler's device)
- 🟠 **Orange** — overdue (timer expired, within grace period)
- 🔴 **Red** — alert (past grace period; emergency info revealed)

At red, the page background washes red, an animated alert banner moves to the top, urgent full-width red Call buttons replace the normal emergency contact list, and the **"If she's missing"** panel reveals passport number, medical info, hotel address, and the traveler's photo — data that's hidden during normal operation.

The grace period scales with timer duration: production-length timers (≥5 min) keep a 15-minute grace, while short demo timers get a proportional grace (25% of duration, capped at 30s) so the entire cascade can be demoed in ~75 seconds.

### 4. Offline & Emergency PDF Packets

Two downloadable PDFs:

- **Offline Safety Packet** — destination, large-font emergency numbers (18pt), top tips, key local-language phrases, hotel address, your emergency contacts. Designed for printing and pulling out of a pocket at 2 AM in a foreign country.
- **Emergency "If I Go Missing" Packet** — full traveler name, passport, medical info, hotel, travel dates, local police + embassy with addresses, emergency contacts. Footer reads *"Provide this document to local police and the embassy immediately."* For handing to authorities.

Both are generated client-side with jsPDF (lazy-loaded so the trip page doesn't pay the bundle cost on first paint).

---

## Run locally

```bash
git clone https://github.com/sallyasemota/shesafe-travel.git
cd shesafe-travel
npm install
cp .env.example .env.local
# fill in the values in .env.local — see "Environment variables" below
npm run dev
```

Then open http://localhost:5173 and create a trip.

### Environment variables

See [.env.example](./.env.example). Four required:

| Variable                   | Where to get it                                          | Used by              |
| -------------------------- | -------------------------------------------------------- | -------------------- |
| `VITE_SUPABASE_URL`        | Supabase → Project Settings → API → Project URL          | Frontend + functions |
| `VITE_SUPABASE_ANON_KEY`   | Supabase → Project Settings → API → `anon` `public` key  | Frontend + functions |
| `ANTHROPIC_API_KEY`        | https://console.anthropic.com → Settings → API Keys      | `api/generate-briefing.ts` |
| `FIRECRAWL_API_KEY`        | https://firecrawl.dev → API Keys                         | `api/generate-briefing.ts` |

### Supabase one-time setup

Two tables (`trips`, `check_ins`) — see the schema reference in [CLAUDE.md](./CLAUDE.md#supabase-schema-reference). After creating them:

1. Enable Realtime on both:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
   ALTER PUBLICATION supabase_realtime ADD TABLE public.check_ins;
   ```
2. Add RLS policies that permit anonymous `INSERT` and `UPDATE` on `trips`, and `INSERT` on `check_ins`.

### Demo data

```bash
npm run seed
```

Creates `/trip/marrakech-demo` with a pre-cached briefing, an active timer (~4-hour countdown remaining), three sample check-ins, and full passport / medical / hotel details so the alert-mode reveal has something to show. Idempotent — safe to re-run.

---

## Deploy

Vercel CLI (one-shot):

```bash
npx vercel --prod
```

Set the same four environment variables on the Vercel project (Settings → Environment Variables) before the first deploy.

---

## Known limitations (hackathon scope)

A few honest caveats — for transparency, not for hiding:

- **Privacy gating on the "If I Go Missing" data is currently UI-only.** The trip page subscribes to the full `trips` row, including `passport_info`, `medical_info`, and `traveler_photo_url`. The React render hides those fields when the visual status isn't `red`, but the data is in the network response on every viewer's browser. Real gating belongs at the database layer (RLS policy or a Postgres view that returns redacted vs full payloads keyed on `check_in_status`). Treat the demo data as fictitious; don't enter real passport numbers in v1.
- **Traveler vs viewer is determined by `localStorage`.** Switching devices or clearing site data drops the "I am the traveler" flag and the timer controls disappear. Real fix is a magic-link admin token in the URL.
- **Anon Supabase key has broad permissions.** Trip INSERT and UPDATE are open. There's no rate limit on `/api/generate-briefing` (every call costs Anthropic tokens). Production would need an authenticated session and a per-IP rate limit.
- **The "notification" is a tab.** Mom must keep the trip page open. iOS Safari aggressively suspends background tabs. Real fix is SMS / email / push fallback when she goes offline.
- **AI briefings can be wrong.** Claude generates the embassy and emergency numbers from training data when Firecrawl fails. The page labels every briefing "Live advisory data" or "AI knowledge" so viewers know — but always verify critical numbers before trusting them.

## Scope

Not in scope (intentional non-goals):

- User accounts / authentication
- Group trip coordination
- Hotel booking or accommodation analysis
- Itinerary builder
- Maps or location tracking
- Push notifications, SMS, email alerts
- Payment / subscription
- Native mobile app

The shared page **is** the notification — mom keeps it open, and the live updates do the work.

---

## License

MIT — built during Women Build AI Build-A-Thon 2026.
