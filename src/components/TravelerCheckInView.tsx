import { useState } from 'react'
import { useCheckInActions } from '../hooks/useCheckInActions'
import { useCheckInHistory } from '../hooks/useCheckInHistory'
import { useNow } from '../hooks/useNow'
import {
  computeVisualStatus,
  formatCountdown,
  formatRelative,
} from '../lib/tripStatus'
import type { Trip } from '../types/trip'

const COUNTDOWN_TONE: Record<
  ReturnType<typeof computeVisualStatus>,
  string
> = {
  inactive: 'text-navy/60',
  green: 'text-navy',
  yellow: 'text-yellow-700',
  orange: 'text-orange-700',
  red: 'text-red-700',
}

export function TravelerCheckInView({ trip }: { trip: Trip }) {
  const now = useNow(1000)
  const status = computeVisualStatus(trip, now)
  const checkIns = useCheckInHistory(trip.id)
  const actions = useCheckInActions(trip)

  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [justCheckedIn, setJustCheckedIn] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const expiresMs = trip.timer_expires_at
    ? new Date(trip.timer_expires_at).getTime()
    : null

  const handleCheckIn = async () => {
    if (submitting) return
    setError(null)
    setSubmitting(true)
    try {
      await actions.checkIn(message)
      setMessage('')
      setJustCheckedIn(true)
      window.setTimeout(() => setJustCheckedIn(false), 2200)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not check in.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="px-5 pt-8 pb-12 max-w-2xl mx-auto space-y-7">
      <header className="space-y-2">
        <h1 className="font-serif font-medium text-[34px] sm:text-5xl leading-[1.1] tracking-[-0.015em]">
          Hey {trip.traveler_name}{' '}
          <span aria-hidden className="inline-block">
            👋
          </span>
        </h1>
        <p className="text-base sm:text-lg text-navy/70">
          Your trip to{' '}
          <span className="italic text-coral">
            {trip.destination_city}, {trip.destination_country}
          </span>
        </p>
      </header>

      <section className="rounded-2xl bg-white border border-navy/10 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="relative">
          <button
            type="button"
            onClick={handleCheckIn}
            disabled={submitting}
            className={`w-full inline-flex items-center justify-center gap-2 h-14 rounded-2xl font-bold text-lg shadow-[0_8px_24px_rgba(16,185,129,0.35)] transition-all duration-200 active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/40 disabled:opacity-70 disabled:cursor-not-allowed ${
              justCheckedIn
                ? 'bg-emerald-600 text-white scale-[1.02]'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white'
            }`}
          >
            {submitting ? (
              <>Checking in…</>
            ) : justCheckedIn ? (
              <>
                <span aria-hidden className="text-2xl">
                  ✓
                </span>
                Checked in!
              </>
            ) : (
              <>
                <span aria-hidden className="text-2xl">
                  ✓
                </span>
                I'm Safe
              </>
            )}
          </button>
          {justCheckedIn && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-2xl ring-4 ring-emerald-400/50 [animation:check-pulse_1.2s_ease-out]"
            />
          )}
        </div>

        <div>
          <label
            htmlFor="traveler-checkin-note"
            className="block text-sm font-medium text-navy/80 mb-1.5"
          >
            Add a note <span className="text-navy/50">(optional)</span>
          </label>
          <input
            id="traveler-checkin-note"
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g., Just had the best tagine!"
            maxLength={140}
            className="w-full rounded-xl border border-navy/15 bg-white px-4 py-3 text-[15px] text-navy placeholder-navy/40 focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/30"
          />
        </div>

        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}
      </section>

      {expiresMs && status !== 'inactive' && (
        <section className="rounded-2xl bg-cream/60 border border-gold/40 p-5 text-center space-y-1">
          <p className="text-xs uppercase tracking-wider text-navy/60 font-semibold">
            {now > expiresMs ? 'Overdue by' : 'Next check-in due in'}
          </p>
          <p
            className={`font-mono text-4xl sm:text-5xl font-bold tabular-nums ${COUNTDOWN_TONE[status]}`}
          >
            {formatCountdown(expiresMs, now)}
          </p>
          {status === 'green' && (
            <p className="text-xs text-navy/55 italic pt-1">
              Tap "I'm Safe" any time to reset the timer.
            </p>
          )}
          {status === 'yellow' && (
            <p className="text-xs text-yellow-800 font-medium pt-1">
              ⏰ Almost time — check in now.
            </p>
          )}
          {status === 'orange' && (
            <p className="text-xs text-orange-800 font-medium pt-1">
              You're overdue. A check-in clears the alert.
            </p>
          )}
          {status === 'red' && (
            <p className="text-xs text-red-700 font-medium pt-1">
              🚨 Your contacts have been alerted. Check in now to clear.
            </p>
          )}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm uppercase tracking-wider text-navy/60 font-semibold">
          Recent check-ins
        </h2>
        {checkIns.length === 0 ? (
          <p className="text-sm text-navy/55 italic">
            No check-ins yet — your first one will show up here.
          </p>
        ) : (
          <ul className="space-y-2">
            {checkIns.slice(0, 5).map((c) => (
              <li
                key={c.id}
                className="rounded-xl bg-white border border-navy/10 px-4 py-3"
              >
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <span className="text-[15px] font-semibold text-navy">
                    ✓ Checked in
                  </span>
                  <span className="text-xs text-navy/55">
                    {formatRelative(c.created_at, now)}
                  </span>
                </div>
                {c.message && (
                  <p className="text-[15px] text-navy/75 mt-1 break-words italic">
                    "{c.message}"
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
