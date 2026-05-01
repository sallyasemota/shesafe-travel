import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useNow } from '../hooks/useNow'
import { supabase } from '../lib/supabase'
import { computeVisualStatus, type VisualStatus } from '../lib/tripStatus'
import type { Trip } from '../types/trip'

const TRAVELER_KEY_PREFIX = 'shesafe:traveler:'

function readLocalShareCodes(): string[] {
  if (typeof window === 'undefined') return []
  const codes: string[] = []
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key && key.startsWith(TRAVELER_KEY_PREFIX)) {
        codes.push(key.slice(TRAVELER_KEY_PREFIX.length))
      }
    }
  } catch {
    // localStorage unavailable
  }
  return codes
}

function formatDateRange(startIso: string, endIso: string): string {
  try {
    const start = new Date(startIso)
    const end = new Date(endIso)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return ''
    const sameYear = start.getUTCFullYear() === end.getUTCFullYear()
    const startLabel = start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    })
    const endLabel = end.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: sameYear ? undefined : 'numeric',
      timeZone: 'UTC',
    })
    return sameYear
      ? `${startLabel} → ${endLabel}, ${end.getUTCFullYear()}`
      : `${startLabel} → ${endLabel}`
  } catch {
    return ''
  }
}

const STATUS_TONE: Record<VisualStatus, { wrap: string; dot: string; label: string }> = {
  inactive: {
    wrap: 'bg-gold/30 border-gold text-navy',
    dot: 'bg-gold',
    label: 'Planning',
  },
  green: {
    wrap: 'bg-emerald-100 border-emerald-300 text-emerald-800',
    dot: 'bg-emerald-500',
    label: 'On track',
  },
  yellow: {
    wrap: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    dot: 'bg-yellow-500',
    label: 'Check in soon',
  },
  orange: {
    wrap: 'bg-orange-100 border-orange-400 text-orange-800',
    dot: 'bg-orange-500',
    label: 'Overdue',
  },
  red: {
    wrap: 'bg-red-100 border-red-400 text-red-800',
    dot: 'bg-red-600',
    label: 'Alert',
  },
}

type LoadState =
  | { kind: 'loading' }
  | { kind: 'empty' }
  | { kind: 'ready'; trips: Trip[] }
  | { kind: 'error'; message: string }

export default function MyTrips() {
  const [state, setState] = useState<LoadState>({ kind: 'loading' })

  useEffect(() => {
    const codes = readLocalShareCodes()
    if (codes.length === 0) {
      setState({ kind: 'empty' })
      return
    }

    let active = true
    ;(async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .in('share_code', codes)
        .order('created_at', { ascending: false })

      if (!active) return
      if (error) {
        setState({ kind: 'error', message: error.message })
        return
      }
      const trips = (data ?? []) as Trip[]
      if (trips.length === 0) {
        setState({ kind: 'empty' })
        return
      }
      setState({ kind: 'ready', trips })
    })()

    return () => {
      active = false
    }
  }, [])

  return (
    <main className="min-h-full bg-cream text-navy font-sans antialiased flex flex-col">
      <header className="border-b border-navy/[0.06]">
        <div className="px-5 sm:px-8 py-5 max-w-2xl mx-auto flex items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-navy/70 hover:text-coral transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-coral/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream rounded-full px-2 py-1"
          >
            <span aria-hidden>←</span> Home
          </Link>
          <Link
            to="/"
            aria-label="SheSafe Travel — home"
            className="font-serif font-medium text-xl tracking-tight hover:opacity-80 transition-opacity"
          >
            SheSafe<span className="italic text-coral"> Travel</span>
          </Link>
        </div>
      </header>

      <section className="flex-1 px-5 sm:px-8 pt-12 pb-10 max-w-2xl mx-auto w-full">
        <div className="text-center mb-9">
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.28em] text-coral mb-4">
            Your trips
          </p>
          <h1 className="font-serif font-medium text-4xl sm:text-5xl leading-[1.1] tracking-[-0.015em]">
            My <span className="italic text-coral">trips</span>
          </h1>
          <p className="mt-4 text-base text-navy/70 max-w-md mx-auto leading-relaxed">
            Trips you've created on this device. Open one to check in or
            re-share the link.
          </p>
        </div>

        {state.kind === 'loading' && (
          <p className="text-sm text-navy/60 text-center">Loading your trips…</p>
        )}

        {state.kind === 'error' && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
            Couldn't load your trips: {state.message}
          </div>
        )}

        {state.kind === 'empty' && <EmptyState />}

        {state.kind === 'ready' && (
          <ul className="space-y-3">
            {state.trips.map((trip) => (
              <li key={trip.id}>
                <TripRow trip={trip} />
              </li>
            ))}
          </ul>
        )}

        {state.kind === 'ready' && (
          <div className="mt-8 text-center">
            <Link
              to="/create"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-coral text-cream font-semibold shadow-[0_8px_24px_rgba(224,122,95,0.30)] hover:shadow-[0_12px_32px_rgba(224,122,95,0.40)] hover:-translate-y-0.5 transition-all duration-200"
            >
              <span aria-hidden className="mr-1">
                +
              </span>
              New trip
            </Link>
          </div>
        )}
      </section>

      <footer className="px-5 sm:px-8 pb-10 max-w-2xl mx-auto w-full text-center space-y-1">
        <p className="text-xs text-navy/55">
          Built by{' '}
          <a
            href="https://www.linkedin.com/in/sallyasemota/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-navy/75 hover:text-coral underline-offset-2 hover:underline transition-colors"
          >
            Sally Asemota
          </a>
          <span className="text-navy/30 mx-1.5" aria-hidden>
            ·
          </span>
          Built for Women Build AI Build-A-Thon 2026
        </p>
        <p className="text-xs text-navy/45">
          Powered by Claude, Supabase, Firecrawl
        </p>
      </footer>
    </main>
  )
}

function EmptyState() {
  return (
    <div className="rounded-3xl bg-white border border-gold/40 px-6 py-12 sm:py-14 text-center space-y-4 shadow-sm">
      <div
        aria-hidden
        className="mx-auto inline-flex items-center justify-center w-14 h-14 rounded-full bg-coral/10 text-2xl"
      >
        🧳
      </div>
      <h2 className="font-serif font-medium text-2xl tracking-tight">
        No trips yet
      </h2>
      <p className="text-sm text-navy/65 max-w-sm mx-auto leading-relaxed">
        Trips you create on this device will live here. Set up your first one
        in about 90 seconds.
      </p>
      <div className="pt-1">
        <Link
          to="/create"
          className="inline-flex items-center justify-center px-7 py-3 rounded-full bg-coral text-cream font-semibold shadow-[0_8px_24px_rgba(224,122,95,0.30)] hover:shadow-[0_12px_32px_rgba(224,122,95,0.40)] hover:-translate-y-0.5 transition-all duration-200"
        >
          Create your first trip <span aria-hidden className="ml-1">→</span>
        </Link>
      </div>
    </div>
  )
}

function TripRow({ trip }: { trip: Trip }) {
  const now = useNow(60_000)
  const status = computeVisualStatus(trip, now)
  const tone = STATUS_TONE[status]
  return (
    <Link
      to={`/trip/${trip.share_code}`}
      className="block rounded-2xl bg-white border border-navy/10 px-5 py-4 hover:border-coral/40 hover:shadow-sm active:scale-[0.997] transition-all"
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <p className="font-serif font-medium text-xl tracking-tight text-navy">
            {trip.traveler_name}'s trip to{' '}
            <span className="italic text-coral">
              {trip.destination_city}, {trip.destination_country}
            </span>
          </p>
          <p className="text-sm text-navy/60 mt-1">
            {formatDateRange(trip.travel_dates_start, trip.travel_dates_end)}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold shrink-0 ${tone.wrap}`}
        >
          <span className={`h-2 w-2 rounded-full ${tone.dot}`} aria-hidden />
          {tone.label}
        </span>
      </div>
      <p className="text-xs text-navy/50 mt-2 font-mono break-all">
        /trip/{trip.share_code}
      </p>
    </Link>
  )
}
