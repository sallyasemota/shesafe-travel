import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Trip } from '../types/trip'

const PRESETS = [1, 2, 4, 8] as const

export function CheckInTimer({ trip }: { trip: Trip }) {
  const isActive = trip.check_in_status === 'active'

  const [preset, setPreset] = useState<number | 'custom'>(2)
  const [customHours, setCustomHours] = useState('3')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function selectedHours(): number | null {
    if (preset === 'custom') {
      const n = parseFloat(customHours)
      return Number.isNaN(n) || n <= 0 ? null : n
    }
    return preset
  }

  async function startTimer() {
    const hours = selectedHours()
    if (!hours) {
      setError('Pick a duration first.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const now = new Date()
      const expiresAt = new Date(now.getTime() + hours * 3_600_000)
      const { error } = await supabase
        .from('trips')
        .update({
          check_in_status: 'active',
          last_check_in: now.toISOString(),
          timer_expires_at: expiresAt.toISOString(),
        })
        .eq('id', trip.id)
      if (error) throw error
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start timer.')
    } finally {
      setSubmitting(false)
    }
  }

  async function checkIn() {
    setError(null)
    setSubmitting(true)
    try {
      const now = new Date()
      await supabase.from('check_ins').insert({
        trip_id: trip.id,
        status: 'safe',
        message: message.trim() || null,
      })

      // Reset timer to its original duration
      const lastMs = trip.last_check_in
        ? new Date(trip.last_check_in).getTime()
        : now.getTime()
      const expiresMs = trip.timer_expires_at
        ? new Date(trip.timer_expires_at).getTime()
        : now.getTime() + 2 * 3_600_000
      const durationMs = Math.max(expiresMs - lastMs, 60_000)
      const newExpires = new Date(now.getTime() + durationMs)

      const { error } = await supabase
        .from('trips')
        .update({
          check_in_status: 'active',
          last_check_in: now.toISOString(),
          timer_expires_at: newExpires.toISOString(),
        })
        .eq('id', trip.id)
      if (error) throw error
      setMessage('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not check in.')
    } finally {
      setSubmitting(false)
    }
  }

  async function addOneHour() {
    if (!trip.timer_expires_at) return
    setError(null)
    setSubmitting(true)
    try {
      const newExpires = new Date(
        new Date(trip.timer_expires_at).getTime() + 3_600_000,
      )
      const { error } = await supabase
        .from('trips')
        .update({ timer_expires_at: newExpires.toISOString() })
        .eq('id', trip.id)
      if (error) throw error
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not extend timer.')
    } finally {
      setSubmitting(false)
    }
  }

  async function stopTimer() {
    setError(null)
    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('trips')
        .update({
          check_in_status: 'inactive',
          timer_expires_at: null,
        })
        .eq('id', trip.id)
      if (error) throw error
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not stop timer.')
    } finally {
      setSubmitting(false)
    }
  }

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

        <button
          type="button"
          onClick={checkIn}
          disabled={submitting}
          className="w-full inline-flex items-center justify-center px-6 py-4 rounded-full bg-coral text-cream font-bold text-lg shadow hover:opacity-90 active:scale-[0.98] transition disabled:opacity-50"
        >
          {submitting ? 'Saving…' : "I'm safe — check in"}
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={addOneHour}
            disabled={submitting}
            className="rounded-full bg-white text-navy border border-navy/20 font-medium px-4 py-2 hover:bg-navy/5 transition disabled:opacity-50"
          >
            +1 hour
          </button>
          <button
            type="button"
            onClick={stopTimer}
            disabled={submitting}
            className="rounded-full bg-white text-navy/70 border border-navy/15 font-medium px-4 py-2 hover:bg-navy/5 transition disabled:opacity-50"
          >
            Stop timer
          </button>
        </div>

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
          {PRESETS.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => setPreset(h)}
              className={`rounded-full px-3 py-2 text-sm font-medium border transition ${
                preset === h
                  ? 'bg-coral text-cream border-coral'
                  : 'bg-white text-navy border-navy/15 hover:bg-navy/5'
              }`}
            >
              {h}h
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPreset('custom')}
            className={`rounded-full px-3 py-2 text-sm font-medium border transition ${
              preset === 'custom'
                ? 'bg-coral text-cream border-coral'
                : 'bg-white text-navy border-navy/15 hover:bg-navy/5'
            }`}
          >
            Custom
          </button>
        </div>
        {preset === 'custom' && (
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
