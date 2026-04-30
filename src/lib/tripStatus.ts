import type { Trip } from '../types/trip'

export type VisualStatus = 'inactive' | 'green' | 'yellow' | 'orange' | 'red'

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000
const FIVE_MINUTES_MS = 5 * 60 * 1000
const MAX_DEMO_GRACE_MS = 30 * 1000

/**
 * Grace period scales with the timer duration so short demo timers
 * (<5 min) cascade into RED quickly. Production timers (≥5 min) keep
 * the full 15-minute grace.
 */
export function getGracePeriodMs(
  startedMs: number,
  expiresMs: number,
): number {
  const durationMs = expiresMs - startedMs
  if (durationMs <= 0) return FIFTEEN_MINUTES_MS
  if (durationMs < FIVE_MINUTES_MS) {
    return Math.min(durationMs * 0.25, MAX_DEMO_GRACE_MS)
  }
  return FIFTEEN_MINUTES_MS
}

export function formatGracePeriod(ms: number): string {
  if (ms >= 60_000) {
    const minutes = Math.round(ms / 60_000)
    return `${minutes}-minute`
  }
  const seconds = Math.max(1, Math.round(ms / 1000))
  return `${seconds}-second`
}

export function computeVisualStatus(trip: Trip, nowMs: number): VisualStatus {
  if (
    trip.check_in_status === 'inactive' ||
    !trip.timer_expires_at ||
    !trip.last_check_in
  ) {
    return 'inactive'
  }

  const startedMs = new Date(trip.last_check_in).getTime()
  const expiresMs = new Date(trip.timer_expires_at).getTime()

  if (nowMs > expiresMs) {
    const grace = getGracePeriodMs(startedMs, expiresMs)
    return nowMs - expiresMs > grace ? 'red' : 'orange'
  }

  const total = expiresMs - startedMs
  if (total <= 0) return 'green'
  const elapsed = nowMs - startedMs
  return elapsed / total >= 0.8 ? 'yellow' : 'green'
}

export function formatCountdown(expiresMs: number, nowMs: number): string {
  const diffMs = expiresMs - nowMs
  const absMs = Math.abs(diffMs)
  const hours = Math.floor(absMs / 3_600_000)
  const minutes = Math.floor((absMs % 3_600_000) / 60_000)
  const seconds = Math.floor((absMs % 60_000) / 1000)
  const pad = (n: number) => n.toString().padStart(2, '0')
  const text = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  return diffMs < 0 ? `-${text}` : text
}

export function formatRelative(iso: string, nowMs: number): string {
  const t = new Date(iso).getTime()
  const diffMs = nowMs - t
  if (diffMs < 60_000) return 'just now'
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
