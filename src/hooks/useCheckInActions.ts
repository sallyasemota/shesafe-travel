import { supabase } from '../lib/supabase'
import type { Trip } from '../types/trip'

export interface CheckInActions {
  startTimer: (durationMs: number) => Promise<void>
  checkIn: (message?: string | null) => Promise<void>
  addOneHour: () => Promise<void>
  stopTimer: () => Promise<void>
  /**
   * Demo-only: directly set the timer window (last_check_in + timer_expires_at)
   * to simulate any visual status without waiting for time to pass.
   */
  setTimerWindow: (startedAt: Date, expiresAt: Date) => Promise<void>
}

export function useCheckInActions(trip: Trip): CheckInActions {
  async function startTimer(durationMs: number) {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + durationMs)
    const { error } = await supabase
      .from('trips')
      .update({
        check_in_status: 'active',
        last_check_in: now.toISOString(),
        timer_expires_at: expiresAt.toISOString(),
      })
      .eq('id', trip.id)
    if (error) throw error
  }

  async function checkIn(message?: string | null) {
    const now = new Date()
    await supabase.from('check_ins').insert({
      trip_id: trip.id,
      status: 'safe',
      message: message?.trim() || null,
    })

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
  }

  async function addOneHour() {
    if (!trip.timer_expires_at) return
    const newExpires = new Date(
      new Date(trip.timer_expires_at).getTime() + 3_600_000,
    )
    const { error } = await supabase
      .from('trips')
      .update({ timer_expires_at: newExpires.toISOString() })
      .eq('id', trip.id)
    if (error) throw error
  }

  async function stopTimer() {
    const { error } = await supabase
      .from('trips')
      .update({
        check_in_status: 'inactive',
        timer_expires_at: null,
      })
      .eq('id', trip.id)
    if (error) throw error
  }

  async function setTimerWindow(startedAt: Date, expiresAt: Date) {
    const { error } = await supabase
      .from('trips')
      .update({
        check_in_status: 'active',
        last_check_in: startedAt.toISOString(),
        timer_expires_at: expiresAt.toISOString(),
      })
      .eq('id', trip.id)
    if (error) throw error
  }

  return { startTimer, checkIn, addOneHour, stopTimer, setTimerWindow }
}
