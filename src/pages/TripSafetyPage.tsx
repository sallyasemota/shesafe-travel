import { Link, useParams } from 'react-router-dom'
import { BriefingSection } from '../components/BriefingSection'
import { useRealtimeTrip } from '../hooks/useRealtimeTrip'
import type { EmergencyContact, RiskLevel, Trip } from '../types/trip'

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`
}

export default function TripSafetyPage() {
  const { shareCode } = useParams<{ shareCode: string }>()
  const state = useRealtimeTrip(shareCode)

  if (state.kind === 'loading') return <Loading />
  if (state.kind === 'not-found') return <NotFound />
  return <TripView trip={state.trip} />
}

function Loading() {
  return (
    <main className="min-h-full bg-cream text-navy flex items-center justify-center px-6">
      <p className="text-navy/70">Loading trip…</p>
    </main>
  )
}

function NotFound() {
  return (
    <main className="min-h-full bg-cream text-navy flex items-center justify-center px-6 py-16">
      <div className="max-w-md text-center space-y-4">
        <p className="text-sm uppercase tracking-widest text-coral font-semibold">
          404
        </p>
        <h1 className="text-3xl font-semibold">Trip not found.</h1>
        <p className="text-navy/70">Double-check your link.</p>
        <Link
          to="/"
          className="inline-block mt-2 text-coral font-medium hover:underline"
        >
          Back to SheSafe Travel
        </Link>
      </div>
    </main>
  )
}

function TripView({ trip }: { trip: Trip }) {
  const contacts = (trip.emergency_contacts ?? []).filter(
    (c): c is EmergencyContact => Boolean(c?.name && c?.phone),
  )

  return (
    <main className="min-h-full bg-cream text-navy">
      <header className="px-5 pt-8 pb-6 max-w-2xl mx-auto">
        <p className="text-xs uppercase tracking-widest text-coral font-semibold">
          SheSafe Travel
        </p>
        <h1 className="mt-2 text-3xl md:text-4xl font-semibold leading-tight">
          {trip.traveler_name}'s trip to{' '}
          <span className="text-coral">
            {trip.destination_city}, {trip.destination_country}
          </span>
        </h1>
        <p className="mt-3 text-lg text-navy/80">
          {formatDate(trip.travel_dates_start)} →{' '}
          {formatDate(trip.travel_dates_end)}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <StatusBadge />
          {trip.briefing_data?.overall_risk_level && (
            <RiskBadge level={trip.briefing_data.overall_risk_level} />
          )}
        </div>
      </header>

      <div className="px-5 pb-12 max-w-2xl mx-auto space-y-5">
        {contacts.length > 0 && (
          <Section title="Your emergency contacts">
            <ul className="space-y-3">
              {contacts.map((c, i) => (
                <li key={i}>
                  <a
                    href={telHref(c.phone)}
                    className="flex items-center justify-between gap-3 rounded-xl bg-white border border-gold/40 px-4 py-4 shadow-sm active:scale-[0.99] transition"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-lg truncate">
                        {c.name}
                      </p>
                      {c.relationship && (
                        <p className="text-sm text-navy/60 truncate">
                          {c.relationship}
                        </p>
                      )}
                      <p className="text-base text-navy/80 truncate">
                        {c.phone}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-coral text-cream font-semibold text-sm px-4 py-2">
                      Call
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section title="AI safety briefing">
          <BriefingSection data={trip.briefing_data} />
        </Section>

        <Section title="Check-in status">
          <p className="text-navy/60 italic">Check-in feature coming soon.</p>
        </Section>
      </div>

      <footer className="px-5 pb-10 max-w-2xl mx-auto text-center space-y-1">
        <p className="text-sm font-medium text-navy/70">
          Powered by SheSafe Travel
        </p>
        <p className="text-xs text-navy/50">This page updates in real-time.</p>
      </footer>
    </main>
  )
}

function StatusBadge() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-gold/30 border border-gold px-3 py-1 text-sm font-medium text-navy">
      <span className="h-2 w-2 rounded-full bg-gold" aria-hidden />
      Planning
    </span>
  )
}

const RISK_BADGE_STYLES: Record<RiskLevel, { wrap: string; dot: string }> = {
  Low: {
    wrap: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    dot: 'bg-emerald-500',
  },
  Moderate: {
    wrap: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    dot: 'bg-yellow-500',
  },
  Elevated: {
    wrap: 'bg-orange-100 text-orange-800 border-orange-300',
    dot: 'bg-orange-500',
  },
  High: {
    wrap: 'bg-red-100 text-red-800 border-red-300',
    dot: 'bg-red-500',
  },
}

function RiskBadge({ level }: { level: RiskLevel }) {
  const style = RISK_BADGE_STYLES[level]
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${style.wrap}`}
    >
      <span className={`h-2 w-2 rounded-full ${style.dot}`} aria-hidden />
      {level} risk
    </span>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl bg-white border border-navy/10 shadow-sm p-5">
      <h2 className="text-base uppercase tracking-wider text-navy/60 font-semibold mb-3">
        {title}
      </h2>
      {children}
    </section>
  )
}
