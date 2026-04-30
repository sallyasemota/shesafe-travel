import { useNow } from '../hooks/useNow'
import {
  computeVisualStatus,
  formatCountdown,
  formatRelative,
  type VisualStatus,
} from '../lib/tripStatus'
import type { CheckIn, Trip } from '../types/trip'

type ActiveStatus = Exclude<VisualStatus, 'inactive'>

const STATUS_STYLES: Record<
  ActiveStatus,
  {
    label: string
    badge: string
    dot: string
    ring: string
    countdown: string
  }
> = {
  green: {
    label: 'On track',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    dot: 'bg-emerald-500',
    ring: 'bg-emerald-400',
    countdown: 'text-navy',
  },
  yellow: {
    label: 'Check in soon',
    badge: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    dot: 'bg-yellow-500',
    ring: 'bg-yellow-400',
    countdown: 'text-yellow-800',
  },
  orange: {
    label: 'Overdue',
    badge: 'bg-orange-100 text-orange-800 border-orange-400',
    dot: 'bg-orange-500',
    ring: 'bg-orange-400',
    countdown: 'text-orange-700',
  },
  red: {
    label: 'ALERT',
    badge: 'bg-red-100 text-red-800 border-red-400',
    dot: 'bg-red-600',
    ring: 'bg-red-500',
    countdown: 'text-red-700',
  },
}

export function TripStatusDisplay({
  trip,
  checkIns,
}: {
  trip: Trip
  checkIns: CheckIn[]
}) {
  const now = useNow(1000)
  const status = computeVisualStatus(trip, now)

  if (status === 'inactive') {
    return (
      <div className="rounded-2xl bg-white border border-navy/10 shadow-sm px-5 py-6 text-center space-y-1">
        <p className="text-sm font-medium text-navy/70">
          Check-in timer not active
        </p>
        <p className="text-xs text-navy/50">
          The traveler hasn't started a countdown yet.
        </p>
      </div>
    )
  }

  const style = STATUS_STYLES[status]
  const expiresMs = trip.timer_expires_at
    ? new Date(trip.timer_expires_at).getTime()
    : now
  const isOverdue = now > expiresMs

  const lastCheckIn = checkIns[0]

  return (
    <div
      className={`rounded-2xl border shadow-sm px-5 py-5 space-y-4 ${
        status === 'red'
          ? 'bg-red-50 border-red-300'
          : status === 'orange'
            ? 'bg-orange-50 border-orange-300'
            : 'bg-white border-navy/10'
      }`}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3" aria-hidden>
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${style.ring}`}
            />
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${style.dot}`}
            />
          </span>
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${style.badge}`}
          >
            {style.label}
          </span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-xs uppercase tracking-wider text-navy/60 mb-1">
          {isOverdue ? 'Overdue by' : 'Time remaining'}
        </p>
        <p
          className={`font-mono text-3xl sm:text-4xl font-bold tabular-nums ${style.countdown}`}
        >
          {formatCountdown(expiresMs, now)}
        </p>
      </div>

      {status === 'yellow' && (
        <div className="rounded-lg bg-yellow-100 border border-yellow-300 px-4 py-2 text-sm text-yellow-900">
          Check in soon — your timer is almost up.
        </div>
      )}
      {status === 'orange' && (
        <div className="rounded-lg bg-orange-100 border border-orange-300 px-4 py-2 text-sm text-orange-900 font-medium">
          Check-in overdue. 15-minute grace period before alert.
        </div>
      )}
      {status === 'red' && (
        <div className="rounded-lg bg-red-600 text-white px-4 py-3 text-base font-bold text-center animate-pulse">
          🚨 ALERT — Check-in missed past grace period
        </div>
      )}

      <p className="text-xs text-navy/60 text-center">
        {lastCheckIn ? (
          <>
            Last check-in: {formatRelative(lastCheckIn.created_at, now)}
            {lastCheckIn.message ? ` — "${lastCheckIn.message}"` : ''}
          </>
        ) : trip.last_check_in ? (
          <>Timer started: {formatRelative(trip.last_check_in, now)}</>
        ) : null}
      </p>
    </div>
  )
}
