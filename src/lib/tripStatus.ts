import type { Trip } from '../types/trip'

export type VisualStatus = 'inactive' | 'green' | 'yellow' | 'orange' | 'red'

export const FIFTEEN_MINUTES_MS = 15 * 60 * 1000

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
    return nowMs - expiresMs > FIFTEEN_MINUTES_MS ? 'red' : 'orange'
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
