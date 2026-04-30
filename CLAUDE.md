# SheSafe Travel — Project Instructions for Claude Code

## Project Overview

SheSafe Travel is an AI-powered travel safety companion for women. A solo woman traveler enters her destination, gets a comprehensive safety briefing, and shares a Trip Safety Page (unique URL) with her trusted circle (mom, partner, friend). The shared page shows real-time check-ins, a countdown timer, and escalation if she doesn't check in.

**One-sentence pitch:** "One link keeps everyone who loves you in the loop."

**Built for:** Women Build AI Build-A-Thon 2026

**Submission deadline:** May 1, 2026, 3PM EST

## Tech Stack

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS
- **Database:** Supabase (PostgreSQL + Realtime subscriptions)
- **AI:** Claude API (claude-sonnet-4-20250514) via Vercel serverless functions
- **Live Data:** Firecrawl API (with Claude-only fallback if Firecrawl fails)
- **PDF:** jsPDF for offline safety packet and emergency packet
- **Hosting:** Vercel (frontend + serverless functions)
- **Version Control:** GitHub

## THE 4 FEATURES — AND NOTHING ELSE

This project has exactly 4 features. Do not build anything outside this scope.

### Feature 1: Shareable Trip Safety Page

- Unique URL (e.g., /trip/a8f3k2m1) showing all trip data
- This is THE product — the page mom/partner/friend opens
- Displays: trip details, safety briefing, check-in status, emergency contacts
- No login required to view — anyone with the link can see it

### Feature 2: AI Safety Briefing Engine

- Vercel serverless function calls Claude API
- Generates women-specific safety briefing for the destination
- Tries Firecrawl for live travel advisory data first (with fallback to Claude-only)
- Stores structured JSON briefing in Supabase
- Displayed in collapsible sections on the Trip Safety Page

### Feature 3: Check-In Timer with Escalation

- Traveler sets a countdown timer (1h, 2h, 4h, 8h, custom)
- "I'm Safe" check-in button resets the timer
- Shared page shows live countdown via Supabase Realtime
- Escalation: green (safe) → yellow (timer running) → orange (overdue) → red (alert)
- At red alert: "If I Go Missing" data (passport, medical) becomes visible on shared page

### Feature 4: PDF "If I Go Missing" Packet

- Offline Safety Packet: emergency numbers, tips, phrases (printable)
- Emergency Packet: passport info, medical info, local police instructions
- Generated client-side with jsPDF
- Download buttons on Trip Safety Page

## DO NOT BUILD THESE

- User accounts or authentication (no login)
- Group trip coordination
- Hotel/accommodation analysis or booking
- Itinerary builder or day planner
- Map integration or location tracking
- Social features (comments, reviews, community)
- Push notifications, SMS, or email alerts
- Payment or subscription features
- Chat or messaging
- Multi-language UI (English only for MVP)
- Native mobile app

If a prompt or suggestion leads toward any of the above, STOP and refocus on the 4 features.

## File Structure

```
shesafe-travel/
├── api/                              # Vercel serverless functions
│   └── generate-briefing.ts          # Claude API + Firecrawl
├── src/
│   ├── components/                   # Reusable UI components
│   │   ├── CheckInTimer.tsx          # Traveler's timer controls
│   │   ├── TripStatusDisplay.tsx     # Status + countdown for shared page
│   │   ├── BriefingSection.tsx       # Collapsible briefing section
│   │   └── EmergencyActions.tsx      # Call buttons (tel: links)
│   ├── pages/
│   │   ├── CreateTrip.tsx            # "/" — trip creation form
│   │   └── TripSafetyPage.tsx        # "/trip/:shareCode" — THE product
│   ├── lib/
│   │   ├── supabase.ts               # Supabase client
│   │   ├── generateSafetyPDF.ts      # Offline safety packet
│   │   └── generateEmergencyPDF.ts   # "If I Go Missing" packet
│   ├── hooks/
│   │   └── useRealtimeTrip.ts        # Supabase Realtime subscription hook
│   ├── types/
│   │   └── trip.ts                   # TypeScript interfaces
│   └── main.tsx                      # App entry + React Router
├── CLAUDE.md                         # This file
├── .env.local                        # Environment variables (not in git)
├── .env.example                      # Env var template (in git)
├── vercel.json                       # Vercel config
└── package.json
```

## Brand Colors

- **Coral:** #E07A5F — primary buttons, accents, CTAs
- **Navy:** #3D405B — text, headers, dark backgrounds
- **Gold:** #F2CC8F — highlights, badges, secondary accents
- **Cream:** #F4F1DE — page backgrounds
- **White:** #FFFFFF — card backgrounds

## Coding Conventions

- TypeScript strict mode
- Functional React components with hooks
- Tailwind CSS for all styling (no CSS files)
- Named exports for components
- Async/await for all async operations
- Error boundaries around API calls
- Environment variables: VITE_ prefix for client-side, no prefix for server-side (api/)

## Privacy Requirements

- All passport and medical data fields must be optional (never required)
- Passport/medical data only displayed when check_in_status === "alert" (RED)
- Privacy disclaimer text must appear on the trip creation form
- Never log sensitive data (passport numbers, medical info) to console
- Never expose API keys or sensitive data in client-side code
- Post-hackathon TODO: encrypt sensitive JSONB columns with Supabase Vault

## API Patterns

- All AI calls go through Vercel serverless functions in api/ directory
- Never call Claude API or Firecrawl directly from the frontend
- API keys are environment variables, never hardcoded
- Firecrawl calls always wrapped in try/catch with 10-second timeout
- Claude API calls use claude-sonnet-4-20250514
- All API responses return JSON with consistent structure: { success: boolean, data?: any, error?: string }

## Supabase Patterns

- Client initialized in src/lib/supabase.ts
- Use VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- Realtime subscriptions for live updates on Trip Safety Page
- RLS policies allow anonymous read via share_code
- JSONB columns for flexible data: briefing_data, emergency_contacts, medical_info, passport_info

## Supabase Schema Reference

### trips table

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key, auto-generated |
| traveler_name | TEXT | Required |
| destination_city | TEXT | Required |
| destination_country | TEXT | Required |
| travel_dates_start | DATE | Required |
| travel_dates_end | DATE | Required |
| briefing_data | JSONB | AI-generated briefing, null until generated |
| emergency_contacts | JSONB | Array of {name, phone, relationship} |
| medical_info | JSONB | {allergies, medications, blood_type, conditions} |
| share_code | TEXT | Unique, used in URL |
| check_in_status | TEXT | "inactive", "active", "overdue", "alert" |
| last_check_in | TIMESTAMPTZ | Last check-in timestamp |
| timer_expires_at | TIMESTAMPTZ | When current timer expires |
| passport_info | JSONB | {number, issuing_country, expiry_date} |
| traveler_photo_url | TEXT | URL to photo |
| traveler_phone | TEXT | Traveler's phone number |
| created_at | TIMESTAMPTZ | Auto-generated |

### check_ins table

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key, auto-generated |
| trip_id | UUID | Foreign key to trips.id |
| status | TEXT | "safe", "help", "custom" |
| message | TEXT | Optional check-in message |
| created_at | TIMESTAMPTZ | Auto-generated |

## Testing Requirements

- Test on real iPhone Safari (not just desktop Chrome)
- Test Supabase Realtime after backgrounding the tab for 2+ minutes
- Test form validation with empty and garbage inputs
- Ensure the Marrakech demo trip is always accessible at /trip/marrakech-demo
- Test all tel: links on a real phone
- Test PDF downloads on mobile
