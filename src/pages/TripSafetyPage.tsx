import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type {
  BriefingData,
  BriefingSections,
  EmergencyContact,
  RiskLevel,
  Trip,
} from '../types/trip'

type LoadState =
  | { kind: 'loading' }
  | { kind: 'ready'; trip: Trip }
  | { kind: 'not-found' }

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
  const [state, setState] = useState<LoadState>({ kind: 'loading' })

  useEffect(() => {
    if (!shareCode) {
      setState({ kind: 'not-found' })
      return
    }

    let cancelled = false

    async function load() {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('share_code', shareCode)
        .maybeSingle()

      if (cancelled) return

      if (error || !data) {
        setState({ kind: 'not-found' })
        return
      }

      setState({ kind: 'ready', trip: data as Trip })
    }

    load()
    return () => {
      cancelled = true
    }
  }, [shareCode])

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
        <div className="mt-4">
          <StatusBadge />
        </div>
      </header>

      <div className="px-5 pb-12 max-w-2xl mx-auto space-y-5">
        {contacts.length > 0 && (
          <Section title="Emergency contacts">
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
          {trip.briefing_data ? (
            <Briefing data={trip.briefing_data} />
          ) : (
            <p className="text-navy/60 italic">Safety briefing generating…</p>
          )}
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

const RISK_STYLES: Record<RiskLevel, string> = {
  Low: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  Moderate: 'bg-gold/40 text-navy border-gold',
  Elevated: 'bg-orange-100 text-orange-800 border-orange-300',
  High: 'bg-red-100 text-red-800 border-red-300',
}

const SECTION_LABELS: Array<{ key: keyof BriefingSections; label: string }> = [
  { key: 'safety_overview', label: 'Safety overview' },
  { key: 'cultural_norms_for_women', label: 'Cultural norms for women' },
  { key: 'harassment_and_scam_patterns', label: 'Harassment & scams' },
  { key: 'transport_safety', label: 'Transport safety' },
  { key: 'safe_areas', label: 'Safe areas' },
  { key: 'health_and_medical', label: 'Health & medical' },
  { key: 'communication', label: 'Communication' },
  { key: 'what_to_wear', label: 'What to wear' },
  { key: 'solo_dining_and_nightlife', label: 'Dining & nightlife' },
]

function Briefing({ data }: { data: BriefingData }) {
  const sections = data.sections ?? {}
  const emergency = sections.emergency_contacts

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {data.overall_risk_level && (
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${RISK_STYLES[data.overall_risk_level]}`}
          >
            {data.overall_risk_level} risk
          </span>
        )}
        {typeof data.risk_score === 'number' && (
          <span className="text-xs text-navy/60">
            Score {data.risk_score}/5
          </span>
        )}
        {data.data_source && (
          <span className="text-xs text-navy/50">
            Source: {data.data_source === 'live' ? 'Live advisory' : 'AI knowledge'}
          </span>
        )}
      </div>

      {data.top_3_tips && data.top_3_tips.length > 0 && (
        <div className="rounded-lg bg-coral/10 border border-coral/30 p-4">
          <p className="text-sm font-semibold text-coral mb-2">Top 3 tips</p>
          <ul className="list-decimal list-inside space-y-1 text-navy/85 text-sm">
            {data.top_3_tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-4">
        {SECTION_LABELS.map(({ key, label }) => {
          const text = sections[key]
          if (typeof text !== 'string' || !text.trim()) return null
          return (
            <div key={key}>
              <h3 className="text-sm font-semibold text-navy mb-1">{label}</h3>
              <p className="text-sm text-navy/80 whitespace-pre-line">{text}</p>
            </div>
          )
        })}
      </div>

      {emergency && (
        <div>
          <h3 className="text-sm font-semibold text-navy mb-2">
            Emergency numbers
          </h3>
          <ul className="text-sm text-navy/80 space-y-1">
            {emergency.police && <li>Police: {emergency.police}</li>}
            {emergency.ambulance && <li>Ambulance: {emergency.ambulance}</li>}
            {emergency.fire && <li>Fire: {emergency.fire}</li>}
            {emergency.us_embassy && <li>US Embassy: {emergency.us_embassy}</li>}
            {emergency.womens_crisis_line && (
              <li>Women's crisis line: {emergency.womens_crisis_line}</li>
            )}
          </ul>
        </div>
      )}

      {data.phrases_to_know && data.phrases_to_know.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-navy mb-2">
            Phrases to know
          </h3>
          <ul className="text-sm text-navy/80 space-y-1">
            {data.phrases_to_know.map((phrase, i) => (
              <li key={i}>
                <span className="font-medium">{phrase.local}</span>
                <span className="text-navy/60"> — {phrase.english}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
