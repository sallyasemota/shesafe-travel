import { useState } from 'react'
import { useCheckInActions } from '../hooks/useCheckInActions'
import { useCheckInHistory } from '../hooks/useCheckInHistory'
import { useNow } from '../hooks/useNow'
import { supabase } from '../lib/supabase'
import {
  computeVisualStatus,
  formatCountdown,
  formatRelative,
} from '../lib/tripStatus'
import type { Trip } from '../types/trip'
import { SpeechIcon } from './icons'

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

function formatTripDateRange(startIso: string, endIso: string): string {
  try {
    const start = new Date(startIso)
    const end = new Date(endIso)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return ''
    const sameMonth =
      start.getUTCMonth() === end.getUTCMonth() &&
      start.getUTCFullYear() === end.getUTCFullYear()
    const month = start.toLocaleDateString('en-US', {
      month: 'short',
      timeZone: 'UTC',
    })
    const startDay = start.getUTCDate()
    const endDay = end.getUTCDate()
    const year = end.getUTCFullYear()
    if (sameMonth) return `${month} ${startDay}–${endDay}, ${year}`
    const endMonth = end.toLocaleDateString('en-US', {
      month: 'short',
      timeZone: 'UTC',
    })
    return `${month} ${startDay} – ${endMonth} ${endDay}, ${year}`
  } catch {
    return ''
  }
}

export function TravelerCheckInView({ trip }: { trip: Trip }) {
  const now = useNow(1000)
  const status = computeVisualStatus(trip, now)
  const checkIns = useCheckInHistory(trip.id, trip.share_code)
  const actions = useCheckInActions(trip)

  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState<'checkin' | 'extend' | null>(null)
  const [justCheckedIn, setJustCheckedIn] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const expiresMs = trip.timer_expires_at
    ? new Date(trip.timer_expires_at).getTime()
    : null

  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 3500)
  }

  const wrap =
    (key: 'checkin' | 'extend', fn: () => Promise<void>) =>
    async () => {
      if (busy) return
      setError(null)
      setBusy(key)
      try {
        await fn()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not update timer.')
      } finally {
        setBusy(null)
      }
    }

  const handleCheckIn = wrap('checkin', async () => {
    await actions.checkIn(message)
    setMessage('')
    setJustCheckedIn(true)
    window.setTimeout(() => setJustCheckedIn(false), 2200)
    showToast('Check-in sent! Maria and Priya can see you’re safe.')
  })

  // Inline +30 min so we don't need to thread a new method through
  // useCheckInActions just for one button.
  const handleExtendThirty = wrap('extend', async () => {
    if (!trip.timer_expires_at) return
    const newExpires = new Date(
      new Date(trip.timer_expires_at).getTime() + 30 * 60_000,
    )
    const { error: dbErr } = await supabase
      .from('trips')
      .update({ timer_expires_at: newExpires.toISOString() })
      .eq('id', trip.id)
    if (dbErr) throw dbErr
    showToast('Added 30 minutes. Maria sees the new countdown live.')
  })

  return (
    <div className="px-5 pt-8 pb-12 max-w-2xl mx-auto space-y-6 relative">
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="sticky top-2 z-20 mx-auto max-w-md rounded-full bg-emerald-600 text-white text-sm font-medium px-4 py-2.5 shadow-[0_8px_24px_rgba(16,185,129,0.35)] flex items-center justify-center gap-2 [animation:check-pulse_300ms_ease-out]"
        >
          <span aria-hidden>✓</span>
          {toast}
        </div>
      )}

      <header className="space-y-1.5">
        <h1 className="font-serif font-medium text-[28px] sm:text-4xl leading-[1.15] tracking-[-0.015em]">
          Hey {trip.traveler_name}{' '}
          <span aria-hidden className="inline-block">
            👋
          </span>
        </h1>
        <p className="text-[15px] sm:text-base text-navy/70">
          <span className="italic text-coral">
            {trip.destination_city}, {trip.destination_country}
          </span>{' '}
          <span className="text-navy/40 mx-1" aria-hidden>
            ·
          </span>{' '}
          {formatTripDateRange(trip.travel_dates_start, trip.travel_dates_end)}
        </p>
      </header>

      {expiresMs && status !== 'inactive' && (
        <section className="rounded-2xl bg-white border border-navy/10 shadow-sm p-6 text-center space-y-2">
          {trip.check_in_interval_hours && (
            <p className="text-sm text-navy/65">
              You set check-ins every{' '}
              <span className="font-semibold text-navy/85">
                {trip.check_in_interval_hours} hours
              </span>
            </p>
          )}
          <p className="text-xs uppercase tracking-wider text-navy/60 font-semibold">
            {now > expiresMs ? 'Overdue by' : 'Next check-in due in'}
          </p>
          <p
            className={`font-mono text-4xl sm:text-5xl font-bold tabular-nums ${COUNTDOWN_TONE[status]}`}
          >
            {formatCountdown(expiresMs, now)}
          </p>
          <p className="text-xs text-navy/55 leading-relaxed max-w-sm mx-auto pt-1">
            Tap "I'm Safe" before the timer runs out to let your contacts
            know you're okay.
          </p>
          <p className="text-sm text-navy/65 pt-2">
            You've checked in{' '}
            <span className="font-semibold text-navy">
              {checkIns.length} {checkIns.length === 1 ? 'time' : 'times'}
            </span>{' '}
            this trip
          </p>
        </section>
      )}

      <div className="space-y-3">
        <div className="relative">
          <button
            type="button"
            onClick={handleCheckIn}
            disabled={busy !== null}
            className={`w-full inline-flex items-center justify-center gap-2 h-14 rounded-full font-bold text-lg shadow-[0_8px_24px_rgba(34,197,94,0.35)] transition-all duration-200 active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/40 disabled:opacity-70 disabled:cursor-not-allowed ${
              justCheckedIn
                ? 'bg-emerald-600 text-white scale-[1.02]'
                : 'bg-[#22C55E] hover:bg-emerald-600 text-white'
            }`}
          >
            {busy === 'checkin' ? (
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
              className="pointer-events-none absolute inset-0 rounded-full ring-4 ring-emerald-400/50 [animation:check-pulse_1.2s_ease-out]"
            />
          )}
        </div>

        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add a note — e.g. Just arrived at the riad!"
          maxLength={140}
          className="w-full rounded-full border border-navy/15 bg-white px-5 py-3 text-[15px] text-navy placeholder-navy/40 focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/30"
        />

        <button
          type="button"
          onClick={handleExtendThirty}
          disabled={busy !== null || !trip.timer_expires_at}
          className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-coral text-coral bg-transparent font-semibold text-sm px-4 py-3 hover:bg-coral/5 active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span aria-hidden>⏰</span>
          {busy === 'extend' ? 'Adding…' : 'Add Extra Time (+30 min)'}
        </button>

        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}
      </div>

      <section className="space-y-3 pt-2">
        <h2 className="text-sm uppercase tracking-wider text-navy/60 font-semibold">
          Recent check-ins
        </h2>
        {checkIns.length === 0 ? (
          <p className="text-sm text-navy/55 italic">
            No check-ins yet — your first one will show up here.
          </p>
        ) : (
          <ul className="space-y-3">
            {checkIns.slice(0, 5).map((c) => (
              <li key={c.id} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <span className="text-[15px] font-semibold text-navy">
                    ✓ Checked in
                  </span>
                  <span className="text-xs text-navy/55">
                    {formatRelative(c.created_at, now)}
                  </span>
                </div>
                {c.message && (
                  <div className="rounded-2xl rounded-tl-md bg-coral/10 border border-coral/25 px-4 py-3 flex items-start gap-2.5 shadow-[0_1px_3px_rgba(61,64,91,0.04)]">
                    <SpeechIcon className="w-4 h-4 text-coral mt-0.5 shrink-0" />
                    <p className="text-[15px] italic text-navy/85 leading-snug break-words">
                      {c.message}
                    </p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
