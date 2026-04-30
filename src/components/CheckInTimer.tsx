import { useState } from 'react'
import { useCheckInActions } from '../hooks/useCheckInActions'
import type { VisualStatus } from '../lib/tripStatus'
import type { Trip } from '../types/trip'

interface Preset {
  key: string
  label: string
  ms: number
}

const PRESETS: Preset[] = [
  { key: '1h', label: '1h', ms: 60 * 60_000 },
  { key: '2h', label: '2h', ms: 2 * 60 * 60_000 },
  { key: '4h', label: '4h', ms: 4 * 60 * 60_000 },
  { key: '8h', label: '8h', ms: 8 * 60 * 60_000 },
]

const DEMO_PRESETS: Preset[] = [
  { key: '30s', label: '30 sec', ms: 30_000 },
  { key: '1m', label: '1 min', ms: 60_000 },
]

export function CheckInTimer({
  trip,
  visualStatus,
}: {
  trip: Trip
  visualStatus: VisualStatus
}) {
  const isActive = trip.check_in_status === 'active'
  const isWarning = visualStatus === 'yellow'
  const actions = useCheckInActions(trip)

  const [presetKey, setPresetKey] = useState<string>('2h')
  const [customHours, setCustomHours] = useState('3')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function selectedMs(): number | null {
    if (presetKey === 'custom') {
      const n = parseFloat(customHours)
      if (Number.isNaN(n) || n <= 0) return null
      return n * 60 * 60_000
    }
    const p = [...PRESETS, ...DEMO_PRESETS].find((p) => p.key === presetKey)
    return p?.ms ?? null
  }

  const wrap = (label: string, fn: () => Promise<void>) => async () => {
    setError(null)
    setSubmitting(true)
    try {
      await fn()
    } catch (e) {
      setError(e instanceof Error ? e.message : `Could not ${label}.`)
    } finally {
      setSubmitting(false)
    }
  }

  const startTimer = wrap('start timer', async () => {
    const ms = selectedMs()
    if (!ms) {
      throw new Error('Pick a duration first.')
    }
    await actions.startTimer(ms)
  })

  const checkIn = wrap('check in', async () => {
    await actions.checkIn(message)
    setMessage('')
  })

  const addOneHour = wrap('extend timer', actions.addOneHour)
  const stopTimer = wrap('stop timer', actions.stopTimer)

  if (isActive) {
    return (
      <div className="space-y-4">
        <div>
          <label
            className="block text-sm font-medium text-navy mb-1"
            htmlFor="checkin-message"
          >
            Optional message (140 chars)
          </label>
          <input
            id="checkin-message"
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. At the hotel, all good"
            maxLength={140}
            className="w-full rounded-md border border-navy/15 bg-white px-3 py-2 text-sm text-navy placeholder-navy/40 focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/30"
          />
        </div>

        {isWarning ? (
          <>
            <button
              type="button"
              onClick={addOneHour}
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-5 rounded-full bg-yellow-400 text-navy font-bold text-lg shadow-md hover:bg-yellow-500 active:scale-[0.98] transition disabled:opacity-50"
            >
              <span aria-hidden>⏰</span>
              {submitting ? 'Adding…' : 'Add 1 hour'}
            </button>
            <button
              type="button"
              onClick={checkIn}
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-coral text-cream font-semibold shadow hover:opacity-90 active:scale-[0.98] transition disabled:opacity-50"
            >
              <span aria-hidden>✓</span>
              {submitting ? 'Saving…' : "I'm safe — check in"}
            </button>
            <button
              type="button"
              onClick={stopTimer}
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-white text-navy/70 border border-navy/15 font-medium px-4 py-2 hover:bg-navy/5 transition disabled:opacity-50"
            >
              <span aria-hidden>⏹</span>
              Stop timer
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={checkIn}
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-coral text-cream font-bold text-lg shadow hover:opacity-90 active:scale-[0.98] transition disabled:opacity-50"
            >
              <span aria-hidden>✓</span>
              {submitting ? 'Saving…' : "I'm safe — check in"}
            </button>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={addOneHour}
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-navy border border-navy/20 font-medium px-4 py-2 hover:bg-navy/5 transition disabled:opacity-50"
              >
                <span aria-hidden>⏰</span>
                Add 1 hour
              </button>
              <button
                type="button"
                onClick={stopTimer}
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-navy/70 border border-navy/15 font-medium px-4 py-2 hover:bg-navy/5 transition disabled:opacity-50"
              >
                <span aria-hidden>⏹</span>
                Stop timer
              </button>
            </div>
          </>
        )}

        {error && (
          <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-navy/70">
        Set a timer. Your contacts see a live countdown — if you don't check in
        before it expires, your "If I Go Missing" info is revealed.
      </p>

      <div>
        <p className="text-xs uppercase tracking-wider text-navy/60 font-semibold mb-2">
          Duration
        </p>
        <div className="grid grid-cols-5 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPresetKey(p.key)}
              className={`rounded-full px-3 py-2 text-sm font-medium border transition ${
                presetKey === p.key
                  ? 'bg-coral text-cream border-coral'
                  : 'bg-white text-navy border-navy/15 hover:bg-navy/5'
              }`}
            >
              {p.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPresetKey('custom')}
            className={`rounded-full px-3 py-2 text-sm font-medium border transition ${
              presetKey === 'custom'
                ? 'bg-coral text-cream border-coral'
                : 'bg-white text-navy border-navy/15 hover:bg-navy/5'
            }`}
          >
            Custom
          </button>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          {DEMO_PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPresetKey(p.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium border transition ${
                presetKey === p.key
                  ? 'bg-gold/40 text-navy border-gold'
                  : 'bg-white text-navy/70 border-navy/10 hover:bg-gold/10'
              }`}
              title="Demo preset — short timer for showing the escalation cascade quickly"
            >
              ⚡ {p.label} (demo)
            </button>
          ))}
        </div>

        {presetKey === 'custom' && (
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              min="0.25"
              step="0.25"
              value={customHours}
              onChange={(e) => setCustomHours(e.target.value)}
              className="w-24 rounded-md border border-navy/15 bg-white px-3 py-2 text-sm text-navy"
            />
            <span className="text-sm text-navy/70">hours</span>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={startTimer}
        disabled={submitting}
        className="w-full inline-flex items-center justify-center px-6 py-3 rounded-full bg-coral text-cream font-semibold shadow hover:opacity-90 active:scale-[0.98] transition disabled:opacity-50"
      >
        {submitting ? 'Starting…' : 'Start timer'}
      </button>

      {error && (
        <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}
    </div>
  )
}
